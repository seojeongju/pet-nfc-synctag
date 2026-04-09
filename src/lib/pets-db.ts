import type { D1Database } from "@cloudflare/workers-types";
import type { SubjectKind } from "@/lib/subject-kind";
import { parseSubjectKind } from "@/lib/subject-kind";
import { assertMigration0008Applied } from "@/lib/db-migration-0008";

/** D1 행을 RSC 직렬화에 안전한 순수 JSON 형태로 맞춤 */
function normalizePetListRow(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    name: row.name == null ? "" : String(row.name),
    breed: row.breed == null ? null : String(row.breed),
    photo_url: row.photo_url == null ? null : String(row.photo_url),
  };
}

/** RSC에서 직접 호출 — app/actions/pet.ts의 use server와 분리 */
export async function getPetsWithDb(
  db: D1Database,
  ownerId: string,
  subjectKind: SubjectKind = "pet",
  tenantId?: string
) {
  await assertMigration0008Applied(db);
  const kind = parseSubjectKind(subjectKind);
  const tenant = (tenantId ?? "").trim();
  const query = tenant
    ? "SELECT * FROM pets WHERE owner_id = ? AND tenant_id = ? AND COALESCE(subject_kind, 'pet') = ? ORDER BY created_at DESC"
    : "SELECT * FROM pets WHERE owner_id = ? AND tenant_id IS NULL AND COALESCE(subject_kind, 'pet') = ? ORDER BY created_at DESC";
  const stmt = db.prepare(query);
  const { results } = await (tenant
    ? stmt.bind(ownerId, tenant, kind)
    : stmt.bind(ownerId, kind)
  ).all();
  const raw = (results ?? []) as Record<string, unknown>[];
  return raw.map(normalizePetListRow);
}