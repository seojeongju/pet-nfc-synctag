import { getDB } from "@/lib/db";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { parseSubjectKind } from "@/lib/subject-kind";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { decodeTagPathParam, normalizeTagUid } from "@/lib/tag-uid-format";
import { buildWayfinderCompanionPath, isWayfinderCompanionInventoryAssignedKind } from "@/lib/wayfinder/companion-url";
import UnknownTagView from "./UnknownTagView";
import { buildNoIndexMetadata } from "@/lib/seo";

export const runtime = "edge";

export const dynamic = "force-dynamic";
export const metadata = buildNoIndexMetadata("링크유 태그 스캔");

export default async function TagResolvePage({ params }: { params: Promise<{ tag_id: string }> }) {
  const db = getDB();
  const { tag_id: tagIdParam } = await params;
  const normalizedTagId = normalizeTagUid(decodeTagPathParam(tagIdParam));
  const compactTagId = normalizedTagId.replace(/[^A-Z0-9]/g, "");

  type TagRow = {
    id: string;
    pet_id: string | null;
    is_active: boolean | number | null;
    assigned_subject_kind: string | null;
    pet_subject_kind: string | null;
    pet_tenant_id: string | null;
    wayfinder_spot_id: string | null;
    wf_slug: string | null;
  };

  /**
   * LEFT JOIN 사용: pet_id가 NULL인 신규 판매 태그(미연결)도 조회 가능.
   * 기존 INNER JOIN이면 pet_id 없는 태그는 항상 null 반환 → UnknownTagView로 잘못 분기됨.
   */
  let tag: TagRow | null = null;
  try {
    tag = await db
      .prepare(
        `SELECT t.id, t.pet_id, t.is_active, t.assigned_subject_kind,
                t.wayfinder_spot_id,
                p.subject_kind AS pet_subject_kind,
                p.tenant_id AS pet_tenant_id,
                w.slug AS wf_slug
         FROM tags t
         LEFT JOIN pets p ON p.id = t.pet_id
         LEFT JOIN wayfinder_spots w ON w.id = t.wayfinder_spot_id
         WHERE t.id = ?`
      )
      .bind(normalizedTagId)
      .first<TagRow>();
  } catch {
    tag = null;
  }

  if (!tag) {
    try {
      tag = await db
        .prepare(
          `SELECT t.id, t.pet_id, t.is_active, t.assigned_subject_kind,
                  t.wayfinder_spot_id,
                  p.subject_kind AS pet_subject_kind,
                  p.tenant_id AS pet_tenant_id,
                  w.slug AS wf_slug
           FROM tags t
           LEFT JOIN pets p ON p.id = t.pet_id
           LEFT JOIN wayfinder_spots w ON w.id = t.wayfinder_spot_id
           WHERE UPPER(REPLACE(REPLACE(REPLACE(t.id, ':', ''), '-', ''), '_', '')) = ?`
        )
        .bind(compactTagId)
        .first<TagRow>();
    } catch {
      tag = null;
    }
  }

  /**
   * UID가 DB에 아예 없는 경우 = 미등록 태그 (위조·타사 태그 등)
   * → UnknownTagView 표시 + 접근 로그 기록
   */
  if (!tag) {
    const headerList = await headers();
    const ip = headerList.get("x-real-ip") || headerList.get("cf-connecting-ip") || "unknown";
    const userAgent = headerList.get("user-agent") || "unknown";
    await db
      .prepare(
        "INSERT INTO unknown_tag_accesses (tag_uid, ip_address, user_agent) VALUES (?, ?, ?)"
      )
      .bind(normalizedTagId, ip, userAgent)
      .run()
      .catch(() => {});
    return <UnknownTagView tagId={normalizedTagId} />;
  }

  /** 링크유-동행 인벤토리 태그: GPS·근처 역 안내(메인). 별도 관리대상(pet) 없음 */
  const wfSpotId = (tag.wayfinder_spot_id ?? "").trim();
  if (wfSpotId) {
    redirect(buildWayfinderCompanionPath(tag.id, tag.wf_slug));
  }
  if (isWayfinderCompanionInventoryAssignedKind(tag.assigned_subject_kind)) {
    redirect(buildWayfinderCompanionPath(tag.id, tag.wf_slug));
  }

  /**
   * UID가 DB에 있지만 아직 보호자가 연결하지 않은 태그 = 신규 판매 태그
   * → 앱 메인페이지로 리다이렉트 (tag UID 전달: 로그인 후 연결 유도)
   */
  if (!tag.pet_id) {
    const qs = new URLSearchParams({ tag: tag.id, action: "activate" });
    redirect(`/?${qs.toString()}`);
  }

  /** 0 / false만 비활성. null·undefined(구 스키마)는 활성으로 간주 */
  const explicitlyInactive = tag.is_active === 0 || tag.is_active === false;
  if (explicitlyInactive) {
    return <UnknownTagView tagId={tag.id} />;
  }

  const headerList = await headers();
  const ip = headerList.get("x-real-ip") || headerList.get("cf-connecting-ip") || "unknown";
  const userAgent = headerList.get("user-agent") || "unknown";

  await db
    .prepare(
      "INSERT INTO scan_logs (tag_id, ip_address, user_agent) VALUES (?, ?, ?)"
    )
    .bind(tag.id, ip, userAgent)
    .run()
    .catch((e) => {
      console.error("[tag-resolve] scan_logs insert failed (non-fatal):", e);
    });

  // 발견자·리다이렉트: 연결된 관리 대상(프로필)의 subject_kind가 본질.
  const effectiveKind = parseSubjectKind(tag.pet_subject_kind ?? "pet");
  const tenantForLinks =
    typeof tag.pet_tenant_id === "string" && tag.pet_tenant_id.trim() ? tag.pet_tenant_id.trim() : null;

  type SessionUser = { id: string } | null;
  let session: SessionUser = null;
  try {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const s = await auth.api.getSession({ headers: await headers() });
    session = s && s.user ? { id: s.user.id } : null;
  } catch (e) {
    console.error("[tag-resolve] session lookup (non-fatal, continue to public profile):", e);
  }

  if (session?.id) {
    const owner = await db
      .prepare("SELECT owner_id FROM pets WHERE id = ?")
      .bind(tag.pet_id)
      .first<{ owner_id: string }>()
      .catch((e) => {
        console.error("[tag-resolve] owner lookup (non-fatal):", e);
        return null;
      });
    if (owner?.owner_id === session.id) {
      const dashQs = new URLSearchParams({ kind: effectiveKind });
      if (tenantForLinks) dashQs.set("tenant", tenantForLinks);
      redirect(`/dashboard?${dashQs.toString()}`);
    }
  }

  const profileQs = new URLSearchParams();
  profileQs.set("tag", tag.id);
  profileQs.set("kind", effectiveKind);
  profileQs.set("from", "scan");
  if (tenantForLinks) profileQs.set("tenant", tenantForLinks);
  redirect(`/profile/${tag.pet_id}?${profileQs.toString()}`);
}
