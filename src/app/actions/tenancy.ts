"use server";

import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB } from "@/lib/db";
import { listTenantsForUser } from "@/lib/tenant-membership";
import { resolvePersonalPlan } from "@/lib/plan-resolution";
import type { TenantWithRole } from "@/types/tenant-subscription";
import type { PersonalPlanResolution } from "@/lib/plan-resolution";
import { nanoid } from "nanoid";

async function requireUserId(): Promise<string> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) {
    throw new Error("로그인이 필요합니다.");
  }
  return uid;
}

/** Logged-in user's org memberships (B2B). */
export async function getMyTenants(): Promise<TenantWithRole[]> {
  const userId = await requireUserId();
  const db = getDB();
  return listTenantsForUser(db, userId);
}

/** Personal plan: subscription row or legacy `user.subscriptionStatus`. */
export async function getMyPersonalPlan(): Promise<PersonalPlanResolution | null> {
  const userId = await requireUserId();
  const db = getDB();
  return resolvePersonalPlan(db, userId);
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

/**
 * Creates a tenant and makes the current user `owner`.
 */
export async function createTenant(
  name: string
): Promise<{ ok: true; tenantId: string; slug: string } | { ok: false; error: string }> {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 120) {
    return { ok: false, error: "조직 이름은 1~120자로 입력해 주세요." };
  }

  try {
    const userId = await requireUserId();
    const db = getDB();
    const tenantId = nanoid();
    let slug = `${slugify(trimmed)}-${nanoid(8)}`;

    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await db
        .prepare(`SELECT id FROM tenants WHERE slug = ? LIMIT 1`)
        .bind(slug)
        .first<{ id: string }>();
      if (!clash) break;
      slug = `${slugify(trimmed)}-${nanoid(8)}`;
    }

    await db
      .prepare(
        `INSERT INTO tenants (id, name, slug, status, created_at, updated_at)
         VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
      .bind(tenantId, trimmed, slug)
      .run();

    await db
      .prepare(
        `INSERT INTO tenant_members (tenant_id, user_id, role, created_at)
         VALUES (?, ?, 'owner', CURRENT_TIMESTAMP)`
      )
      .bind(tenantId, userId)
      .run();

    return { ok: true, tenantId, slug };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "조직을 만들 수 없습니다.";
    return { ok: false, error: msg };
  }
}
