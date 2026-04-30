import type { D1Database } from "@cloudflare/workers-types";
import type { SubjectKind } from "@/lib/subject-kind";
import { parseSubjectKind } from "@/lib/subject-kind";
import { assertMigration0008Applied } from "@/lib/db-migration-0008";

function sanitizeFlightString(value: unknown, maxLen = 20_000): string {
  if (value == null) return "";
  const s = typeof value === "string" ? value : String(value);
  const clipped = s.length > maxLen ? s.slice(0, maxLen) : s;
  return clipped.replace(/[\uD800-\uDFFF]/g, "\uFFFD");
}

function sanitizeFlightUrl(value: unknown): string | null {
  const s = sanitizeFlightString(value, 4096).trim();
  if (!s) return null;
  const head = s.slice(0, 12).toLowerCase();
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  if (head.startsWith("https://") || head.startsWith("http://")) return s;
  return null;
}

/** D1 행을 RSC 직렬화에 안전한 순수 JSON 형태로 맞춤 */
function normalizePetListRow(row: Record<string, unknown>) {
  const id = sanitizeFlightString(row.id).trim();
  const rawSk = row.subject_kind;
  const skTrim =
    rawSk == null ? null : sanitizeFlightString(rawSk).trim() || null;
  return {
    id,
    name: sanitizeFlightString(row.name),
    breed: row.breed == null ? null : sanitizeFlightString(row.breed),
    photo_url: row.photo_url == null ? null : sanitizeFlightUrl(row.photo_url),
    /** 0 = 안전, 1 = 실종 신고 중 */
    is_lost: row.is_lost == null ? 0 : Number(row.is_lost),
    subject_kind: parseSubjectKind(skTrim ?? undefined),
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
    ? "SELECT * FROM pets WHERE owner_id = ? AND tenant_id = ? AND subject_kind = ? ORDER BY created_at DESC"
    : "SELECT * FROM pets WHERE owner_id = ? AND tenant_id IS NULL AND subject_kind = ? ORDER BY created_at DESC";
  const stmt = db.prepare(query);
  const { results } = await (tenant
    ? stmt.bind(ownerId, tenant, kind)
    : stmt.bind(ownerId, kind)
  ).all();
  const raw = (results ?? []) as Record<string, unknown>[];
  return raw.map(normalizePetListRow).filter((p) => p.id.length > 0);
}
