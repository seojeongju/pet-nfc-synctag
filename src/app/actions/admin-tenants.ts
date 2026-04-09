"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { assertTenantRole, getMembership } from "@/lib/tenant-membership";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import type { D1Database } from "@cloudflare/workers-types";
import { TENANT_AUDIT_ACTIONS, type TenantOrgAuditFilter } from "@/lib/tenant-audit-constants";

type TenantRole = "owner" | "admin" | "member";

type TenantMemberInfo = {
  user_id: string;
  email: string;
  name: string | null;
  role: TenantRole;
  created_at: string;
};

type TenantInviteInfo = {
  id: string;
  email: string;
  role: TenantRole;
  token: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  expires_at: string;
  created_at: string;
};

export type TenantAdminView = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  member_count: number;
  members: TenantMemberInfo[];
  invites: TenantInviteInfo[];
};

type OrgActor = { userId: string; actorEmail: string; isPlatformAdmin: boolean };

export type TenantAuditLogRow = {
  id: number;
  action: string;
  actor_email: string | null;
  payload: string | null;
  created_at: string;
};

function normalizeActorSearch(raw: string | undefined): string {
  const t = raw?.trim() ?? "";
  return t.length > 120 ? t.slice(0, 120) : t;
}

async function requirePlatformAdmin() {
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

  if (!isPlatformAdminRole(roleRow?.role)) {
    throw new Error("플랫폼 관리자 권한이 필요합니다.");
  }

  return { userId, actorEmail: roleRow?.email ?? "system" };
}

/** 플랫폼 관리자 또는 해당 조직의 owner/admin(테넌트 관리자). */
async function requirePlatformOrTenantOrgAdmin(tenantId: string): Promise<OrgActor> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }
  const db = context.env.DB;
  const roleRow = await db
    .prepare("SELECT role, email FROM user WHERE id = ?")
    .bind(userId)
    .first<{ role?: string | null; email?: string | null }>();

  if (isPlatformAdminRole(roleRow?.role)) {
    return { userId, actorEmail: roleRow?.email ?? "system", isPlatformAdmin: true };
  }

  await assertTenantRole(db, userId, tenantId, "admin");
  return { userId, actorEmail: roleRow?.email ?? "system", isPlatformAdmin: false };
}

async function assertMayAssignOwnerRole(
  db: D1Database,
  actor: OrgActor,
  tenantId: string,
  targetRole: TenantRole
) {
  if (targetRole !== "owner") return;
  if (actor.isPlatformAdmin) return;
  const m = await getMembership(db, actor.userId, tenantId);
  if (m !== "owner") {
    throw new Error("소유자 역할은 조직 소유자 또는 플랫폼 관리자만 지정할 수 있습니다.");
  }
}

async function assertMayRemoveOwnerMember(db: D1Database, actor: OrgActor, tenantId: string, targetUserId: string) {
  const row = await db
    .prepare("SELECT role FROM tenant_members WHERE tenant_id = ? AND user_id = ?")
    .bind(tenantId, targetUserId)
    .first<{ role: string }>();
  if (row?.role !== "owner") return;
  if (actor.isPlatformAdmin) return;
  const m = await getMembership(db, actor.userId, tenantId);
  if (m !== "owner") {
    throw new Error("소유자 멤버는 조직 소유자 또는 플랫폼 관리자만 제거할 수 있습니다.");
  }
}

function safeRole(raw: string | null | undefined): TenantRole {
  if (raw === "owner" || raw === "admin" || raw === "member") return raw;
  return "member";
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "org";
}

async function resolveUserByEmail(email: string) {
  const db = getDB();
  return await db
    .prepare("SELECT id, email, name FROM user WHERE lower(email) = lower(?) LIMIT 1")
    .bind(email)
    .first<{ id: string; email: string; name?: string | null }>();
}

