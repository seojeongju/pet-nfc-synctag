"use server";

import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { isPlatformAdminRole, PLATFORM_ADMIN_ROLE } from "@/lib/platform-admin";

const LEGACY_ADMIN = "admin";
const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;
const MIN_PASSWORD_LEN = 8;
const MAX_PASSWORD_LEN = 128;
const CREDENTIAL_PROVIDER = "credential" as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_PLAN_OPTIONS: PlanCodeOption[] = [
  { code: "free", name: "무료" },
  { code: "starter", name: "스타터" },
  { code: "business", name: "비즈니스" },
];

export type AdminUserListRow = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: number | boolean;
  image: string | null;
  role: string | null;
  subscriptionStatus: string | null;
  createdAt: string;
  pet_count: number;
};

export type PlanCodeOption = {
  code: string;
  name: string;
};

export type ListUsersAdminParams = {
  q?: string;
  /** all | user | platform_admin */
  role?: string;
  page?: number;
  pageSize?: number;
};

export type PlatformUserRole = "user" | "platform_admin";

async function requirePlatformAdminActor() {
  const context = getCfRequestContext();
  if (!context?.env) {
    throw new Error("Cloudflare 환경에 연결할 수 없습니다.");
  }
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  const row = await context.env.DB.prepare("SELECT role, email FROM user WHERE id = ?")
    .bind(userId)
    .first<{ role?: string | null; email?: string | null }>();

  if (!isPlatformAdminRole(row?.role)) {
    throw new Error("플랫폼 관리자 권한이 필요합니다.");
  }

  return { actorId: userId, actorEmail: row?.email ?? "unknown" };
}

function isStoredPlatformAdmin(role: string | null | undefined): boolean {
  return role === PLATFORM_ADMIN_ROLE || role === LEGACY_ADMIN;
}

async function countStoredPlatformAdmins(db: ReturnType<typeof getDB>): Promise<number> {
  const r = await db
    .prepare(`SELECT COUNT(*) as c FROM user WHERE role IN (?, ?)`)
    .bind(PLATFORM_ADMIN_ROLE, LEGACY_ADMIN)
    .first<{ c: number }>();
  return Number(r?.c ?? 0);
}

async function writeAdminAudit(actorEmail: string, action: string, payload: unknown) {
  const db = getDB();
  await db
    .prepare("INSERT INTO admin_action_logs (action, actor_email, success, payload) VALUES (?, ?, 1, ?)")
    .bind(action, actorEmail, JSON.stringify(payload))
    .run()
    .catch(() => {});
}

