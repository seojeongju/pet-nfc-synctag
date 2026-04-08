"use server";

import { getDB, getR2 } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { nanoid } from "nanoid";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import type { ModeAnnouncementAttachmentKind, ModeAnnouncementRow, ModeAnnouncementStatus } from "@/types/mode-announcement";

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

async function assertAdminRole() {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("인증이 필요합니다.");
  const row = await getDB()
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  if (row?.role !== "admin") throw new Error("관리자만 사용할 수 있습니다.");
  return session;
}

async function getActorEmailSafe() {
  try {
    const context = getRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.email ?? "system";
  } catch {
    return "system";
  }
}

function attachmentKindFromMime(mime: string): ModeAnnouncementAttachmentKind {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  return null;
}

/** 관리자: 공지용 이미지/PDF 업로드 → `/api/r2/...` 경로 반환 */
export async function uploadModeAnnouncementFile(formData: FormData) {
  await assertAdminRole();
  const file = formData.get("file") as File | null;
  if (!file?.size) throw new Error("파일을 선택해 주세요.");
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error("파일은 15MB 이하만 업로드할 수 있습니다.");

  const mime = file.type || "application/octet-stream";
  const kind = attachmentKindFromMime(mime);
  if (!kind) throw new Error("이미지(JPEG/PNG/WebP) 또는 PDF만 업로드할 수 있습니다.");

  const r2 = getR2();
  const safeName = file.name.replace(/[^\w.\-()가-힣]/g, "_").slice(0, 120);
  const key = `announcements/${nanoid()}-${safeName}`;
  const buf = await file.arrayBuffer();
  await r2.put(key, buf, { httpMetadata: { contentType: mime } });

  return {
    publicPath: `/api/r2/${key}` as const,
    r2Key: key,
    mime,
    kind,
  };
}

export type SaveModeAnnouncementInput = {
  /** 수정 시에만 전달 */
  id?: string;
  subject_kind: SubjectKind;
  /** 비우면 해당 모드 전체 */
  target_batch_id: string | null;
  title: string;
  body: string | null;
  link_url: string | null;
  attachment_r2_key: string | null;
  attachment_mime: string | null;
  attachment_kind: ModeAnnouncementAttachmentKind;
  priority: number;
  status: ModeAnnouncementStatus;
  published_at: string | null;
  expires_at: string | null;
};

export async function saveModeAnnouncement(input: SaveModeAnnouncementInput) {
  const session = await assertAdminRole();
  const db = getDB();
  const kind = parseSubjectKind(input.subject_kind);
  const title = input.title.trim();
  if (!title) throw new Error("제목을 입력해 주세요.");

  const batch = input.target_batch_id?.trim() || null;
  const body = input.body?.trim() || null;
  const link = input.link_url?.trim() || null;
  const pri = Number.isFinite(input.priority) ? Math.round(input.priority) : 0;
  const status = input.status;
  const normDt = (s: string | null | undefined) => {
    const t = s?.trim();
    if (!t) return null;
    return t.includes("T") ? t.replace("T", " ") : t;
  };
  const pubAt = normDt(input.published_at);
  const expAt = normDt(input.expires_at);
  const email = (await getActorEmailSafe()) || session.user.email || null;

  const attKey = input.attachment_r2_key?.trim() || null;
  const attMime = input.attachment_mime?.trim() || null;
  const attKind = attKey ? input.attachment_kind : null;

  const id = input.id?.trim() || nanoid();

  let effectivePubAt = pubAt;
  if (status === "published" && !effectivePubAt) {
    effectivePubAt = new Date().toISOString().replace("T", " ").substring(0, 19);
  }

  if (input.id) {
    await db
      .prepare(
        `UPDATE mode_announcements SET
          subject_kind = ?, target_batch_id = ?, title = ?, body = ?, link_url = ?,
          attachment_r2_key = ?, attachment_mime = ?, attachment_kind = ?,
          status = ?, priority = ?, published_at = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
      )
      .bind(kind, batch, title, body, link, attKey, attMime, attKind, status, pri, effectivePubAt, expAt, id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO mode_announcements (
          id, subject_kind, target_batch_id, title, body, link_url,
          attachment_r2_key, attachment_mime, attachment_kind,
          status, priority, published_at, expires_at, created_by_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        kind,
        batch,
        title,
        body,
        link,
        attKey,
        attMime,
        attKind,
        status,
        pri,
        effectivePubAt,
        expAt,
        email
      )
      .run();
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  return { id };
}

export async function deleteModeAnnouncement(id: string) {
  await assertAdminRole();
  const db = getDB();
  const row = await db.prepare("SELECT attachment_r2_key FROM mode_announcements WHERE id = ?").bind(id).first<{ attachment_r2_key: string | null }>();
  await db.prepare("DELETE FROM mode_announcements WHERE id = ?").bind(id).run();
  if (row?.attachment_r2_key) {
    try {
      await getR2().delete(row.attachment_r2_key);
    } catch {
      /* ignore */
    }
  }
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function listModeAnnouncementsForAdmin(): Promise<ModeAnnouncementRow[]> {
  await assertAdminRole();
  const db = getDB();
  const { results } = await db
    .prepare(
      `SELECT * FROM mode_announcements ORDER BY updated_at DESC, created_at DESC LIMIT 200`
    )
    .all<ModeAnnouncementRow>()
    .catch(() => ({ results: [] as ModeAnnouncementRow[] }));
  return results;
}

/**
 * 보호자 대시보드: 모드 일치 + 발행 중 + 배치 타겟(있으면 사용자 태그에 해당 배치가 있을 때만)
 */
export async function listVisibleAnnouncementsForGuardian(
  ownerId: string,
  subjectKind: SubjectKind,
  tenantId?: string
): Promise<ModeAnnouncementRow[]> {
  const db = getDB();
  const kind = parseSubjectKind(subjectKind);
  const tenant = (tenantId ?? "").trim();

  const { results } = await db
    .prepare(
      `
      SELECT m.*
      FROM mode_announcements m
      WHERE m.status = 'published'
        AND m.subject_kind = ?
        AND (m.published_at IS NULL OR datetime(m.published_at) <= datetime('now'))
        AND (m.expires_at IS NULL OR datetime(m.expires_at) > datetime('now'))
        AND (
          m.target_batch_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM tags t
            INNER JOIN pets p ON t.pet_id = p.id
            WHERE p.owner_id = ?
              AND (
                (? <> '' AND p.tenant_id = ?)
                OR (? = '' AND p.tenant_id IS NULL)
              )
              AND t.batch_id IS NOT NULL
              AND t.batch_id = m.target_batch_id
              AND COALESCE(p.subject_kind, 'pet') = m.subject_kind
          )
        )
      ORDER BY m.priority DESC, datetime(COALESCE(m.published_at, m.created_at)) DESC
      LIMIT 20
    `
    )
    .bind(kind, ownerId, tenant, tenant, tenant)
    .all<ModeAnnouncementRow>()
    .catch(() => ({ results: [] as ModeAnnouncementRow[] }));

  return results;
}
