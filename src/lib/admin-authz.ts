"use server";

import { headers } from "next/headers";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { assertTenantRole } from "@/lib/tenant-membership";
import type { TenantRole } from "@/types/tenant-subscription";

export type AdminActor = {
  userId: string;
  email: string;
  isPlatformAdmin: boolean;
};

export type AdminScope = {
  actor: AdminActor;
  tenantIds: string[] | null;
};

export async function requireAdminActor(): Promise<AdminActor> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  const roleRow = await context.env.DB
    .prepare("SELECT role, email FROM user WHERE id = ?")
    .bind(userId)
    .first<{ role?: string | null; email?: string | null }>();

  return {
    userId,
    email: roleRow?.email ?? session.user.email ?? "system",
    isPlatformAdmin: isPlatformAdminRole(roleRow?.role),
  };
}

export async function requirePlatformAdminActor(): Promise<AdminActor> {
  const actor = await requireAdminActor();
  if (!actor.isPlatformAdmin) {
    throw new Error("플랫폼 관리자 권한이 필요합니다.");
  }
  return actor;
}

export async function requirePlatformOrTenantAdminActor(
  tenantId: string,
  minimumRole: TenantRole = "admin"
): Promise<AdminActor> {
  const actor = await requireAdminActor();
  if (actor.isPlatformAdmin) {
    return actor;
  }
  const context = getCfRequestContext();
  await assertTenantRole(context.env.DB, actor.userId, tenantId, minimumRole);
  return actor;
}

export async function resolveAdminScope(minimumRole: TenantRole = "admin"): Promise<AdminScope> {
  const actor = await requireAdminActor();
  if (actor.isPlatformAdmin) {
    return { actor, tenantIds: null };
  }
  const context = getCfRequestContext();
  const rows = await context.env.DB
    .prepare(
      `SELECT tenant_id, role
       FROM tenant_members
       WHERE user_id = ?`
    )
    .bind(actor.userId)
    .all<{ tenant_id: string; role: TenantRole }>();
  const rank: Record<TenantRole, number> = { member: 1, admin: 2, owner: 3 };
  const minimum = rank[minimumRole];
  const tenantIds = (rows.results ?? [])
    .filter((r) => rank[(r.role ?? "member") as TenantRole] >= minimum)
    .map((r) => r.tenant_id)
    .filter(Boolean);
  if (tenantIds.length === 0) {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return { actor, tenantIds: [...new Set(tenantIds)] };
}
