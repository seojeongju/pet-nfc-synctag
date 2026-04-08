import type { D1Database } from "@cloudflare/workers-types";
import { resolvePersonalPlan } from "@/lib/plan-resolution";

/**
 * Counts personal-scope pets (no org): `tenant_id` IS NULL.
 */
export async function countPersonalPets(
  db: D1Database,
  ownerId: string
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) as c FROM pets
       WHERE owner_id = ? AND tenant_id IS NULL`
    )
    .bind(ownerId)
    .first<{ c: number }>();
  return Number(row?.c ?? 0);
}

/**
 * Throws if personal pet count is at or over plan `pet_limit` (unlimited when null).
 */
export async function assertPersonalPetQuota(
  db: D1Database,
  ownerId: string
): Promise<void> {
  const resolved = await resolvePersonalPlan(db, ownerId);
  if (!resolved || resolved.plan.pet_limit == null) return;

  const limit = resolved.plan.pet_limit;
  const count = await countPersonalPets(db, ownerId);
  if (count >= limit) {
    throw new Error(
      `개인 플랜(${resolved.plan.name})의 등록 한도(${limit}마리)에 도달했습니다.`
    );
  }
}
