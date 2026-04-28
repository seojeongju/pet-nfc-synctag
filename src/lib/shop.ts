import type { D1Database } from "@cloudflare/workers-types";
import { nanoid } from "nanoid";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import type {
  ShopOrderPublic,
  ShopOrderStatus,
  ShopProductOptionGroup,
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
};

function parseProductOptionsJson(raw: string | null): ShopProductOptionGroup[] | null {
  if (raw == null || !String(raw).trim()) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return null;
    return v as ShopProductOptionGroup[];
  } catch {
    return null;
  }
}

function rowToPublic(row: ProductRow, kind: SubjectKind): ShopProductPublic {
  let additionalImages: string[] | null = null;
  if (row.additional_images) {
    try {
      additionalImages = JSON.parse(row.additional_images);
    } catch {
      additionalImages = [];
    }
  }

  const options = parseProductOptionsJson(row.options_json);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceKrw: row.price_krw,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    contentHtml: row.content_html,
    additionalImages: additionalImages,
    options: options,
    stockQuantity: row.stock_quantity,
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
  const res = await db
    .prepare(
      `SELECT id, slug, name, description, price_krw, active, target_modes, image_url, video_url, content_html, additional_images, options_json, stock_quantity, sort_order
       FROM shop_products
       WHERE active = 1
       ORDER BY sort_order ASC, name ASC`
    )
    .all<ProductRow>();

  const rows = res.results ?? [];
  const out: ShopProductPublic[] = [];
  for (const row of rows) {
    if (productTargetsKind(row.target_modes, kind)) {
      out.push(rowToPublic(row, kind));
    }
  }
  return out;
}

export async function getShopProductBySlugForKind(
  db: D1Database,
  slug: string,
  kind: SubjectKind
): Promise<ShopProductPublic | null> {
  const row = await db
    .prepare(
      `SELECT id, slug, name, description, price_krw, active, target_modes, image_url, video_url, content_html, additional_images, options_json, stock_quantity, sort_order
       FROM shop_products
       WHERE slug = ? AND active = 1`
    )
    .bind(slug)
    .first<ProductRow>();

  if (!row || !productTargetsKind(row.target_modes, kind)) {
    return null;
  }
  return rowToPublic(row, kind);
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
  const idempotencyKey =
    typeof input.idempotencyKey === "string" && input.idempotencyKey.trim()
      ? input.idempotencyKey.trim().slice(0, 120)
      : null;

  if (idempotencyKey) {
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

  const product = await db
    .prepare(
      `SELECT id, name, price_krw, target_modes, active, options_json, stock_quantity FROM shop_products WHERE id = ?`
    )
    .bind(productId)
    .first<{
      id: string;
      name: string;
      price_krw: number;
      target_modes: string;
      active: number;
      options_json: string | null;
      stock_quantity: number;
    }>();

  if (!product || !product.active) {
    throw new ShopNotFoundError();
  }

  if (product.stock_quantity <= 0) {
    throw new ShopForbiddenError("죄송합니다. 이 상품은 현재 품절되었습니다.");
  }
  if (!productTargetsKind(product.target_modes, kind)) {
    throw new ShopForbiddenError("이 모드에서 구매할 수 없는 상품입니다.");
  }

  const orderId = nanoid();
  let amountKrw = Math.max(0, Math.floor(Number(product.price_krw)));

  // 옵션 처리
  if (product.options_json) {
    try {
      const groups = parseProductOptionsJson(product.options_json);
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

  await db
    .prepare(
      `INSERT INTO shop_orders (id, user_id, subject_kind, product_id, amount_krw, status, payment_provider, idempotency_key, options_selected_json, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NULL, ?, ?, CURRENT_TIMESTAMP)`
    )
    .bind(orderId, userId, kind, product.id, amountKrw, idempotencyKey, optionsSelectedJson)
    .run();

  return { orderId, amountKrw, productName: product.name };
}

export async function getShopOrderByIdForUser(
  db: D1Database,
  orderId: string,
  userId: string
): Promise<ShopOrderPublic | null> {
  const row = await db
    .prepare(
      `SELECT o.id, o.subject_kind, o.amount_krw, o.status, o.options_selected_json,
              o.recipient_name, o.recipient_phone, o.shipping_zip, o.shipping_address, o.shipping_memo,
              o.created_at, o.updated_at,
              p.id AS p_id, p.name AS p_name, p.slug AS p_slug
       FROM shop_orders o
       INNER JOIN shop_products p ON p.id = o.product_id
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
      shipping_memo: string | null;
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
    product: { id: row.p_id, name: row.p_name, slug: row.p_slug },
    selectedOptions,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    shippingZip: row.shipping_zip,
    shippingAddress: row.shipping_address,
    shippingMemo: row.shipping_memo,
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