async function writeAdminAudit(actorEmail: string, action: string, payload: unknown) {
  const db = getDB();
  await db
    .prepare(
      "INSERT INTO admin_action_logs (action, actor_email, success, payload) VALUES (?, ?, 1, ?)"
    )
    .bind(action, actorEmail, JSON.stringify(payload))
    .run()
    .catch(() => {});
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

function revalidateTenantSurfaces(tenantId?: string) {
  revalidatePath("/admin/tenants");
  revalidatePath("/hub");
  if (tenantId) {
    revalidatePath(`/hub/org/${tenantId}/manage`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pets");
  revalidatePath("/dashboard/scans");
  revalidatePath("/dashboard/geofences");
}

export async function getTenantsAdminView(filters?: {
  q?: string;
  email?: string;
  status?: "all" | "active" | "suspended";
}): Promise<TenantAdminView[]> {
  await requirePlatformAdmin();
  const db = getDB();
  await ensureTenantInvitesTable();

  const q = String(filters?.q ?? "").trim();
  const email = String(filters?.email ?? "").trim();
  const status = filters?.status === "active" || filters?.status === "suspended" ? filters.status : "all";
  const whereParts: string[] = [];
  const bindValues: string[] = [];

  if (status !== "all") {
    whereParts.push("t.status = ?");
    bindValues.push(status);
  }
  if (q) {
    whereParts.push("(lower(t.name) LIKE lower(?) OR lower(t.slug) LIKE lower(?))");
    bindValues.push(`%${q}%`, `%${q}%`);
  }
  if (email) {
    whereParts.push(
      `EXISTS (
        SELECT 1
        FROM tenant_members tm2
        INNER JOIN user u2 ON u2.id = tm2.user_id
        WHERE tm2.tenant_id = t.id
          AND lower(u2.email) LIKE lower(?)
      )`
    );
    bindValues.push(`%${email}%`);
  }
  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

  const tenantsRows = await db
    .prepare(
      `SELECT t.id, t.name, t.slug, t.status, t.created_at,
              COUNT(tm.user_id) AS member_count
       FROM tenants t
       LEFT JOIN tenant_members tm ON tm.tenant_id = t.id
       ${whereClause}
       GROUP BY t.id, t.name, t.slug, t.status, t.created_at
       ORDER BY datetime(t.created_at) DESC`
    )
    .bind(...bindValues)
    .all<{
      id: string;
      name: string;
      slug: string;
      status: string;
      created_at: string;
      member_count: number;
    }>();

  const membersRows = await db
    .prepare(
      `SELECT tm.tenant_id, tm.user_id, tm.role, tm.created_at,
              u.email, u.name
       FROM tenant_members tm
       INNER JOIN user u ON u.id = tm.user_id
       ORDER BY tm.tenant_id, CASE tm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.email`
    )
    .all<{
      tenant_id: string;
      user_id: string;
      role: string;
      created_at: string;
      email: string;
      name: string | null;
    }>();
  const invitesRows = await db
    .prepare(
      `SELECT id, tenant_id, email, role, token, status, expires_at, created_at
       FROM tenant_invites
       WHERE status = 'pending'
       ORDER BY datetime(created_at) DESC`
    )
    .all<{
      id: string;
      tenant_id: string;
      email: string;
      role: string;
      token: string;
      status: "pending" | "accepted" | "cancelled" | "expired";
      expires_at: string;
      created_at: string;
    }>();

  const membersByTenant = new Map<string, TenantMemberInfo[]>();
  for (const row of membersRows.results ?? []) {
    const arr = membersByTenant.get(row.tenant_id) ?? [];
    arr.push({
      user_id: row.user_id,
      email: row.email,
      name: row.name,
      role: safeRole(row.role),
      created_at: row.created_at,
    });
    membersByTenant.set(row.tenant_id, arr);
  }
  const invitesByTenant = new Map<string, TenantInviteInfo[]>();
  for (const row of invitesRows.results ?? []) {
    const arr = invitesByTenant.get(row.tenant_id) ?? [];
    arr.push({
      id: row.id,
      email: row.email,
      role: safeRole(row.role),
      token: row.token,
      status: row.status,
      expires_at: row.expires_at,
      created_at: row.created_at,
    });
    invitesByTenant.set(row.tenant_id, arr);
  }

  return (tenantsRows.results ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    status: t.status,
    created_at: t.created_at,
    member_count: Number(t.member_count ?? 0),
    members: membersByTenant.get(t.id) ?? [],
    invites: invitesByTenant.get(t.id) ?? [],
  }));
}

async function loadTenantAdminView(db: ReturnType<typeof getDB>, tenantId: string): Promise<TenantAdminView | null> {
  await ensureTenantInvitesTable();
  const t = await db
    .prepare(
      "SELECT id, name, slug, status, created_at FROM tenants WHERE id = ? LIMIT 1"
    )
    .bind(tenantId)
    .first<{
      id: string;
      name: string;
      slug: string;
      status: string;
      created_at: string;
    }>();
  if (!t) return null;

  const membersRows = await db
    .prepare(
      `SELECT tm.user_id, tm.role, tm.created_at, u.email, u.name
       FROM tenant_members tm
       INNER JOIN user u ON u.id = tm.user_id
       WHERE tm.tenant_id = ?
       ORDER BY CASE tm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.email`
    )
    .bind(tenantId)
    .all<{
      user_id: string;
      role: string;
      created_at: string;
      email: string;
      name: string | null;
    }>();

  const invitesRows = await db
    .prepare(
      `SELECT id, tenant_id, email, role, token, status, expires_at, created_at
       FROM tenant_invites
       WHERE tenant_id = ? AND status = 'pending'
       ORDER BY datetime(created_at) DESC`
    )
    .bind(tenantId)
    .all<{
      id: string;
      tenant_id: string;
      email: string;
      role: string;
      token: string;
      status: "pending" | "accepted" | "cancelled" | "expired";
      expires_at: string;
      created_at: string;
    }>();

  const members: TenantMemberInfo[] = (membersRows.results ?? []).map((row) => ({
    user_id: row.user_id,
    email: row.email,
    name: row.name,
    role: safeRole(row.role),
    created_at: row.created_at,
  }));

  const invites: TenantInviteInfo[] = (invitesRows.results ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: safeRole(row.role),
    token: row.token,
    status: row.status,
    expires_at: row.expires_at,
    created_at: row.created_at,
  }));

  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    status: t.status,
    created_at: t.created_at,
    member_count: members.length,
    members,
    invites,
  };
}

