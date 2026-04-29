import type { D1Database } from "@cloudflare/workers-types";

/**
 * 조직이 출고·등록한 태그(tags.tenant_id = tenantId)로 관리 대상에 연결된
 * 최종 보호자(user) 목록. 조직 멤버(tenant_members)와 별개 스코프.
 */
export type TenantTagCustomerRow = {
  user_id: string;
  email: string;
  name: string | null;
  linked_tag_count: number;
  first_linked_at: string | null;
  last_linked_at: string | null;
};

export async function queryTenantTagConnectedUsers(
  db: D1Database,
  tenantId: string
): Promise<TenantTagCustomerRow[]> {
  const tid = tenantId.trim();
  if (!tid) return [];

  const rows = await db
    .prepare(
      `SELECT
         u.id AS user_id,
         u.email AS email,
         u.name AS name,
         COUNT(t.id) AS linked_tag_count,
         MIN(t.updated_at) AS first_linked_at,
         MAX(t.updated_at) AS last_linked_at
       FROM tags t
       INNER JOIN pets p ON p.id = t.pet_id
       INNER JOIN user u ON u.id = p.owner_id
       WHERE t.tenant_id = ?
         AND t.pet_id IS NOT NULL
       GROUP BY u.id, u.email, u.name
       ORDER BY datetime(MAX(t.updated_at)) DESC`
    )
    .bind(tid)
    .all<{
      user_id: string;
      email: string;
      name: string | null;
      linked_tag_count: number | string | null;
      first_linked_at: string | null;
      last_linked_at: string | null;
    }>();

  const out: TenantTagCustomerRow[] = [];
  for (const r of rows.results ?? []) {
    const n = Number(r.linked_tag_count ?? 0);
    out.push({
      user_id: r.user_id,
      email: r.email,
      name: r.name,
      linked_tag_count: Number.isFinite(n) ? n : 0,
      first_linked_at: r.first_linked_at,
      last_linked_at: r.last_linked_at,
    });
  }
  return out;
}
