import { getDB } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { parseSubjectKind } from "@/lib/subject-kind";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { normalizeTagUid } from "@/lib/tag-uid-format";

export const runtime = "edge";

export default async function TagResolvePage({ params }: { params: Promise<{ tag_id: string }> }) {
  const db = getDB();
  const { tag_id } = await params;
  const normalizedTagId = normalizeTagUid(tag_id);
  const compactTagId = normalizedTagId.replace(/[^A-Z0-9]/g, "");

  type TagRow = {
    id: string;
    pet_id: string;
    is_active: boolean;
    assigned_subject_kind: string | null;
    pet_subject_kind: string;
    pet_tenant_id: string | null;
  };

  let tag: TagRow | null = null;
  try {
    tag = await db
      .prepare(
        `SELECT t.id, t.pet_id, t.is_active, t.assigned_subject_kind,
                COALESCE(p.subject_kind, 'pet') AS pet_subject_kind,
                p.tenant_id AS pet_tenant_id
         FROM tags t
         INNER JOIN pets p ON p.id = t.pet_id
         WHERE UPPER(REPLACE(REPLACE(REPLACE(t.id, ':', ''), '-', ''), '_', '')) = ?`
      )
      .bind(compactTagId)
      .first<TagRow>();
  } catch {
    tag = await db
      .prepare(
        `SELECT t.id, t.pet_id, t.is_active, NULL AS assigned_subject_kind,
                COALESCE(p.subject_kind, 'pet') AS pet_subject_kind,
                p.tenant_id AS pet_tenant_id
         FROM tags t
         INNER JOIN pets p ON p.id = t.pet_id
         WHERE UPPER(REPLACE(REPLACE(REPLACE(t.id, ':', ''), '-', ''), '_', '')) = ?`
      )
      .bind(compactTagId)
      .first<TagRow>();
  }

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
    notFound();
  }

  if (!tag.pet_id || !tag.is_active) {
    notFound();
  }

  const headerList = await headers();
  const ip = headerList.get("x-real-ip") || headerList.get("cf-connecting-ip") || "unknown";
  const userAgent = headerList.get("user-agent") || "unknown";

  await db
    .prepare(
      "INSERT INTO scan_logs (tag_id, ip_address, user_agent) VALUES (?, ?, ?)"
    )
    .bind(tag.id, ip, userAgent)
    .run();

  const effectiveKind = parseSubjectKind(
    tag.assigned_subject_kind ?? tag.pet_subject_kind
  );
  const tenantForLinks =
    typeof tag.pet_tenant_id === "string" && tag.pet_tenant_id.trim() ? tag.pet_tenant_id.trim() : null;

  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.id) {
    const owner = await db
      .prepare("SELECT owner_id FROM pets WHERE id = ?")
      .bind(tag.pet_id)
      .first<{ owner_id: string }>();
    if (owner?.owner_id === session.user.id) {
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
