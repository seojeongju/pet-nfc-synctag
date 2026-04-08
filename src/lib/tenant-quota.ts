import type { D1Database } from "@cloudflare/workers-types";
import { resolvePersonalPlan, resolveTenantPlan } from "@/lib/plan-resolution";

export async function countPersonalPets(db: D1Database, ownerId: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) as c FROM pets
       WHERE owner_id = ? AND tenant_id IS NULL`
    )
    .bind(ownerId)
    .first<{ c: number }>();
  return Number(row?.c ?? 0);
}

export async function assertPersonalPetQuota(db: D1Database, ownerId: string): Promise<void> {
  const resolved = await resolvePersonalPlan(db, ownerId);
  if (!resolved || resolved.plan.pet_limit == null) return;

  const count = await countPersonalPets(db, ownerId);
  if (count >= resolved.plan.pet_limit) {
    throw new Error(
      `개인 플랜(${resolved.plan.name})의 등록 한도(${resolved.plan.pet_limit}마리)에 도달했습니다.`
    );
  }
}

export async function countTenantPets(db: D1Database, tenantId: string): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) as c FROM pets WHERE tenant_id = ?")
    .bind(tenantId)
    .first<{ c: number }>();
  return Number(row?.c ?? 0);
}

export async function assertTenantPetQuota(db: D1Database, tenantId: string): Promise<void> {
  const resolved = await resolveTenantPlan(db, tenantId);
  if (!resolved) {
    throw new Error("이 조직에 활성 구독 플랜이 없습니다.");
  }
  if (resolved.plan.pet_limit == null) return;

  const count = await countTenantPets(db, tenantId);
  if (count >= resolved.plan.pet_limit) {
    throw new Error(
      `조직 플랜(${resolved.plan.name})의 펫 한도(${resolved.plan.pet_limit}건)에 도달했습니다.`
    );
  }
}

export async function countTenantLinkedTags(db: D1Database, tenantId: string): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) as c FROM tags WHERE tenant_id = ? AND pet_id IS NOT NULL")
    .bind(tenantId)
    .first<{ c: number }>();
  return Number(row?.c ?? 0);
}

export async function assertTenantTagQuota(db: D1Database, tenantId: string): Promise<void> {
  const resolved = await resolveTenantPlan(db, tenantId);
  if (!resolved) {
    throw new Error("이 조직에 활성 구독 플랜이 없습니다.");
  }
  if (resolved.plan.tag_limit == null) return;

  const count = await countTenantLinkedTags(db, tenantId);
  if (count >= resolved.plan.tag_limit) {
    throw new Error(
      `조직 플랜(${resolved.plan.name})의 태그 한도(${resolved.plan.tag_limit}건)에 도달했습니다.`
    );
  }
}
