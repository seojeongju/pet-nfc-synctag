import type { D1Database } from "@cloudflare/workers-types";
import { nanoid } from "nanoid";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import type { ShopOrderPublic, ShopProductPublic } from "@/types/shop";

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
  sort_order: number;
};

function rowToPublic(row: ProductRow, kind: SubjectKind): ShopProductPublic {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceKrw: row.price_krw,
    imageUrl: row.image_url,
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
      `SELECT id, slug, name, description, price_krw, active, target_modes, image_url, sort_order
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
      `SELECT id, slug, name, description, price_krw, active, target_modes, image_url, sort_order
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
      `SELECT id, name, price_krw, target_modes, active FROM shop_products WHERE id = ?`
    )
    .bind(productId)
    .first<{
      id: string;
      name: string;
      price_krw: number;
      target_modes: string;
      active: number;
    }>();

  if (!product || !product.active) {
    throw new ShopNotFoundError();
  }
  if (!productTargetsKind(product.target_modes, kind)) {
    throw new ShopForbiddenError("이 모드에서 구매할 수 없는 상품입니다.");
  }

  const orderId = nanoid();
  const amountKrw = Math.max(0, Math.floor(Number(product.price_krw)));

  await db
    .prepare(
      `INSERT INTO shop_orders (id, user_id, subject_kind, product_id, amount_krw, status, payment_provider, idempotency_key, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NULL, ?, CURRENT_TIMESTAMP)`
    )
    .bind(orderId, userId, kind, product.id, amountKrw, idempotencyKey)
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
      `SELECT o.id, o.subject_kind, o.status, o.amount_krw, o.created_at, o.updated_at,
              p.id AS pid, p.name AS pname, p.slug AS pslug
       FROM shop_orders o
       INNER JOIN shop_products p ON p.id = o.product_id
       WHERE o.id = ? AND o.user_id = ?`
    )
    .bind(orderId, userId)
    .first<{
      id: string;
      subject_kind: string;
      status: string;
      amount_krw: number;
      created_at: string;
      updated_at: string;
      pid: string;
      pname: string;
      pslug: string;
    }>();

  if (!row) return null;
  const sk = row.subject_kind as SubjectKind;
  const st = row.status as ShopOrderPublic["status"];
  return {
    id: row.id,
    subjectKind: sk,
    status: st,
    amountKrw: row.amount_krw,
    product: { id: row.pid, name: row.pname, slug: row.pslug },
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
