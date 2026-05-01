import type { D1Database } from "@cloudflare/workers-types";
import { getCurrentGoldPrice, getGoldSettings } from "@/lib/gold-price";

/** 로그인 사용자에게 골드 모드 유료 주문(결제 완료)이 있는지 */
export async function userHasPaidGoldOrder(db: D1Database, userId: string): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS ok FROM shop_orders
       WHERE user_id = ? AND subject_kind = 'gold' AND status = 'paid'
       LIMIT 1`
    )
    .bind(userId)
    .first<{ ok: number }>()
    .catch(() => null);
  return Boolean(row?.ok);
}

export type GoldHoldingPublicRow = {
  orderId: string;
  orderedAt: string;
  productName: string;
  paidAmountKrw: number;
  weightGrams: number | null;
  laborFeeKrw: number | null;
  isGoldLinked: boolean;
  /** 금 시세 연동 상품일 때만 오늘 기준 추정가 */
  estimatedValueKrw: number | null;
};

export type ShopGoldPriceTabPayload = {
  pricePerGram: number;
  useAutoFetch: boolean;
  manualOverridePrice: number | null;
  lastFetchedAt: string | null;
  holdings: GoldHoldingPublicRow[];
};

async function getShopProductsColumnSet(db: D1Database): Promise<Set<string>> {
  const r = await db.prepare("PRAGMA table_info(shop_products)").all<{ name: string }>();
  return new Set((r.results ?? []).map((x) => x.name));
}

function floorEstimate(
  pricePerGram: number,
  weightGrams: number | null,
  laborFeeKrw: number | null,
  isGoldLinked: boolean
): number | null {
  if (!isGoldLinked || weightGrams == null || !Number.isFinite(weightGrams) || weightGrams <= 0) {
    return null;
  }
  return Math.floor(pricePerGram * weightGrams + (laborFeeKrw ?? 0));
}

/**
 * 골드 스토어「오늘의 금시세」탭 — 적용 시세 + 본인 결제 완료 골드 주문별 추정가.
 * 상품 단가 계산은 `listShopProductsForKind` / `rowToPublic`과 동일한 식을 사용합니다.
 */
type GoldOrderProductRow = {
  order_id: string;
  ordered_at: string;
  amount_krw: number;
  product_name: string;
  weight_grams: number | null;
  labor_fee_krw: number | null;
  is_gold_linked: number | null;
};

export async function getShopGoldPriceTabPayload(
  db: D1Database,
  userId: string
): Promise<ShopGoldPriceTabPayload> {
  const [settings, pricePerGram, cols] = await Promise.all([
    getGoldSettings(db),
    getCurrentGoldPrice(db),
    getShopProductsColumnSet(db),
  ]);

  const w = cols.has("weight_grams") ? "p.weight_grams" : "NULL AS weight_grams";
  const l = cols.has("labor_fee_krw") ? "p.labor_fee_krw" : "NULL AS labor_fee_krw";
  const g = cols.has("is_gold_linked") ? "p.is_gold_linked" : "0 AS is_gold_linked";

  const res = await db
    .prepare(
      `SELECT o.id AS order_id, o.created_at AS ordered_at, o.amount_krw,
              p.name AS product_name,
              ${w}, ${l}, ${g}
       FROM shop_orders o
       INNER JOIN shop_products p ON p.id = o.product_id
       WHERE o.user_id = ? AND o.subject_kind = 'gold' AND o.status = 'paid'
       ORDER BY o.created_at DESC`
    )
    .bind(userId)
    .all<GoldOrderProductRow>()
    .catch(() => ({ results: [] as GoldOrderProductRow[] }));

  const rows = res.results ?? [];

  const holdings: GoldHoldingPublicRow[] = rows.map((r) => {
    const isGoldLinked = r.is_gold_linked === 1;
    let weightGrams: number | null = null;
    if (r.weight_grams != null && r.weight_grams !== undefined) {
      const n = Number(r.weight_grams);
      weightGrams = Number.isFinite(n) ? n : null;
    }
    let laborFeeKrw: number | null = null;
    if (r.labor_fee_krw != null && r.labor_fee_krw !== undefined) {
      const n = Math.floor(Number(r.labor_fee_krw));
      laborFeeKrw = Number.isFinite(n) ? n : null;
    }
    return {
      orderId: r.order_id,
      orderedAt: r.ordered_at,
      productName: r.product_name,
      paidAmountKrw: Math.floor(r.amount_krw),
      weightGrams,
      laborFeeKrw,
      isGoldLinked,
      estimatedValueKrw: floorEstimate(pricePerGram, weightGrams, laborFeeKrw, isGoldLinked),
    };
  });

  return {
    pricePerGram,
    useAutoFetch: settings.useAutoFetch,
    manualOverridePrice: settings.manualOverridePrice,
    lastFetchedAt: settings.lastFetchedAt,
    holdings,
  };
}
