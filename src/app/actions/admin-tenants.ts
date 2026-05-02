"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { hashPassword } from "better-auth/crypto";
import { cookies } from "next/headers";
import { getDB } from "@/lib/db";
import { getMembership } from "@/lib/tenant-membership";
import type { D1Database } from "@cloudflare/workers-types";
import { TENANT_AUDIT_ACTIONS, type TenantOrgAuditFilter } from "@/lib/tenant-audit-constants";
import { SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";
import {
  requirePlatformAdminActor,
  requirePlatformOrTenantAdminActor,
} from "@/lib/admin-authz";
import {
  queryTenantTagConnectedUsers,
  type TenantTagCustomerRow,
} from "@/lib/tenant-tag-customers";
import { setPasswordChangeRequired } from "@/lib/password-change";
import { ORG_ADMIN_ROLE } from "@/lib/platform-admin";

type TenantRole = "owner" | "admin" | "member";
const MIN_PASSWORD_LEN = 8;
const MAX_PASSWORD_LEN = 128;
const CREDENTIAL_PROVIDER = "credential" as const;

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
  /** NULL·빈 값 = 전체 모드 허용. JSON 배열 문자열. */
  allowed_subject_kinds: string | null;
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
  const actor = await requirePlatformAdminActor();
  return { userId: actor.userId, actorEmail: actor.email };
}

/** 플랫폼 관리자 또는 해당 조직의 owner/admin(테넌트 관리자). */
async function requirePlatformOrTenantOrgAdmin(tenantId: string): Promise<OrgActor> {
  const actor = await requirePlatformOrTenantAdminActor(tenantId, "admin");
  return {
    userId: actor.userId,
    actorEmail: actor.email,
    isPlatformAdmin: actor.isPlatformAdmin,
  };
}

async function assertMayAssignOwnerRole(
  db: D1Database,
  actor: OrgActor,
  tenantId: string,
  targetRole: TenantRole
) {
  if (targetRole !== "owner" && targetRole !== "admin") return;
  if (!actor.isPlatformAdmin) {
    throw new Error("조직 관리자(소유자/관리자) 권한 부여는 슈퍼어드민만 가능합니다.");
  }
}

async function assertSingleManagerTenantConstraint(
  db: D1Database,
  userId: string,
  nextRole: TenantRole,
  tenantId: string
) {
  if (nextRole !== "owner" && nextRole !== "admin") return;
  const row = await db
    .prepare(
      `SELECT tm.tenant_id
       FROM tenant_members tm
       WHERE tm.user_id = ?
         AND tm.role IN ('owner', 'admin')
         AND tm.tenant_id != ?
       LIMIT 1`
    )
    .bind(userId, tenantId)
    .first<{ tenant_id: string }>();
  if (row?.tenant_id) {
    throw new Error("조직 관리자는 1개 조직에만 부여할 수 있습니다.");
  }
}

