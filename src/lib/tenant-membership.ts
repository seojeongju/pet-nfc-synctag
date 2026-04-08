import type { D1Database } from "@cloudflare/workers-types";
import type { TenantRole, TenantWithRole } from "@/types/tenant-subscription";

const ROLE_RANK: Record<TenantRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function roleAtLeast(role: TenantRole, minimum: TenantRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export async function listTenantsForUser(
  db: D1Database,
  userId: string
): Promise<TenantWithRole[]> {
  const { results } = await db
    .prepare(
      `SELECT t.id, t.name, t.slug, t.status, t.created_at, t.updated_at, tm.role
       FROM tenants t
       INNER JOIN tenant_members tm ON tm.tenant_id = t.id
       WHERE tm.user_id = ?
       ORDER BY t.name`
    )
    .bind(userId)
    .all<TenantWithRole>();
  return (results ?? []) as TenantWithRole[];
}

export async function getMembership(
  db: D1Database,
  userId: string,
  tenantId: string
): Promise<TenantRole | null> {
  const row = await db
    .prepare(
      `SELECT role FROM tenant_members WHERE tenant_id = ? AND user_id = ?`
    )
    .bind(tenantId, userId)
    .first<{ role: TenantRole }>();
  return row?.role ?? null;
}

/**
 * Use in server actions after resolving tenantId from the client.
 */
export async function requireTenantMember(
  db: D1Database,
  userId: string,
  tenantId: string
): Promise<TenantRole> {
  const role = await getMembership(db, userId, tenantId);
  if (!role) {
    throw new Error("이 조직에 대한 접근 권한이 없습니다.");
  }
  return role;
}

export async function assertTenantRole(
  db: D1Database,
  userId: string,
  tenantId: string,
  minimum: TenantRole
): Promise<void> {
  const role = await requireTenantMember(db, userId, tenantId);
  if (!roleAtLeast(role, minimum)) {
    throw new Error("이 작업을 수행할 권한이 없습니다.");
  }
}
