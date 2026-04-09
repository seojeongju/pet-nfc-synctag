import { getDB } from "@/lib/db";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import type { ModeAnnouncementRow } from "@/types/mode-announcement";

/** Guardian dashboard + bell API: published mode announcements, optional batch + optional tenant targeting */
export async function fetchVisibleAnnouncementsForGuardian(
  ownerId: string,
  subjectKind: SubjectKind,
  tenantId?: string
): Promise<ModeAnnouncementRow[]> {
  const db = getDB();
  const kind = parseSubjectKind(subjectKind);
  const tenant = (tenantId ?? "").trim();

  try {
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
          m.target_tenant_id IS NULL
          OR (? != '' AND m.target_tenant_id = ?)
        )
        AND (
          m.target_batch_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM tags t
            INNER JOIN pets p ON t.pet_id = p.id
            WHERE p.owner_id = ?
              AND (
                (? != '' AND p.tenant_id = ?)
                OR (? = '' AND (p.tenant_id IS NULL OR p.tenant_id = ''))
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
      .bind(kind, tenant, tenant, ownerId, tenant, tenant, tenant)
      .all<ModeAnnouncementRow>();

    return results ?? [];
  } catch (e) {
    console.error("[fetchVisibleAnnouncementsForGuardian]", e);
    return [];
  }
}
