import type { D1Database } from "@cloudflare/workers-types";
import type { StorageAddonProductSummary, UserStorageQuotaSummary } from "@/types/storage-quota";

type StorageProfileProjection = {
  base_quota_mb?: number | null;
  used_quota_mb?: number | null;
};

/**
 * 사용자 저장공간 프로필이 없으면 기본(512MB/0MB 사용량)으로 자동 생성합니다.
 */
export async function ensureUserStorageProfile(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO user_storage_profiles (user_id, base_quota_mb, used_quota_mb)
       VALUES (?, 512, 0)`
    )
    .bind(userId)
    .run();
}

export async function getUserStorageQuotaSummary(
  db: D1Database,
  userId: string
): Promise<UserStorageQuotaSummary> {
  await ensureUserStorageProfile(db, userId);

  const profile = await db
    .prepare(
      `SELECT base_quota_mb, used_quota_mb
       FROM user_storage_profiles
       WHERE user_id = ?`
    )
    .bind(userId)
    .first<StorageProfileProjection>();

  const addon = await db
    .prepare(
      `SELECT COALESCE(SUM(p.extra_quota_mb), 0) AS extra_quota_mb
       FROM user_storage_addon_subscriptions s
       INNER JOIN storage_addon_products p ON p.id = s.product_id
       WHERE s.user_id = ?
         AND s.status = 'active'
         AND p.is_active = 1`
    )
    .bind(userId)
    .first<{ extra_quota_mb?: number | null }>();

  const baseQuotaMb = Math.max(0, Number(profile?.base_quota_mb ?? 512));
  const usedQuotaMb = Math.max(0, Number(profile?.used_quota_mb ?? 0));
  const extraQuotaMb = Math.max(0, Number(addon?.extra_quota_mb ?? 0));
  const effectiveQuotaMb = baseQuotaMb + extraQuotaMb;
  const freeQuotaMb = Math.max(0, effectiveQuotaMb - usedQuotaMb);
  const usagePercent = effectiveQuotaMb > 0 ? Math.min(100, Math.round((usedQuotaMb / effectiveQuotaMb) * 100)) : 0;

  return {
    baseQuotaMb,
    usedQuotaMb,
    extraQuotaMb,
    effectiveQuotaMb,
    freeQuotaMb,
    usagePercent,
  };
}

/**
 * 앨범 업로드 직전 용량 초과 여부를 검증합니다.
 */
export async function assertUserStorageQuotaForUpload(
  db: D1Database,
  userId: string,
  incomingSizeMb: number
): Promise<void> {
  const incoming = Math.max(0, Math.ceil(incomingSizeMb));
  const summary = await getUserStorageQuotaSummary(db, userId);
  if (summary.usedQuotaMb + incoming > summary.effectiveQuotaMb) {
    throw new Error(
      `저장공간이 부족합니다. 사용량 ${summary.usedQuotaMb}MB / 총 ${summary.effectiveQuotaMb}MB (추가 필요: ${incoming}MB)`
    );
  }
}

/**
 * 업로드/삭제 후 사용량 증감을 반영합니다.
 * deltaMb: 업로드(+) / 삭제(-)
 */
export async function applyUserStorageUsageDelta(
  db: D1Database,
  userId: string,
  deltaMb: number
): Promise<void> {
  await ensureUserStorageProfile(db, userId);
  const delta = Math.trunc(deltaMb);
  await db
    .prepare(
      `UPDATE user_storage_profiles
       SET used_quota_mb = MAX(0, used_quota_mb + ?),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    )
    .bind(delta, userId)
    .run();
}

export async function listActiveStorageAddonProducts(
  db: D1Database
): Promise<StorageAddonProductSummary[]> {
  const { results } = await db
    .prepare(
      `SELECT id, code, name, extra_quota_mb, monthly_price_krw, sort_order
       FROM storage_addon_products
       WHERE is_active = 1
       ORDER BY sort_order ASC, created_at ASC`
    )
    .all<{
      id: string;
      code: string;
      name: string;
      extra_quota_mb: number;
      monthly_price_krw: number;
      sort_order: number;
    }>();

  return (results ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    extraQuotaMb: Math.max(0, Number(row.extra_quota_mb ?? 0)),
    monthlyPriceKrw: Math.max(0, Number(row.monthly_price_krw ?? 0)),
    sortOrder: Number(row.sort_order ?? 0),
  }));
}