/** 테넌트 관리자(조직 owner/admin) 또는 플랫폼 관리자 전용 단일 조직 화면. */
export async function getTenantOrgManageContext(tenantId: string): Promise<{
  view: TenantAdminView;
  isPlatformAdmin: boolean;
} | null> {
  const actor = await requirePlatformOrTenantOrgAdmin(tenantId);
  const db = getDB();
  const view = await loadTenantAdminView(db, tenantId);
  if (!view) return null;
  return { view, isPlatformAdmin: actor.isPlatformAdmin };
}

export async function adminCreateTenantWithOwner(formData: FormData) {
  const { actorEmail } = await requirePlatformAdmin();
  const db = getDB();

  const name = String(formData.get("name") ?? "").trim();
  const ownerEmail = String(formData.get("owner_email") ?? "").trim();
  if (!name || !ownerEmail) {
    throw new Error("조직명과 소유자 이메일을 입력하세요.");
  }

  const owner = await resolveUserByEmail(ownerEmail);
  if (!owner) {
    throw new Error("해당 이메일의 사용자를 찾을 수 없습니다.");
  }

  const tenantId = nanoid();
  let slug = `${slugify(name)}-${nanoid(8)}`;
  for (let i = 0; i < 5; i++) {
    const clash = await db
      .prepare("SELECT id FROM tenants WHERE slug = ? LIMIT 1")
      .bind(slug)
      .first<{ id: string }>();
    if (!clash) break;
    slug = `${slugify(name)}-${nanoid(8)}`;
  }

  await db.prepare(
    `INSERT INTO tenants (id, name, slug, status, created_at, updated_at)
     VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).bind(tenantId, name, slug).run();

  await db.prepare(
    `INSERT INTO tenant_members (tenant_id, user_id, role, created_at)
     VALUES (?, ?, 'owner', CURRENT_TIMESTAMP)`
  ).bind(tenantId, owner.id).run();

  await writeAdminAudit(actorEmail, "tenant_create_by_admin", {
    tenantId,
    name,
    slug,
    ownerEmail: owner.email,
  });
  revalidateTenantSurfaces(tenantId);
}

export async function adminAddTenantMember(formData: FormData) {
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  if (!tenantId) throw new Error("조직 정보가 올바르지 않습니다.");
  const actor = await requirePlatformOrTenantOrgAdmin(tenantId);
  const db = getDB();

  const email = String(formData.get("email") ?? "").trim();
  const role = safeRole(String(formData.get("role") ?? "member").trim());

  if (!email) {
    throw new Error("멤버 이메일이 필요합니다.");
  }

  await assertMayAssignOwnerRole(db, actor, tenantId, role);

  const user = await resolveUserByEmail(email);
  if (!user) {
    throw new Error("해당 이메일의 사용자를 찾을 수 없습니다.");
  }

  await db
    .prepare(
      `INSERT INTO tenant_members (tenant_id, user_id, role, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(tenant_id, user_id) DO UPDATE SET role = excluded.role`
    )
    .bind(tenantId, user.id, role)
    .run();

  await writeAdminAudit(actor.actorEmail, "tenant_member_upsert_by_admin", {
    tenantId,
    email: user.email,
    role,
  });
  revalidateTenantSurfaces(tenantId);
}

export async function adminChangeTenantMemberRole(formData: FormData) {
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  const userId = String(formData.get("user_id") ?? "").trim();
  const role = safeRole(String(formData.get("role") ?? "member").trim());
  if (!tenantId || !userId) {
    throw new Error("변경 대상이 올바르지 않습니다.");
  }
  const actor = await requirePlatformOrTenantOrgAdmin(tenantId);
  const db = getDB();

  await assertMayAssignOwnerRole(db, actor, tenantId, role);

  const current = await db
    .prepare("SELECT role FROM tenant_members WHERE tenant_id = ? AND user_id = ?")
    .bind(tenantId, userId)
    .first<{ role: string }>();
  if (!current) {
    throw new Error("멤버를 찾을 수 없습니다.");
  }

  if (current.role === "owner" && role !== "owner") {
    const ownerCount = await db
      .prepare("SELECT COUNT(*) AS c FROM tenant_members WHERE tenant_id = ? AND role = 'owner'")
      .bind(tenantId)
      .first<{ c: number }>();
    if (Number(ownerCount?.c ?? 0) <= 1) {
      throw new Error("마지막 owner는 다른 역할로 변경할 수 없습니다.");
    }
  }

  await db
    .prepare("UPDATE tenant_members SET role = ? WHERE tenant_id = ? AND user_id = ?")
    .bind(role, tenantId, userId)
    .run();

  await writeAdminAudit(actor.actorEmail, "tenant_member_role_change_by_admin", { tenantId, userId, role });
  revalidateTenantSurfaces(tenantId);
}

export async function adminRemoveTenantMember(formData: FormData) {
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!tenantId || !userId) {
    throw new Error("삭제 대상이 올바르지 않습니다.");
  }
  const actor = await requirePlatformOrTenantOrgAdmin(tenantId);
  const db = getDB();

  await assertMayRemoveOwnerMember(db, actor, tenantId, userId);

  const current = await db
    .prepare("SELECT role FROM tenant_members WHERE tenant_id = ? AND user_id = ?")
    .bind(tenantId, userId)
    .first<{ role: string }>();

  if (!current) {
    throw new Error("멤버를 찾을 수 없습니다.");
  }

  if (current.role === "owner") {
    const ownerCount = await db
      .prepare("SELECT COUNT(*) AS c FROM tenant_members WHERE tenant_id = ? AND role = 'owner'")
      .bind(tenantId)
      .first<{ c: number }>();
    if (Number(ownerCount?.c ?? 0) <= 1) {
      throw new Error("마지막 owner는 제거할 수 없습니다.");
    }
  }

  await db
    .prepare("DELETE FROM tenant_members WHERE tenant_id = ? AND user_id = ?")
    .bind(tenantId, userId)
    .run();

  await writeAdminAudit(actor.actorEmail, "tenant_member_remove_by_admin", { tenantId, userId });
  revalidateTenantSurfaces(tenantId);
}

export async function adminUpdateTenantStatus(formData: FormData) {
  const { actorEmail } = await requirePlatformAdmin();
  const db = getDB();
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  const status = statusRaw === "suspended" ? "suspended" : "active";
  if (!tenantId) throw new Error("조직 정보가 올바르지 않습니다.");

  await db
    .prepare("UPDATE tenants SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(status, tenantId)
    .run();
  await writeAdminAudit(actorEmail, "tenant_status_change_by_admin", { tenantId, status });
  revalidateTenantSurfaces(tenantId);
}

export async function adminRenameTenant(formData: FormData) {
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!tenantId || !name) {
    throw new Error("조직 정보가 올바르지 않습니다.");
  }
  const actor = await requirePlatformOrTenantOrgAdmin(tenantId);
  const db = getDB();
  await db
    .prepare("UPDATE tenants SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(name, tenantId)
    .run();
  await writeAdminAudit(actor.actorEmail, "tenant_rename_by_admin", { tenantId, name });
  revalidateTenantSurfaces(tenantId);
}

export async function adminCreateTenantInvite(formData: FormData): Promise<{ token: string; expiresAt: string }> {
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = safeRole(String(formData.get("role") ?? "member").trim());
  if (!tenantId || !email) throw new Error("조직과 이메일이 필요합니다.");

  const actor = await requirePlatformOrTenantOrgAdmin(tenantId);
  const db = getDB();
  await ensureTenantInvitesTable();

  await assertMayAssignOwnerRole(db, actor, tenantId, role);

  const existingUser = await resolveUserByEmail(email);
  if (existingUser) throw new Error("이미 가입된 사용자입니다. 멤버 추가/갱신을 사용하세요.");

  const token = nanoid(32);
  const id = nanoid();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  await db
    .prepare(
      `INSERT INTO tenant_invites
       (id, tenant_id, email, role, token, status, invited_by, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .bind(id, tenantId, email, role, token, actor.userId, expiresAt)
    .run();

  await writeAdminAudit(actor.actorEmail, "tenant_invite_create_by_admin", {
    tenantId,
    email,
    role,
    inviteId: id,
  });
  revalidateTenantSurfaces(tenantId);
  return { token, expiresAt };
}

export async function getTenantAdminAuditLogs(limit = 80): Promise<TenantAuditLogRow[]> {
  await requirePlatformAdmin();
  const db = getDB();
  const safeLimit = Math.max(1, Math.min(limit, 200));
  const placeholders = TENANT_AUDIT_ACTIONS.map(() => "?").join(",");
  const rows = await db
    .prepare(
      `SELECT id, action, actor_email, payload, created_at
       FROM admin_action_logs
       WHERE action IN (${placeholders})
       ORDER BY datetime(created_at) DESC, id DESC
       LIMIT ?`
    )
    .bind(...TENANT_AUDIT_ACTIONS, safeLimit)
    .all<TenantAuditLogRow>()
    .catch(() => ({ results: [] as TenantAuditLogRow[] }));
  return rows.results ?? [];
}

function parseAuditDay(raw: string | undefined): string | undefined {
  const t = raw?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return undefined;
  return t;
}

/** 이 조직에 한정된 감사 로그(플랫폼 관리자 또는 조직 owner/admin). */
export async function getTenantOrgAuditLogs(
  tenantId: string,
  filter?: TenantOrgAuditFilter
): Promise<TenantAuditLogRow[]> {
  await requirePlatformOrTenantOrgAdmin(tenantId);
  const db = getDB();
  const requested = filter?.limit ?? 50;
  const safeLimit = Math.max(1, Math.min(requested, 2000));

  const actionTrim = filter?.action?.trim() ?? "";
  const narrowAction =
    actionTrim && (TENANT_AUDIT_ACTIONS as readonly string[]).includes(actionTrim) ? actionTrim : "";

  const actorQ = normalizeActorSearch(filter?.actorContains);
  const dateFrom = parseAuditDay(filter?.dateFrom);
  const dateTo = parseAuditDay(filter?.dateTo);
  const placeholders = TENANT_AUDIT_ACTIONS.map(() => "?").join(",");

  let sql = `SELECT id, action, actor_email, payload, created_at
       FROM admin_action_logs
       WHERE action IN (${placeholders})
         AND json_extract(payload, '$.tenantId') = ?`;
  const bindList: unknown[] = [...TENANT_AUDIT_ACTIONS, tenantId];

  if (narrowAction) {
    sql += ` AND action = ?`;
    bindList.push(narrowAction);
  }
  if (actorQ) {
    sql += ` AND instr(lower(coalesce(actor_email, '')), lower(?)) > 0`;
    bindList.push(actorQ);
  }
  if (dateFrom) {
    sql += ` AND date(created_at) >= date(?)`;
    bindList.push(dateFrom);
  }
  if (dateTo) {
    sql += ` AND date(created_at) <= date(?)`;
    bindList.push(dateTo);
  }
  sql += ` ORDER BY datetime(created_at) DESC, id DESC LIMIT ?`;
  bindList.push(safeLimit);

  const rows = await db
    .prepare(sql)
    .bind(...bindList)
    .all<TenantAuditLogRow>()
    .catch(() => ({ results: [] as TenantAuditLogRow[] }));
  return rows.results ?? [];
}