async function assertInviteRoleByActor(actor: OrgActor, role: TenantRole) {
  if (role !== "owner" && role !== "admin") return;
  if (actor.isPlatformAdmin) return;
  throw new Error("조직 관리자(소유자/관리자) 초대는 슈퍼어드민만 가능합니다.");
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

function assertPasswordPolicy(password: string) {
  if (password.length < MIN_PASSWORD_LEN) {
    throw new Error(`비밀번호는 ${MIN_PASSWORD_LEN}자 이상이어야 합니다.`);
  }
  if (password.length > MAX_PASSWORD_LEN) {
    throw new Error(`비밀번호는 ${MAX_PASSWORD_LEN}자를 넘을 수 없습니다.`);
  }
}

function generateTemporaryPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function resolveOrCreateOwnerUserByEmailWithPassword(email: string, password: string): Promise<{
  user: { id: string; email: string; name?: string | null };
  createdUser: boolean;
  createdCredential: boolean;
}> {
  const db = getDB();
  await ensureUserSubscriptionStatusColumn(db);
  assertPasswordPolicy(password);
  const hashed = await hashPassword(password);

  const existing = await resolveUserByEmail(email);
  if (existing) {
    const credential = await db
      .prepare("SELECT id FROM account WHERE userId = ? AND providerId = ? LIMIT 1")
      .bind(existing.id, CREDENTIAL_PROVIDER)
      .first<{ id: string }>();
    if (credential?.id) {
      await db
        .prepare(
          `UPDATE account
           SET password = ?, updatedAt = CURRENT_TIMESTAMP
           WHERE userId = ? AND providerId = ?`
        )
        .bind(hashed, existing.id, CREDENTIAL_PROVIDER)
        .run();
      await db.prepare("DELETE FROM session WHERE userId = ?").bind(existing.id).run();
      await setPasswordChangeRequired(db, existing.id, true);
      return { user: existing, createdUser: false, createdCredential: false };
    }
    await db
      .prepare(
        `INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(nanoid(), existing.id, existing.id, CREDENTIAL_PROVIDER, hashed)
      .run();
    await db.prepare("DELETE FROM session WHERE userId = ?").bind(existing.id).run();
    await setPasswordChangeRequired(db, existing.id, true);
    return { user: existing, createdUser: false, createdCredential: true };
  }

  const userId = nanoid();
  const defaultName = email.split("@")[0] || "user";
  await db
    .prepare(
      `INSERT INTO user (id, email, name, emailVerified, role, subscriptionStatus, createdAt, updatedAt)
       VALUES (?, ?, ?, 0, ?, 'free', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .bind(userId, email, defaultName, ORG_ADMIN_ROLE)
    .run();
  await db
    .prepare(
      `INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .bind(nanoid(), userId, userId, CREDENTIAL_PROVIDER, hashed)
    .run();
  await setPasswordChangeRequired(db, userId, true);

  return {
    user: { id: userId, email, name: null },
    createdUser: true,
    createdCredential: true,
  };
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

/** 일부 환경에서 마이그레이션만 빠진 경우 INSERT/SELECT 실패 방지 */
async function ensureTenantsAllowedSubjectKindsColumn(db: D1Database): Promise<void> {
  const r = await db
    .prepare("PRAGMA table_info(tenants)")
    .all<{ name?: string }>()
    .catch(() => ({ results: [] as { name?: string }[] }));
  const names = new Set((r.results ?? []).map((row) => String(row.name ?? "").trim()).filter(Boolean));
  if (names.has("allowed_subject_kinds")) return;
  await db
    .prepare("ALTER TABLE tenants ADD COLUMN allowed_subject_kinds TEXT")
    .run()
    .catch(() => {});
}

/** 일부 D1(user 테이블이 예전 스키마)에서 조직 소유자 INSERT 실패 방지 */
async function ensureUserSubscriptionStatusColumn(db: D1Database): Promise<void> {
  const r = await db
    .prepare("PRAGMA table_info(user)")
    .all<{ name?: string }>()
    .catch(() => ({ results: [] as { name?: string }[] }));
  const names = new Set((r.results ?? []).map((row) => String(row.name ?? "").trim()).filter(Boolean));
  if (names.has("subscriptionStatus")) return;
  await db
    .prepare("ALTER TABLE user ADD COLUMN subscriptionStatus TEXT DEFAULT 'free'")
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
  await ensureTenantsAllowedSubjectKindsColumn(db);

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
      `SELECT t.id, t.name, t.slug, t.status, t.created_at, t.allowed_subject_kinds,
              COUNT(tm.user_id) AS member_count
       FROM tenants t
       LEFT JOIN tenant_members tm ON tm.tenant_id = t.id
       ${whereClause}
       GROUP BY t.id, t.name, t.slug, t.status, t.created_at, t.allowed_subject_kinds
       ORDER BY datetime(t.created_at) DESC`
    )
    .bind(...bindValues)
    .all<{
      id: string;
      name: string;
      slug: string;
      status: string;
      created_at: string;
      allowed_subject_kinds: string | null;
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
    allowed_subject_kinds: t.allowed_subject_kinds ?? null,
    member_count: Number(t.member_count ?? 0),
    members: membersByTenant.get(t.id) ?? [],
    invites: invitesByTenant.get(t.id) ?? [],
  }));
}

async function loadTenantAdminView(db: ReturnType<typeof getDB>, tenantId: string): Promise<TenantAdminView | null> {
  await ensureTenantInvitesTable();
  await ensureTenantsAllowedSubjectKindsColumn(db);
  const t = await db
    .prepare(
      "SELECT id, name, slug, status, created_at, allowed_subject_kinds FROM tenants WHERE id = ? LIMIT 1"
    )
    .bind(tenantId)
    .first<{
      id: string;
      name: string;
      slug: string;
      status: string;
      created_at: string;
      allowed_subject_kinds: string | null;
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
    allowed_subject_kinds: t.allowed_subject_kinds ?? null,
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

/** 조직 관리 대시보드: 이 테넌트 태그(tags.tenant_id)로 연결된 최종 보호자만 (RBAC 동일 · 쿼리 스코프). */
export async function listTenantTagConnectedCustomers(tenantId: string): Promise<TenantTagCustomerRow[]> {
  await requirePlatformOrTenantOrgAdmin(tenantId);
  const db = getDB();
  return queryTenantTagConnectedUsers(db, tenantId);
}

export type { TenantTagCustomerRow };

export async function adminCreateTenantWithOwner(
  formData: FormData
): Promise<{ tenantId: string; tenantName: string }> {
  const { actorEmail } = await requirePlatformAdmin();
  const db = getDB();
  await ensureTenantsAllowedSubjectKindsColumn(db);

  const name = String(formData.get("name") ?? "").trim();
  const ownerEmail = String(formData.get("owner_email") ?? "").trim();
  const ownerPassword = String(formData.get("owner_password") ?? "");
  if (!name || !ownerEmail || !ownerPassword) {
    throw new Error("조직명, 조직관리자 이메일, 비밀번호를 모두 입력하세요.");
  }
  const ownerResolved = await resolveOrCreateOwnerUserByEmailWithPassword(ownerEmail, ownerPassword);
  const owner = ownerResolved.user;

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

  const allowedJson = allowedSubjectKindsJsonFromForm(formData);

  await db.prepare(
    `INSERT INTO tenants (id, name, slug, status, allowed_subject_kinds, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).bind(tenantId, name, slug, allowedJson).run();

  await assertSingleManagerTenantConstraint(db, owner.id, "owner", tenantId);

  await db.prepare(
    `INSERT INTO tenant_members (tenant_id, user_id, role, created_at)
     VALUES (?, ?, 'owner', CURRENT_TIMESTAMP)`
  ).bind(tenantId, owner.id).run();

  await db
    .prepare(
      `UPDATE user SET role = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ? AND (role IS NULL OR role = '' OR role = 'user')`
    )
    .bind(ORG_ADMIN_ROLE, owner.id)
    .run();

  await writeAdminAudit(actorEmail, "tenant_create_by_admin", {
    tenantId,
    name,
    slug,
    ownerEmail: owner.email,
    ownerUserCreated: ownerResolved.createdUser,
    ownerCredentialCreated: ownerResolved.createdCredential,
    allowed_subject_kinds: allowedJson,
  });
  revalidatePath("/admin/users");
  revalidateTenantSurfaces(tenantId);
  return { tenantId, tenantName: name };
}

export async function adminDeleteTenant(formData: FormData) {
  const { actorEmail } = await requirePlatformAdmin();
  const db = getDB();
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  const confirmText = String(formData.get("confirm_name") ?? "").trim();
  if (!tenantId) throw new Error("조직 정보가 올바르지 않습니다.");

  const t = await db
    .prepare("SELECT id, name FROM tenants WHERE id = ?")
    .bind(tenantId)
    .first<{ id: string; name: string }>();
  if (!t) {
    throw new Error("삭제할 조직을 찾을 수 없습니다.");
  }
  if (!confirmText || confirmText !== t.name) {
    throw new Error("삭제 확인용 조직명을 정확히 입력하세요.");
  }

  await ensureTenantInvitesTable();
  await db.prepare("DELETE FROM tenant_invites WHERE tenant_id = ?").bind(tenantId).run();
  await db.prepare("DELETE FROM tenant_members WHERE tenant_id = ?").bind(tenantId).run();
  await db.prepare("DELETE FROM tenants WHERE id = ?").bind(tenantId).run();

  await writeAdminAudit(actorEmail, "tenant_delete_by_admin", {
    tenantId,
    tenantName: t.name,
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

  let user = await resolveUserByEmail(email);
  let temporaryPassword: string | null = null;

  if (!user) {
    const tempPw = generateTemporaryPassword(12);
    temporaryPassword = tempPw;
    const hashed = await hashPassword(tempPw);
    const userId = nanoid();
    const defaultName = email.split("@")[0] || "user";
    const userRole = (role === "owner" || role === "admin") ? ORG_ADMIN_ROLE : "user";

    await ensureUserSubscriptionStatusColumn(db);

    await db
      .prepare(
        `INSERT INTO user (id, email, name, emailVerified, role, subscriptionStatus, createdAt, updatedAt)
         VALUES (?, ?, ?, 0, ?, 'free', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(userId, email, defaultName, userRole)
      .run();

    await db
      .prepare(
        `INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(nanoid(), userId, userId, CREDENTIAL_PROVIDER, hashed)
      .run();

    await setPasswordChangeRequired(db, userId, true);

    user = { id: userId, email, name: defaultName };
  }

  await assertSingleManagerTenantConstraint(db, user.id, role, tenantId);

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
    userCreated: !!temporaryPassword,
  });

  const returnQs = String(formData.get("return_qs") ?? "").trim();
  const p = new URLSearchParams(returnQs);

  let successMsg = `멤버 추가 성공: ${email}`;
  if (temporaryPassword) {
    successMsg += ` (계정이 생성되었습니다. 임시 비밀번호: ${temporaryPassword})`;
  }
  p.set("ok", successMsg);

  revalidateTenantSurfaces(tenantId);
  redirect(`/admin/tenants?${p.toString()}`);
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
  await assertSingleManagerTenantConstraint(db, userId, role, tenantId);

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

function isUnrestrictedFromForm(formData: FormData): boolean {
  for (const v of formData.getAll("unrestricted")) {
    const s = String(v).trim().toLowerCase();
    if (s === "1" || s === "on" || s === "true" || s === "yes") return true;
  }
  return false;
}

/**
 * 폼: unrestricted 체크 → NULL(전체). 아니면 선택한 mode[] 를 JSON. 전체 수 선택이면 NULL.
 * 모드가 하나도 전달되지 않으면 NULL(전체 허용) — 계약 태그만의 필드이며, 빈 전송으로 생성이 막히지 않게 함.
 */
function allowedSubjectKindsJsonFromForm(formData: FormData): string | null {
  if (isUnrestrictedFromForm(formData)) return null;
  const selected = formData
    .getAll("mode")
    .map((x) => String(x).trim())
    .filter((x) => (SUBJECT_KINDS as readonly string[]).includes(x)) as SubjectKind[];
  if (selected.length === 0) {
    return null;
  }
  if (selected.length >= SUBJECT_KINDS.length) return null;
  return JSON.stringify(SUBJECT_KINDS.filter((k) => selected.includes(k)));
}

/**
 * 보호자에게 보이는 Link-U 모드(메뉴) 범위. 전체 허용이면 NULL, 아니면 JSON 배열(예: ["pet"]).
 */
export async function adminUpdateTenantAllowedModes(formData: FormData) {
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  if (!tenantId) {
    throw new Error("조직 정보가 올바르지 않습니다.");
  }
  const actor = await requirePlatformOrTenantOrgAdmin(tenantId);
  const db = getDB();
  await ensureTenantsAllowedSubjectKindsColumn(db);

  const allowedJson = allowedSubjectKindsJsonFromForm(formData);

  await db
    .prepare(
      "UPDATE tenants SET allowed_subject_kinds = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(allowedJson, tenantId)
    .run();

  await writeAdminAudit(actor.actorEmail, "tenant_allowed_modes_by_admin", {
    tenantId,
    allowed_subject_kinds: allowedJson,
  });
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

  await assertInviteRoleByActor(actor, role);

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

export async function adminResetTenantManagerPassword(formData: FormData): Promise<{
  tenantId: string;
  targetEmail: string;
  temporaryPassword: string;
}> {
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!tenantId || !userId) {
    throw new Error("대상 정보가 올바르지 않습니다.");
  }
  const actor = await requirePlatformOrTenantOrgAdmin(tenantId);
  const actorEmail = actor.actorEmail;
  const db = getDB();

  const target = await db
    .prepare(
      `SELECT u.id, u.email, tm.role
       FROM tenant_members tm
       INNER JOIN user u ON u.id = tm.user_id
       WHERE tm.tenant_id = ? AND tm.user_id = ?
       LIMIT 1`
    )
    .bind(tenantId, userId)
    .first<{ id: string; email: string; role: string }>();
  if (!target) {
    throw new Error("대상 조직관리자 계정을 찾을 수 없습니다.");
  }
  if (target.role !== "owner" && target.role !== "admin") {
    throw new Error("조직관리자(owner/admin) 계정만 비밀번호 재생성이 가능합니다.");
  }

  const temporaryPassword = generateTemporaryPassword();
  assertPasswordPolicy(temporaryPassword);
  const hashed = await hashPassword(temporaryPassword);

  const credential = await db
    .prepare("SELECT id FROM account WHERE userId = ? AND providerId = ? LIMIT 1")
    .bind(userId, CREDENTIAL_PROVIDER)
    .first<{ id: string }>();

  if (credential?.id) {
    await db
      .prepare(
        `UPDATE account
         SET password = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE userId = ? AND providerId = ?`
      )
      .bind(hashed, userId, CREDENTIAL_PROVIDER)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(nanoid(), userId, userId, CREDENTIAL_PROVIDER, hashed)
      .run();
  }
  await setPasswordChangeRequired(db, userId, true);
  await db.prepare("DELETE FROM session WHERE userId = ?").bind(userId).run();

  await writeAdminAudit(actorEmail, "tenant_manager_password_reset_by_admin", {
    tenantId,
    targetUserId: userId,
    targetEmail: target.email,
    targetRole: target.role,
    credentialCreated: !credential?.id,
  });
  revalidateTenantSurfaces(tenantId);

  return { tenantId, targetEmail: target.email, temporaryPassword };
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

// --- Form Action Wrappers (Stable IDs for Next.js 15) ---

function internalWithMessage(baseQs: string, key: "ok" | "err", value: string) {
  const p = new URLSearchParams(baseQs);
  p.set(key, value);
  return `/admin/tenants?${p.toString()}`;
}

function isNextRedirectError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const maybe = err as { digest?: unknown };
  return typeof maybe.digest === "string" && maybe.digest.startsWith("NEXT_REDIRECT");
}

export async function adminCreateTenantFormAction(formData: FormData) {
  const backQs = String(formData.get("return_qs") ?? "");
  try {
    const created = await adminCreateTenantWithOwner(formData);
    const p = new URLSearchParams();
    p.set("ok", encodeURIComponent(`조직 생성 완료: ${created.tenantName}`));
    p.set("created_tenant", created.tenantId);
    redirect(`/admin/tenants?${p.toString()}`);
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "조직 생성 실패";
    redirect(internalWithMessage(backQs, "err", encodeURIComponent(msg)));
  }
}

export async function adminUpdateTenantStatusFormAction(formData: FormData) {
  const backQs = String(formData.get("return_qs") ?? "");
  try {
    await adminUpdateTenantStatus(formData);
    redirect(internalWithMessage(backQs, "ok", encodeURIComponent("조직 상태 변경 완료")));
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "상태 변경 실패";
    redirect(internalWithMessage(backQs, "err", encodeURIComponent(msg)));
  }
}

export async function adminUpdateTenantAllowedModesFormAction(formData: FormData) {
  const backQs = String(formData.get("return_qs") ?? "");
  try {
    await adminUpdateTenantAllowedModes(formData);
    redirect(internalWithMessage(backQs, "ok", encodeURIComponent("보호자 허용 모드가 저장되었습니다.")));
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "허용 모드 저장 실패";
    redirect(internalWithMessage(backQs, "err", encodeURIComponent(msg)));
  }
}

export async function adminRenameTenantFormAction(formData: FormData) {
  const backQs = String(formData.get("return_qs") ?? "");
  try {
    await adminRenameTenant(formData);
    redirect(internalWithMessage(backQs, "ok", encodeURIComponent("조직명 변경 완료")));
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "조직명 변경 실패";
    redirect(internalWithMessage(backQs, "err", encodeURIComponent(msg)));
  }
}

export async function adminDeleteTenantFormAction(formData: FormData) {
  const backQs = String(formData.get("return_qs") ?? "");
  try {
    await adminDeleteTenant(formData);
    redirect(internalWithMessage(backQs, "ok", encodeURIComponent("조직 삭제 완료")));
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "조직 삭제 실패";
    redirect(internalWithMessage(backQs, "err", encodeURIComponent(msg)));
  }
}

export async function adminAddTenantMemberFormAction(formData: FormData) {
  const backQs = String(formData.get("return_qs") ?? "");
  try {
    await adminAddTenantMember(formData);
    redirect(internalWithMessage(backQs, "ok", encodeURIComponent("멤버 저장 완료")));
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "멤버 추가 실패";
    redirect(internalWithMessage(backQs, "err", encodeURIComponent(msg)));
  }
}

export async function adminCreateTenantInviteFormAction(formData: FormData) {
  const backQs = String(formData.get("return_qs") ?? "");
  try {
    const result = await adminCreateTenantInvite(formData);
    const p = new URLSearchParams(backQs);
    p.set("ok", encodeURIComponent("초대 토큰 발급 완료"));
    p.set("invite_token", encodeURIComponent(result.token));
    p.set("invite_exp", encodeURIComponent(result.expiresAt));
    redirect(`/admin/tenants?${p.toString()}`);
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "초대 발급 실패";
    redirect(internalWithMessage(backQs, "err", encodeURIComponent(msg)));
  }
}

export async function adminChangeTenantMemberRoleFormAction(formData: FormData) {
  const backQs = String(formData.get("return_qs") ?? "");
  try {
    await adminChangeTenantMemberRole(formData);
    redirect(internalWithMessage(backQs, "ok", encodeURIComponent("권한 변경 완료")));
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "권한 변경 실패";
    redirect(internalWithMessage(backQs, "err", encodeURIComponent(msg)));
  }
}

export async function adminRemoveTenantMemberFormAction(formData: FormData) {
  const backQs = String(formData.get("return_qs") ?? "");
  try {
    await adminRemoveTenantMember(formData);
    redirect(internalWithMessage(backQs, "ok", encodeURIComponent("멤버 제거 완료")));
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "멤버 제거 실패";
    redirect(internalWithMessage(backQs, "err", encodeURIComponent(msg)));
  }
}

export async function adminResetTenantManagerPasswordFormAction(formData: FormData) {
  const backQs = String(formData.get("return_qs") ?? "");
  try {
    const result = await adminResetTenantManagerPassword(formData);
    const cookieStore = await cookies();
    cookieStore.set(
      "admin_tenant_pw_flash",
      JSON.stringify({
        tenantId: result.tenantId,
        email: result.targetEmail,
        temporaryPassword: result.temporaryPassword,
        createdAt: Date.now(),
      }),
      {
        path: "/admin/tenants",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 5,
      }
    );
    redirect(internalWithMessage(backQs, "ok", encodeURIComponent(`조직관리자 임시 비밀번호를 재생성했습니다: ${result.targetEmail}`)));
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "조직관리자 비밀번호 재생성 실패";
    redirect(internalWithMessage(backQs, "err", encodeURIComponent(msg)));
  }
}
