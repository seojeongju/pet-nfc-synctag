import type { D1Database } from "@cloudflare/workers-types";
import type { SubjectKind } from "@/lib/subject-kind";
import { parseSubjectKind } from "@/lib/subject-kind";

/** RSC에서 직접 호출 (use server 액션 파일과 분리) */
export async function getScanLogsWithDb(
  db: D1Database,
  ownerId: string,
  subjectKind: SubjectKind = "pet",
  tenantId?: string,
  limit: number = 20,
  offset: number = 0
) {
  const kind = parseSubjectKind(subjectKind);
  const tenant = (tenantId ?? "").trim();
  const query = tenant
    ? `
    SELECT 
      sl.*, 
      p.name as pet_name, 
      p.photo_url as pet_photo,
      p.id as pet_id,
      t.id as tag_id
    FROM scan_logs sl
    JOIN tags t ON sl.tag_id = t.id
    JOIN pets p ON t.pet_id = p.id
    WHERE p.owner_id = ?
      AND p.tenant_id = ?
      AND COALESCE(p.subject_kind, 'pet') = ?
    ORDER BY sl.scanned_at DESC
    LIMIT ? OFFSET ?
  `
    : `
    SELECT 
      sl.*, 
      p.name as pet_name, 
      p.photo_url as pet_photo,
      p.id as pet_id,
      t.id as tag_id
    FROM scan_logs sl
    JOIN tags t ON sl.tag_id = t.id
    JOIN pets p ON t.pet_id = p.id
    WHERE p.owner_id = ?
      AND p.tenant_id IS NULL
      AND COALESCE(p.subject_kind, 'pet') = ?
    ORDER BY sl.scanned_at DESC
    LIMIT ? OFFSET ?
  `;
  const stmt = db.prepare(query);
  const { results } = await (tenant
    ? stmt.bind(ownerId, tenant, kind, limit, offset)
    : stmt.bind(ownerId, kind, limit, offset)
  ).all();

  return results ?? [];
}

export async function getScanLogsCountWithDb(
  db: D1Database,
  ownerId: string,
  subjectKind: SubjectKind = "pet",
  tenantId?: string
): Promise<number> {
  const kind = parseSubjectKind(subjectKind);
  const tenant = (tenantId ?? "").trim();
  const query = tenant
    ? `
    SELECT COUNT(*) as count
    FROM scan_logs sl
    JOIN tags t ON sl.tag_id = t.id
    JOIN pets p ON t.pet_id = p.id
    WHERE p.owner_id = ?
      AND p.tenant_id = ?
      AND COALESCE(p.subject_kind, 'pet') = ?
  `
    : `
    SELECT COUNT(*) as count
    FROM scan_logs sl
    JOIN tags t ON sl.tag_id = t.id
    JOIN pets p ON t.pet_id = p.id
    WHERE p.owner_id = ?
      AND p.tenant_id IS NULL
      AND COALESCE(p.subject_kind, 'pet') = ?
  `;
  const row = await (tenant
    ? db.prepare(query).bind(ownerId, tenant, kind).first<{ count: number }>()
    : db.prepare(query).bind(ownerId, kind).first<{ count: number }>()
  );
  return row?.count ?? 0;
}