function normalizeEmailInput(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function listPlanCodeOptionsAdmin(): Promise<PlanCodeOption[]> {
  await requirePlatformAdminActor();
  const db = getDB();
  const { results } = await db
    .prepare("SELECT code, name FROM plans ORDER BY sort_order ASC, code ASC")
    .all<PlanCodeOption>()
    .catch(() => ({ results: [] as PlanCodeOption[] }));

  const rows = (results ?? []).filter((r) => (r.code ?? "").trim().length > 0);
  if (rows.length > 0) return rows as PlanCodeOption[];
  return DEFAULT_PLAN_OPTIONS;
}

export async function listUsersAdmin(params: ListUsersAdminParams = {}) {
  await requirePlatformAdminActor();

  const db = getDB();
  const qRaw = (params.q ?? "").trim().slice(0, 120);
  const roleFilter = params.role === "user" || params.role === "platform_admin" ? params.role : "all";
  let page = Number(params.page) || 1;
  if (!Number.isFinite(page) || page < 1) page = 1;
  let pageSize = Number(params.pageSize) || PAGE_SIZE_DEFAULT;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = PAGE_SIZE_DEFAULT;
  pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, pageSize));

  const conditions: string[] = [];
  const binds: unknown[] = [];

  if (qRaw.length > 0) {
    const pat = `%${qRaw.toLowerCase()}%`;
    conditions.push("(LOWER(u.email) LIKE ? OR LOWER(COALESCE(u.name,'')) LIKE ?)");
    binds.push(pat, pat);
  }

  if (roleFilter === "user") {
    conditions.push("(u.role IS NULL OR u.role = '' OR u.role = 'user')");
  } else if (roleFilter === "platform_admin") {
    conditions.push(`(u.role IN (?, ?))`);
    binds.push(PLATFORM_ADMIN_ROLE, LEGACY_ADMIN);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = await db
    .prepare(`SELECT COUNT(*) as c FROM user u ${whereSql}`)
    .bind(...binds)
    .first<{ c: number }>();
  const total = Number(countRow?.c ?? 0);

  const offset = (page - 1) * pageSize;

  const listBinds = [...binds, pageSize, offset];
  const { results } = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.emailVerified, u.image, u.role, u.subscriptionStatus, u.createdAt,
              (SELECT COUNT(*) FROM pets WHERE owner_id = u.id) AS pet_count
       FROM user u
       ${whereSql}
       ORDER BY u.createdAt DESC
       LIMIT ? OFFSET ?`
    )
    .bind(...listBinds)
    .all<AdminUserListRow>();

  const rows = (results ?? []).map((u) => {
    const ev = u.emailVerified as number | boolean | Date;
    return {
    ...u,
    pet_count: Number(u.pet_count ?? 0),
    // Date 객체가 넘어올 경우 직렬화 에러를 방지하기 위해 숫자로 변환
    emailVerified: ev instanceof Date ? ev.getTime() : ev,
  }}) as AdminUserListRow[];

  return {
    rows,
    total,
    page,
    pageSize,
  };
}

/**
 * 플랫폼(전역) 역할만 변경합니다. 테넌트 멤버십과는 무관합니다.
 */
export async function updateUserPlatformRole(targetUserId: string, nextRole: PlatformUserRole) {
  const { actorId, actorEmail } = await requirePlatformAdminActor();
  const db = getDB();

  const trimmedId = targetUserId?.trim();
  if (!trimmedId) {
    throw new Error("대상 사용자가 없습니다.");
  }

  const target = await db
    .prepare("SELECT id, email, role FROM user WHERE id = ?")
    .bind(trimmedId)
    .first<{ id: string; email: string | null; role: string | null }>();

  if (!target) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const prevRole = target.role;
  const wasAdmin = isStoredPlatformAdmin(prevRole);
  const willBeAdmin = nextRole === "platform_admin";

  if (wasAdmin && !willBeAdmin) {
    const admins = await countStoredPlatformAdmins(db);
    if (admins <= 1) {
      throw new Error("마지막 플랫폼 관리자는 일반 사용자로 바꿀 수 없습니다.");
    }
  }

  const storedRole = nextRole === "platform_admin" ? PLATFORM_ADMIN_ROLE : "user";

  await db
    .prepare("UPDATE user SET role = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(storedRole, trimmedId)
    .run();

  await writeAdminAudit(actorEmail, "platform_user_role", {
    targetUserId: trimmedId,
    targetEmail: target.email,
    prevRole,
    nextRole: storedRole,
    actorId,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function updateUserEmailAdmin(targetUserId: string, newEmailRaw: string) {
  const { actorId, actorEmail } = await requirePlatformAdminActor();
  const db = getDB();
  const id = targetUserId?.trim();
  if (!id) {
    throw new Error("대상 사용자가 없습니다.");
  }
  const newEmail = normalizeEmailInput(newEmailRaw);
  if (!newEmail || !EMAIL_RE.test(newEmail)) {
    throw new Error("올바른 이메일 형식이 아닙니다.");
  }

  const target = await db
    .prepare("SELECT id, email FROM user WHERE id = ?")
    .bind(id)
    .first<{ id: string; email: string | null }>();
  if (!target) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }
  if (normalizeEmailInput(target.email ?? "") === newEmail) {
    return;
  }

  const dup = await db
    .prepare("SELECT id FROM user WHERE LOWER(email) = LOWER(?) AND id != ?")
    .bind(newEmail, id)
    .first<{ id: string }>();
  if (dup) {
    throw new Error("이미 사용 중인 이메일입니다.");
  }

  const prev = target.email;
  await db
    .prepare("UPDATE user SET email = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(newEmail, id)
    .run();

  await writeAdminAudit(actorEmail, "platform_user_email", {
    targetUserId: id,
    prevEmail: prev,
    nextEmail: newEmail,
    actorId,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

function assertPasswordPolicy(password: string) {
  if (password.length < MIN_PASSWORD_LEN) {
    throw new Error(`비밀번호는 ${MIN_PASSWORD_LEN}자 이상이어야 합니다.`);
  }
  if (password.length > MAX_PASSWORD_LEN) {
    throw new Error(`비밀번호는 ${MAX_PASSWORD_LEN}자를 넘을 수 없습니다.`);
  }
}

/**
 * 이메일/비밀번호 계정(credential)의 비밀번호를 관리자가 덮어씁니다. 기존 로그인 세션은 모두 종료됩니다.
 * OAuth 전용 사용자의 경우 credential 계정이 없으면 새로 만듭니다.
 */
export async function adminSetUserPassword(targetUserId: string, newPassword: string) {
  const { actorId, actorEmail } = await requirePlatformAdminActor();
  const db = getDB();
  const id = targetUserId?.trim();
  if (!id) {
    throw new Error("대상 사용자가 없습니다.");
  }

  assertPasswordPolicy(newPassword);

  const target = await db
    .prepare("SELECT id, email FROM user WHERE id = ?")
    .bind(id)
    .first<{ id: string; email: string | null }>();
  if (!target) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const hashed = await hashPassword(newPassword);

  const credential = await db
    .prepare("SELECT id FROM account WHERE userId = ? AND providerId = ? LIMIT 1")
    .bind(id, CREDENTIAL_PROVIDER)
    .first<{ id: string }>();

  if (credential?.id) {
    await db
      .prepare(
        `UPDATE account SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND providerId = ?`
      )
      .bind(hashed, id, CREDENTIAL_PROVIDER)
      .run();
  } else {
    const accountRowId = nanoid();
    await db
      .prepare(
        `INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(accountRowId, id, id, CREDENTIAL_PROVIDER, hashed)
      .run();
  }

  await db.prepare("DELETE FROM session WHERE userId = ?").bind(id).run();

  await writeAdminAudit(actorEmail, "platform_user_password_reset", {
    targetUserId: id,
    targetEmail: target.email,
    credentialCreated: !credential?.id,
    actorId,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

/** `plans.code`에 존재하는 코드여야 하며, 레거시 DB에는 없을 수 있어 기본 시드값도 허용합니다. */
const FALLBACK_PLAN_CODES = ["free", "starter", "business"] as const;

async function resolveValidPlanCode(db: ReturnType<typeof getDB>, raw: string): Promise<string> {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) {
    throw new Error("플랜 코드가 비어 있습니다.");
  }

  const row = await db
    .prepare("SELECT code FROM plans WHERE lower(code) = lower(?) LIMIT 1")
    .bind(normalized)
    .first<{ code: string }>();

  if (row?.code) {
    return row.code;
  }

  if ((FALLBACK_PLAN_CODES as readonly string[]).includes(normalized)) {
    return normalized;
  }

  throw new Error(`알 수 없는 구독(플랜) 코드입니다: ${normalized}`);
}

export async function updateUserSubscriptionStatusAdmin(targetUserId: string, subscriptionCode: string) {
  const { actorId, actorEmail } = await requirePlatformAdminActor();
  const db = getDB();
  const id = targetUserId?.trim();
  if (!id) {
    throw new Error("대상 사용자가 없습니다.");
  }

  const code = await resolveValidPlanCode(db, subscriptionCode);

  const target = await db
    .prepare("SELECT id, email, subscriptionStatus FROM user WHERE id = ?")
    .bind(id)
    .first<{ id: string; email: string | null; subscriptionStatus: string | null }>();
  if (!target) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const prev = target.subscriptionStatus;
  if ((prev ?? "free").trim().toLowerCase() === code) {
    return;
  }

  await db
    .prepare("UPDATE user SET subscriptionStatus = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(code, id)
    .run();

  await writeAdminAudit(actorEmail, "platform_user_subscription", {
    targetUserId: id,
    targetEmail: target.email,
    prevSubscriptionStatus: prev,
    nextSubscriptionStatus: code,
    actorId,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function deleteUserAdmin(targetUserId: string) {
  const { actorId, actorEmail } = await requirePlatformAdminActor();
  const db = getDB();
  const id = targetUserId?.trim();
  if (!id) {
    throw new Error("대상 사용자가 없습니다.");
  }

  if (id === actorId) {
    throw new Error("본인 계정은 여기에서 삭제할 수 없습니다.");
  }

  const target = await db
    .prepare("SELECT id, email, role FROM user WHERE id = ?")
    .bind(id)
    .first<{ id: string; email: string | null; role: string | null }>();

  if (!target) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  if (isStoredPlatformAdmin(target.role)) {
    const admins = await countStoredPlatformAdmins(db);
    if (admins <= 1) {
      throw new Error("마지막 플랫폼 관리자 계정은 삭제할 수 없습니다.");
    }
  }

  await db.prepare("DELETE FROM user WHERE id = ?").bind(id).run();

  await writeAdminAudit(actorEmail, "platform_user_delete", {
    targetUserId: id,
    targetEmail: target.email,
    actorId,
    deleted: true,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}
