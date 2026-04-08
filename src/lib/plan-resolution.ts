import type { D1Database } from "@cloudflare/workers-types";
import type { PlanRow, SubscriptionRow, TenantStatus } from "@/types/tenant-subscription";

export type PersonalPlanResolution = {
  plan: PlanRow;
  source: "subscription" | "account_setting";
  subscription: SubscriptionRow | null;
};

export async function getPlanById(db: D1Database, planId: string): Promise<PlanRow | null> {
  return await db.prepare("SELECT * FROM plans WHERE id = ?").bind(planId).first<PlanRow>();
}

export async function getPlanByCode(db: D1Database, code: string): Promise<PlanRow | null> {
  return await db.prepare("SELECT * FROM plans WHERE code = ?").bind(code).first<PlanRow>();
}

export async function resolveTenantPlan(
  db: D1Database,
  tenantId: string
): Promise<{ plan: PlanRow; subscription: SubscriptionRow } | null> {
  const sub = await db
    .prepare(
      `SELECT * FROM subscriptions
       WHERE tenant_id = ? AND user_id IS NULL AND status = 'active'
       ORDER BY updated_at DESC LIMIT 1`
    )
    .bind(tenantId)
    .first<SubscriptionRow>();
  if (!sub) return null;

  const plan = await getPlanById(db, sub.plan_id);
  if (!plan) return null;

  return { plan, subscription: sub };
}

export async function resolvePersonalPlan(
  db: D1Database,
  userId: string
): Promise<PersonalPlanResolution | null> {
  const sub = await db
    .prepare(
      `SELECT * FROM subscriptions
       WHERE user_id = ? AND tenant_id IS NULL AND status = 'active'
       ORDER BY updated_at DESC LIMIT 1`
    )
    .bind(userId)
    .first<SubscriptionRow>();

  if (sub) {
    const plan = await getPlanById(db, sub.plan_id);
    if (plan) return { plan, source: "subscription", subscription: sub };
  }

  const userRow = await db
    .prepare("SELECT subscriptionStatus FROM user WHERE id = ?")
    .bind(userId)
    .first<{ subscriptionStatus?: string | null }>();

  const code = (userRow?.subscriptionStatus ?? "free").trim() || "free";
  const plan = await getPlanByCode(db, code);
  if (!plan) return null;

  return { plan, source: "account_setting", subscription: null };
}

export type TenantPlanBundle = {
  tenant: { id: string; name: string; slug: string; status: TenantStatus };
  plan: PlanRow | null;
};

export async function resolveTenantWithPlan(
  db: D1Database,
  tenantId: string
): Promise<TenantPlanBundle | null> {
  const tenant = await db
    .prepare("SELECT id, name, slug, status FROM tenants WHERE id = ?")
    .bind(tenantId)
    .first<{ id: string; name: string; slug: string; status: TenantStatus }>();
  if (!tenant) return null;

  const resolved = await resolveTenantPlan(db, tenantId);
  return { tenant, plan: resolved?.plan ?? null };
}
