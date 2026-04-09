"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";

type TenantRole = "owner" | "admin" | "member";
type InviteStatus = "pending" | "accepted" | "cancelled" | "expired";

export type InviteView = {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_status: string;
  email: string;
  role: TenantRole;
  token: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
};

function safeRole(raw: string | null | undefined): TenantRole {
  if (raw === "owner" || raw === "admin" || raw === "member") return raw;
  return "member";
}

async function ensureTenantInvitesTable() {
  const db = getDB();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS tenant_invites (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      invited_by TEXT NOT NULL REFERENCES user(id),
      expires_at DATETIME NOT NULL,
      accepted_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_tenant_invites_tenant_id ON tenant_invites(tenant_id)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_tenant_invites_email ON tenant_invites(email)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_tenant_invites_status ON tenant_invites(status)").run();
}

async function requireSessionUser() {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user?.id) throw new Error("로그인이 필요합니다.");
  return {
    id: user.id,
    email: String(user.email ?? "").trim().toLowerCase(),
  };
}

export async function getInviteViewByToken(token: string): Promise<InviteView | null> {
  const db = getDB();
  await ensureTenantInvitesTable();
  const normalized = String(token ?? "").trim();
  if (!normalized) return null;

  const row = await db
    .prepare(
      `SELECT i.id, i.tenant_id, i.email, i.role, i.token, i.status, i.expires_at, i.created_at,
              t.name AS tenant_name, t.slug AS tenant_slug, t.status AS tenant_status,
              CASE WHEN datetime(i.expires_at) <= CURRENT_TIMESTAMP THEN 1 ELSE 0 END AS is_expired
       FROM tenant_invites i
       INNER JOIN tenants t ON t.id = i.tenant_id
       WHERE i.token = ?
       LIMIT 1`
    )
    .bind(normalized)
    .first<{
      id: string;
      tenant_id: string;
      tenant_name: string;
      tenant_slug: string;
      tenant_status: string;
      email: string;
      role: string;
      token: string;
      status: InviteStatus;
      expires_at: string;
      created_at: string;
      is_expired: number;
    }>();

  if (!row) return null;

  let status = row.status;
  if (row.status === "pending" && Number(row.is_expired) === 1) {
    await db
      .prepare("UPDATE tenant_invites SET status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(row.id)
      .run();
    status = "expired";
  }

  return {
    id: row.id,
    tenant_id: row.tenant_id,
    tenant_name: row.tenant_name,
    tenant_slug: row.tenant_slug,
    tenant_status: row.tenant_status,
    email: row.email,
    role: safeRole(row.role),
    token: row.token,
    status,
    expires_at: row.expires_at,
    created_at: row.created_at,
  };
}

export async function acceptTenantInviteByToken(token: string): Promise<{ ok: true; tenantSlug: string }> {
  const db = getDB();
  await ensureTenantInvitesTable();

  const normalized = String(token ?? "").trim();
  if (!normalized) throw new Error("초대 토큰이 올바르지 않습니다.");

  const invite = await getInviteViewByToken(normalized);
  if (!invite) throw new Error("유효하지 않은 초대 링크입니다.");
  if (invite.status !== "pending") throw new Error("이미 처리된 초대 링크입니다.");
  if (invite.tenant_status !== "active") throw new Error("비활성 조직의 초대는 수락할 수 없습니다.");

  const actor = await requireSessionUser();
  if (!actor.email) throw new Error("이메일이 연결된 계정으로 로그인해 주세요.");
  if (actor.email !== invite.email.toLowerCase()) {
    throw new Error(`초대 대상 이메일(${invite.email})로 로그인해 주세요.`);
  }

  await db
    .prepare(
      `INSERT INTO tenant_members (tenant_id, user_id, role, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(tenant_id, user_id) DO NOTHING`
    )
    .bind(invite.tenant_id, actor.id, invite.role)
    .run();

  await db
    .prepare(
      `UPDATE tenant_invites
       SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(invite.id)
    .run();

  revalidatePath("/admin/tenants");
  revalidatePath("/hub");
  return { ok: true, tenantSlug: invite.tenant_slug };
}
