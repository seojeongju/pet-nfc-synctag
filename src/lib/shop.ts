import type { D1Database } from "@cloudflare/workers-types";
import { nanoid } from "nanoid";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { getCurrentGoldPrice } from "@/lib/gold-price";
import type {
  ShopOrderPublic,
  ShopOrderStatus,
  ShopProductOptionGroup,
  ShopProductOptionValue,
  ShopProductPublic,
} from "@/types/shop";

function parseTargetModesJson(raw: string | null | undefined): SubjectKind[] {
  if (raw == null || !String(raw).trim()) return [];
  try {
    const v = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(v)) return [];
    const out: SubjectKind[] = [];
    for (const x of v) {
      if (typeof x === "string" && (SUBJECT_KINDS as readonly string[]).includes(x)) {
        out.push(x as SubjectKind);
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function productTargetsKind(targetModesJson: string, kind: SubjectKind): boolean {
  return parseTargetModesJson(targetModesJson).includes(kind);
}

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_krw: number;
  active: number;
  target_modes: string;
  image_url: string | null;
  video_url: string | null;
  content_html: string | null;
  additional_images: string | null;
  options_json: string | null;
  stock_quantity: number;
  sort_order: number;
  weight_grams: number | null;
  labor_fee_krw: number | null;
  is_gold_linked: number;
};

async function getShopOrdersColumnSet(db: D1Database): Promise<Set<string>> {
  const r = await db
    .prepare("PRAGMA table_info(shop_orders)")
    .all<{ name: string }>()
    .catch(() => ({ results: [] as { name: string }[] }));
  return new Set((r.results ?? []).map((x) => x.name));
}

/** 마이그레이션 단계별로 shop_products 컬럼이 다를 수 있음 */
async function getShopProductsColumnSet(db: D1Database): Promise<Set<string>> {
  const r = await db.prepare("PRAGMA table_info(shop_products)").all<{ name: string }>();
  return new Set((r.results ?? []).map((x) => x.name));
}

const LIST_SHOP_PRODUCT_COLS: (keyof ProductRow)[] = [
  "id",
  "slug",
  "name",
  "description",
  "price_krw",
  "active",
  "target_modes",
  "image_url",
  "video_url",
  "content_html",
  "additional_images",
  "options_json",
  "stock_quantity",
  "sort_order",
  "weight_grams",
  "labor_fee_krw",
  "is_gold_linked",
];

function normalizeProductRow(raw: Record<string, unknown>, existing: Set<string>): ProductRow {
  const has = (k: keyof ProductRow) => existing.has(k);
  const str = (k: keyof ProductRow, d: string) =>
    has(k) && raw[k] != null ? String(raw[k]) : d;
  const optStr = (k: keyof ProductRow) =>
    !has(k) || raw[k] === null || raw[k] === undefined ? null : String(raw[k]);
  const num = (k: keyof ProductRow, d: number) => {
    if (!has(k) || raw[k] === null || raw[k] === undefined) return d;
    const n = Number(raw[k]);
    return Number.isFinite(n) ? n : d;
  };
  let weightGrams: number | null = null;
  if (has("weight_grams") && raw.weight_grams !== null && raw.weight_grams !== undefined) {
    const n = Number(raw.weight_grams);
    weightGrams = Number.isFinite(n) ? n : null;
  }
  let laborFee: number | null = null;
  if (has("labor_fee_krw") && raw.labor_fee_krw !== null && raw.labor_fee_krw !== undefined) {
    const n = Math.floor(Number(raw.labor_fee_krw));
    laborFee = Number.isFinite(n) ? n : null;
  }
  return {
    id: str("id", ""),
    slug: str("slug", ""),
    name: str("name", ""),
    description: str("description", ""),
    price_krw: Math.floor(num("price_krw", 0)),
    active: has("active") ? (num("active", 0) ? 1 : 0) : 1,
    target_modes: str("target_modes", "[]"),
    image_url: optStr("image_url"),
    video_url: has("video_url") ? optStr("video_url") : null,
    content_html: has("content_html") ? optStr("content_html") : null,
    additional_images: has("additional_images") ? optStr("additional_images") : null,
    options_json: has("options_json") ? optStr("options_json") : null,
    stock_quantity: has("stock_quantity") ? Math.floor(num("stock_quantity", 999)) : 999,
    sort_order: has("sort_order") ? Math.floor(num("sort_order", 0)) : 0,
    weight_grams: weightGrams,
    labor_fee_krw: laborFee,
    is_gold_linked: has("is_gold_linked") ? (num("is_gold_linked", 0) ? 1 : 0) : 0,
  };
}

/**
 * DB에 저장된 options_json을 안전히 파싱합니다.
 * 일부 그룹에 values가 없거나 타입이 깨져 있어도 관리자 폼·스토어에서 렌더가 깨지지 않습니다.
 */
export function parseShopProductOptionsJson(raw: string | null | undefined): ShopProductOptionGroup[] | null {
  if (raw == null || !String(raw).trim()) return null;
  try {
    const v = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(v)) return null;
    const out: ShopProductOptionGroup[] = [];
    for (let idx = 0; idx < v.length; idx++) {
      const item = v[idx];
      const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const id = typeof o.id === "string" && o.id.trim() ? o.id : `group-${idx}`;
      const name =
        typeof o.name === "string" && o.name.trim() ? o.name.trim() : `옵션 ${idx + 1}`;
      let values: ShopProductOptionValue[] = [];
      if (Array.isArray(o.values)) {
        for (let j = 0; j < o.values.length; j++) {
          const val = o.values[j];
          const vo = val && typeof val === "object" ? (val as Record<string, unknown>) : {};
          const label =
            typeof vo.label === "string" && vo.label.trim()
              ? vo.label.trim()
              : `항목 ${j + 1}`;
          const pd = Number(vo.priceDeltaKrw);
          values.push({
            label,
            priceDeltaKrw: Number.isFinite(pd) ? Math.floor(pd) : 0,
          });
        }
      }
      if (values.length === 0) {
        values = [{ label: "기본값", priceDeltaKrw: 0 }];
      }
      out.push({ id, name, values });
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

/** 관리자 폼 등 항상 배열이 필요할 때 */
export function shopProductOptionsForAdmin(raw: string | null | undefined): ShopProductOptionGroup[] {
  return parseShopProductOptionsJson(raw) ?? [];
}

export function parseShopProductAdditionalImagesJson(raw: string | null | undefined): string[] {
  if (raw == null || !String(raw).trim()) return [];
  try {
    const v = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  } catch {
    return [];
  }
}

function rowToPublic(row: ProductRow, kind: SubjectKind, currentGoldPrice: number): ShopProductPublic {
  const additionalImages =
    row.additional_images && String(row.additional_images).trim()
      ? parseShopProductAdditionalImagesJson(row.additional_images)
      : [];

  const options = parseShopProductOptionsJson(row.options_json);

  // 금 시세 연동 상품인 경우 가격 재계산
  let finalPrice = row.price_krw;
  if (row.is_gold_linked && row.weight_grams) {
    const goldValue = currentGoldPrice * row.weight_grams;
    finalPrice = Math.floor(goldValue + (row.labor_fee_krw ?? 0));
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceKrw: finalPrice,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    contentHtml: row.content_html,
    additionalImages: additionalImages.length > 0 ? additionalImages : null,
    options: options,
    stockQuantity: row.stock_quantity,
    weightGrams: row.weight_grams,
    laborFeeKrw: row.labor_fee_krw,
    isGoldLinked: row.is_gold_linked === 1,
    subjectKind: kind,
  };
}

/**
 * 활성 상품 중 `kind`가 target_modes에 포함된 것만 반환합니다.
 */
export async function listShopProductsForKind(
  db: D1Database,
  kind: SubjectKind
): Promise<ShopProductPublic[]> {
  const currentGoldPrice = await getCurrentGoldPrice(db);
  const existing = await getShopProductsColumnSet(db);
  const cols = LIST_SHOP_PRODUCT_COLS.filter((c) => existing.has(c));
  if (!cols.includes("id")) {
    return [];
  }
  const orderSql = existing.has("sort_order")
    ? "ORDER BY sort_order ASC, name ASC"
    : "ORDER BY name ASC";
  const res = await db
    .prepare(
      `SELECT ${cols.join(", ")} FROM shop_products WHERE active = 1 ${orderSql}`
    )
    .all<Record<string, unknown>>();

  const rows = (res.results ?? []).map((r) => normalizeProductRow(r, existing));
  const out: ShopProductPublic[] = [];
  for (const row of rows) {
    if (productTargetsKind(row.target_modes, kind)) {
      out.push(rowToPublic(row, kind, currentGoldPrice));
    }
  }
  return out;
}

export async function getShopProductBySlugForKind(
  db: D1Database,
  slug: string,
  kind: SubjectKind
): Promise<ShopProductPublic | null> {
  const currentGoldPrice = await getCurrentGoldPrice(db);
  const existing = await getShopProductsColumnSet(db);
  const cols = LIST_SHOP_PRODUCT_COLS.filter((c) => existing.has(c));
  if (!cols.includes("id")) {
    return null;
  }
  const raw = await db
    .prepare(`SELECT ${cols.join(", ")} FROM shop_products WHERE slug = ? AND active = 1`)
    .bind(slug)
    .first<Record<string, unknown>>();

  if (!raw) {
    return null;
  }
  const row = normalizeProductRow(raw, existing);
  if (!productTargetsKind(row.target_modes, kind)) {
    return null;
  }
  return rowToPublic(row, kind, currentGoldPrice);
}

export function formatKrw(n: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(n)}원`;
}

export function assertKindInAllowedList(kind: SubjectKind, allowed: SubjectKind[]): void {
  if (!allowed.includes(kind)) {
    throw new ShopForbiddenError("이 모드로 스토어를 이용할 수 없습니다.");
  }
}

export class ShopForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopForbiddenError";
  }
}

export class ShopNotFoundError extends Error {
  constructor(message = "상품을 찾을 수 없습니다.") {
    super(message);
    this.name = "ShopNotFoundError";
  }
}

/**
 * 대기 주문 생성. 결제 게이트웨이 연동 전까지 status=pending.
 */
export async function createPendingShopOrder(input: {
  db: D1Database;
  userId: string;
  kind: SubjectKind;
  productId: string;
  options?: Record<string, string> | null;
  idempotencyKey?: string | null;
}): Promise<{ orderId: string; amountKrw: number; productName: string }> {
  const { db, userId, kind, productId } = input;
  const orderCols = await getShopOrdersColumnSet(db);
  const idempotencyKey =
    typeof input.idempotencyKey === "string" && input.idempotencyKey.trim()
      ? input.idempotencyKey.trim().slice(0, 120)
      : null;

  if (idempotencyKey && orderCols.has("idempotency_key")) {
    const existing = await db
      .prepare(`SELECT id FROM shop_orders WHERE idempotency_key = ?`)
      .bind(idempotencyKey)
      .first<{ id: string }>();
    if (existing?.id) {
      const ord = await getShopOrderByIdForUser(db, existing.id, userId);
      if (ord) {
        return {
          orderId: ord.id,
          amountKrw: ord.amountKrw,
          productName: ord.product.name,
        };
      }
    }
  }

  const tableCols = await getShopProductsColumnSet(db);
  const orderWanted = [
    "id",
    "name",
    "price_krw",
    "target_modes",
    "active",
    "options_json",
    "stock_quantity",
    "weight_grams",
    "labor_fee_krw",
    "is_gold_linked",
  ] as const;
  const orderSelectCols = orderWanted.filter((c) => tableCols.has(c));
  if (!orderSelectCols.includes("id")) {
    throw new ShopNotFoundError();
  }

  const productRaw = await db
    .prepare(`SELECT ${orderSelectCols.join(", ")} FROM shop_products WHERE id = ?`)
    .bind(productId)
    .first<Record<string, unknown>>();

  if (!productRaw) {
    throw new ShopNotFoundError();
  }

  const product = normalizeProductRow(productRaw, tableCols);
  if (!product.active) {
    throw new ShopNotFoundError();
  }

  if (product.stock_quantity <= 0) {
    throw new ShopForbiddenError("죄송합니다. 이 상품은 현재 품절되었습니다.");
  }
  if (!productTargetsKind(product.target_modes, kind)) {
    throw new ShopForbiddenError("이 모드에서 구매할 수 없는 상품입니다.");
  }

  const orderId = nanoid();
  
  // 가격 결정 로직
  let basePrice = product.price_krw;
  if (product.is_gold_linked && product.weight_grams) {
    const currentGoldPrice = await getCurrentGoldPrice(db);
    basePrice = Math.floor(currentGoldPrice * product.weight_grams + (product.labor_fee_krw ?? 0));
  }

  let amountKrw = Math.max(0, Math.floor(Number(basePrice)));

  // 옵션 처리
  if (product.options_json) {
    try {
      const groups = parseShopProductOptionsJson(product.options_json);
      const selected = input.options || {};
      if (groups) {
        for (const g of groups) {
          const choice = selected[g.name];
          if (choice) {
            const v = g.values.find((x) => x.label === choice);
            if (v) {
              amountKrw += v.priceDeltaKrw;
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  const optionsSelectedJson = input.options ? JSON.stringify(input.options) : null;
  const cols = ["id", "user_id", "subject_kind", "product_id", "amount_krw", "status"] as string[];
  const vals: unknown[] = [orderId, userId, kind, product.id, amountKrw, "pending"];
  if (orderCols.has("payment_provider")) {
    cols.push("payment_provider");
    vals.push(null);
  }
  if (orderCols.has("idempotency_key")) {
    cols.push("idempotency_key");
    vals.push(idempotencyKey);
  }
  if (orderCols.has("options_selected_json")) {
    cols.push("options_selected_json");
    vals.push(optionsSelectedJson);
  }
  if (orderCols.has("updated_at")) {
    cols.push("updated_at");
    vals.push(new Date().toISOString());
  }
  const placeholders = cols.map(() => "?").join(", ");
  await db
    .prepare(`INSERT INTO shop_orders (${cols.join(", ")}) VALUES (${placeholders})`)
    .bind(...vals)
    .run();

  return { orderId, amountKrw, productName: product.name };
}

export async function getShopOrderByIdForUser(
  db: D1Database,
  orderId: string,
  userId: string
): Promise<ShopOrderPublic | null> {
  const orderCols = await getShopOrdersColumnSet(db);
  const pickOrder = (name: string, alias = name) =>
    orderCols.has(name) ? `o.${name} AS ${alias}` : `NULL AS ${alias}`;
  const hasShippingDetailTable = Boolean(
    await db
      .prepare(
        `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='shop_order_shipping_details' LIMIT 1`
      )
      .first<{ ok: number }>()
      .catch(() => null)
  );
  const shippingJoin = hasShippingDetailTable
    ? "LEFT JOIN shop_order_shipping_details sd ON sd.order_id = o.id AND sd.user_id = o.user_id"
    : "";

  const row = await db
    .prepare(
      `SELECT o.id, o.subject_kind, o.amount_krw, o.status, ${pickOrder("options_selected_json")},
              ${pickOrder("recipient_name")}, ${pickOrder("recipient_phone")}, ${pickOrder("shipping_zip")}, ${pickOrder("shipping_address")}, ${pickOrder("shipping_address_detail")}, ${pickOrder("shipping_memo")},
              ${hasShippingDetailTable ? "sd.recipient_name AS sd_recipient_name, sd.recipient_phone AS sd_recipient_phone, sd.shipping_zip AS sd_shipping_zip, sd.shipping_address AS sd_shipping_address, sd.shipping_address_detail AS sd_shipping_address_detail, sd.shipping_memo AS sd_shipping_memo" : "NULL AS sd_recipient_name, NULL AS sd_recipient_phone, NULL AS sd_shipping_zip, NULL AS sd_shipping_address, NULL AS sd_shipping_address_detail, NULL AS sd_shipping_memo"},
              o.created_at, o.updated_at,
              p.id AS p_id, p.name AS p_name, p.slug AS p_slug
       FROM shop_orders o
       INNER JOIN shop_products p ON p.id = o.product_id
       ${shippingJoin}
       WHERE o.id = ? AND o.user_id = ?`
    )
    .bind(orderId, userId)
    .first<{
      id: string;
      subject_kind: string;
      amount_krw: number;
      status: string;
      options_selected_json: string | null;
      recipient_name: string | null;
      recipient_phone: string | null;
      shipping_zip: string | null;
      shipping_address: string | null;
      shipping_address_detail: string | null;
      shipping_memo: string | null;
      sd_recipient_name: string | null;
      sd_recipient_phone: string | null;
      sd_shipping_zip: string | null;
      sd_shipping_address: string | null;
      sd_shipping_address_detail: string | null;
      sd_shipping_memo: string | null;
      created_at: string;
      updated_at: string;
      p_id: string;
      p_name: string;
      p_slug: string;
    }>();

  if (!row) return null;

  let selectedOptions: Record<string, string> | null = null;
  if (row.options_selected_json) {
    try {
      const parsed = JSON.parse(row.options_selected_json) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        selectedOptions = parsed as Record<string, string>;
      }
    } catch {
      selectedOptions = null;
    }
  }

  return {
    id: row.id,
    subjectKind: row.subject_kind as SubjectKind,
    status: row.status as ShopOrderStatus,
    amountKrw: row.amount_krw,
    purchasePriceKrw: row.amount_krw,
    product: { id: row.p_id, name: row.p_name, slug: row.p_slug },
    selectedOptions,
    recipientName: row.recipient_name ?? row.sd_recipient_name,
    recipientPhone: row.recipient_phone ?? row.sd_recipient_phone,
    shippingZip: row.shipping_zip ?? row.sd_shipping_zip,
    shippingAddress: row.shipping_address ?? row.sd_shipping_address,
    shippingAddressDetail: row.shipping_address_detail ?? row.sd_shipping_address_detail,
    shippingMemo: row.shipping_memo ?? row.sd_shipping_memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function subjectKindLabel(kind: SubjectKind): string {
  return subjectKindMeta[kind]?.label ?? kind;
}

/** DB 등에서 오는 문자열(subject_kind); 알 수 없으면 원문 표시 */
export function subjectKindLabelKo(kind: string): string {
  if ((SUBJECT_KINDS as readonly string[]).includes(kind)) {
    return subjectKindMeta[kind as SubjectKind].label;
  }
  return kind;
}
