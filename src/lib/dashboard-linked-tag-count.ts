import type { SubjectKind } from "@/lib/subject-kind";
import type { D1Database } from "@cloudflare/workers-types";

/** 모드·테넌트 범위에서 pet_id가 연결된 태그 개수 */
export async function getLinkedTagCountByScope(
  db: D1Database,
  ownerId: string,
  subjectKind: SubjectKind,
  tenantId?: string | null
): Promise<number> {
  const tenant = (tenantId ?? "").trim();
  const query = tenant
    ? `SELECT COUNT(*) AS count
       FROM tags t
       INNER JOIN pets p ON p.id = t.pet_id
       WHERE p.owner_id = ?
         AND p.tenant_id = ?
         AND p.subject_kind = ?
         AND t.pet_id IS NOT NULL`
    : `SELECT COUNT(*) AS count
       FROM tags t
       INNER JOIN pets p ON p.id = t.pet_id
       WHERE p.owner_id = ?
         AND p.tenant_id IS NULL
         AND p.subject_kind = ?
         AND t.pet_id IS NOT NULL`;

  const row = await (tenant
    ? db.prepare(query).bind(ownerId, tenant, subjectKind)
    : db.prepare(query).bind(ownerId, subjectKind)
  ).first<{ count?: number | string | null }>();

  const count = Number(row?.count ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
