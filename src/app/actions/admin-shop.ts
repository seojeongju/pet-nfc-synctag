"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB } from "@/lib/db";
import { SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";
import { getGoldSettings, updateGoldSettings, fetchAndSaveGoldPrice } from "@/lib/gold-price";
import { resolveAdminScope } from "@/lib/admin-authz";

async function assertAdminRole(): Promise<void> {
  await resolveAdminScope("admin");
}

async function getAdminDataScope(): Promise<{ actorId: string; tenantIds: string[] | null }> {
  const { actor, tenantIds } = await resolveAdminScope("admin");
  return { actorId: actor.userId, tenantIds };
}

function buildTenantUserScopeSql(
  userIdColumnExpr: string,
  tenantIds: string[] | null
): { clause: string; binds: string[] } {
  if (!tenantIds || tenantIds.length === 0) {
    return { clause: "", binds: [] };
  }
  const placeholders = tenantIds.map(() => "?").join(", ");
  return {
    clause: ` AND EXISTS (
      SELECT 1
      FROM tenant_members tm_scope
      WHERE tm_scope.user_id = ${userIdColumnExpr}
        AND tm_scope.tenant_id IN (${placeholders})
    )`,
    binds: tenantIds,
  };
}

export type AdminShopProductRow = {
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
  created_at: string;
  updated_at: string;
};

/** D1 마이그레이션 단계에 따라 shop_products 컬럼이 다를 수 있어, SELECT는 실제 존재 컬럼만 사용합니다. */
const ADMIN_SHOP_PRODUCT_SELECT_KEYS: (keyof AdminShopProductRow)[] = [
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
  "created_at",
  "updated_at",
];

async function getShopProductsColumnSet(): Promise<Set<string>> {
  const r = await getDB()
    .prepare("PRAGMA table_info(shop_products)")
    .all<{ name: string }>();
  return new Set((r.results ?? []).map((row) => row.name));
}

function normalizeAdminShopProductRow(
  raw: Record<string, unknown>,
  existing: Set<string>
): AdminShopProductRow {
  const str = (k: keyof AdminShopProductRow, d: string) =>
    existing.has(k) && raw[k] != null ? String(raw[k]) : d;
  const optStr = (k: keyof AdminShopProductRow) =>
    !existing.has(k) || raw[k] === null || raw[k] === undefined ? null : String(raw[k]);

  const num = (k: keyof AdminShopProductRow, d: number) => {
    if (!existing.has(k) || raw[k] === null || raw[k] === undefined) return d;
    const n = Number(raw[k]);
    return Number.isFinite(n) ? n : d;
  };

  let weightGrams: number | null = null;
  if (existing.has("weight_grams") && raw.weight_grams !== null && raw.weight_grams !== undefined) {
    const n = Number(raw.weight_grams);
    weightGrams = Number.isFinite(n) ? n : null;
  }

  let laborFee: number | null = null;
  if (existing.has("labor_fee_krw") && raw.labor_fee_krw !== null && raw.labor_fee_krw !== undefined) {
    const n = Math.floor(Number(raw.labor_fee_krw));
    laborFee = Number.isFinite(n) ? n : null;
  }

  return {
    id: str("id", ""),
    slug: str("slug", ""),
    name: str("name", ""),
    description: str("description", ""),
    price_krw: Math.floor(num("price_krw", 0)),
    active: existing.has("active") ? (num("active", 0) ? 1 : 0) : 1,
    target_modes: str("target_modes", "[]"),
    image_url: optStr("image_url"),
    video_url: existing.has("video_url") ? optStr("video_url") : null,
    content_html: existing.has("content_html") ? optStr("content_html") : null,
    additional_images: existing.has("additional_images") ? optStr("additional_images") : null,
    options_json: existing.has("options_json") ? optStr("options_json") : null,
    stock_quantity: existing.has("stock_quantity") ? Math.floor(num("stock_quantity", 999)) : 999,
    sort_order: existing.has("sort_order") ? Math.floor(num("sort_order", 0)) : 0,
    weight_grams: weightGrams,
    labor_fee_krw: laborFee,
    is_gold_linked: existing.has("is_gold_linked") ? (num("is_gold_linked", 0) ? 1 : 0) : 0,
    created_at: str("created_at", ""),
    updated_at: str("updated_at", ""),
  };
}

export async function listAdminShopProducts(): Promise<AdminShopProductRow[]> {
  await assertAdminRole();
  const existing = await getShopProductsColumnSet();
  const cols = ADMIN_SHOP_PRODUCT_SELECT_KEYS.filter((c) => existing.has(c));
  if (!cols.includes("id")) {
    return [];
  }
  const orderSql = existing.has("sort_order")
    ? "ORDER BY sort_order ASC, name ASC"
    : "ORDER BY name ASC";
  const sql = `SELECT ${cols.join(", ")} FROM shop_products ${orderSql}`;
  const res = await getDB().prepare(sql).all<Record<string, unknown>>();
  return (res.results ?? []).map((row) => normalizeAdminShopProductRow(row, existing));
}

export async function getAdminShopProduct(id: string): Promise<AdminShopProductRow | null> {
  await assertAdminRole();
  const existing = await getShopProductsColumnSet();
  const cols = ADMIN_SHOP_PRODUCT_SELECT_KEYS.filter((c) => existing.has(c));
  if (!cols.includes("id")) {
    return null;
  }
  const sql = `SELECT ${cols.join(", ")} FROM shop_products WHERE id = ?`;
  const row = await getDB()
    .prepare(sql)
    .bind(id)
    .first<Record<string, unknown>>();
  if (!row) return null;
  return normalizeAdminShopProductRow(row, existing);
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** save 시에도 PRAGMA 결과와 맞출 것 — 마이그레이션 누락 D1에서 확장 컬럼 없으면 고정 UPDATE/INSERT가 500 */
const SHOP_PRODUCT_WRITABLE_COLUMNS = [
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
] as const;

type ShopProductWritableCol = (typeof SHOP_PRODUCT_WRITABLE_COLUMNS)[number];

function filterShopProductWriteColumns(existing: Set<string>): ShopProductWritableCol[] {
  return SHOP_PRODUCT_WRITABLE_COLUMNS.filter((c) => existing.has(c));
}

function buildShopProductWriteBinds(
  writeCols: ShopProductWritableCol[],
  p: {
    slugRaw: string;
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
    isGoldLinked: number;
  }
): unknown[] {
  const m: Record<ShopProductWritableCol, unknown> = {
    slug: p.slugRaw,
    name: p.name,
    description: p.description,
    price_krw: p.price_krw,
    active: p.active,
    target_modes: p.target_modes,
    image_url: p.image_url,
    video_url: p.video_url,
    content_html: p.content_html,
    additional_images: p.additional_images,
    options_json: p.options_json,
    stock_quantity: p.stock_quantity,
    sort_order: p.sort_order,
    weight_grams: p.weight_grams,
    labor_fee_krw: p.labor_fee_krw,
    is_gold_linked: p.isGoldLinked,
  };
  return writeCols.map((c) => m[c]);
}

function parseKindsFromForm(formData: FormData): SubjectKind[] {
  const out: SubjectKind[] = [];
  for (const k of SUBJECT_KINDS) {
    if (formData.get(`kind_${k}`) === "on") out.push(k);
  }
  return out;
}

export async function saveShopProduct(formData: FormData): Promise<void> {
  await assertAdminRole();

  const idExisting = String(formData.get("id") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = Number(formData.get("price_krw"));
  const stockRaw = Number(formData.get("stock_quantity") ?? 999);
  const sortRaw = Number(formData.get("sort_order"));
  const active = formData.get("active") === "on" ? 1 : 0;
  const imageUrlRaw = String(formData.get("image_url") ?? "").trim();
  const videoUrlRaw = String(formData.get("video_url") ?? "").trim();
  const contentHtml = String(formData.get("content_html") ?? "").trim();
  const additionalImagesRaw = String(formData.get("additional_images") ?? "").trim();
  const optionsJsonRaw = String(formData.get("options_json") ?? "").trim();
  const weightGramsRaw = formData.get("weight_grams");
  const laborFeeRaw = formData.get("labor_fee_krw");
  const isGoldLinked = formData.get("is_gold_linked") === "on" ? 1 : 0;

  const modes = parseKindsFromForm(formData);
  const target_modes = JSON.stringify(modes);

  if (!slugRaw || !SLUG_RE.test(slugRaw)) {
    redirect(`/admin/shop/products${idExisting ? `/${encodeURIComponent(idExisting)}` : "/new"}?e=${encodeURIComponent("슬러그는 영문 소문자·숫자·하이픈만 사용합니다.")}`);
  }
  if (!name) {
    redirect(`/admin/shop/products${idExisting ? `/${encodeURIComponent(idExisting)}` : "/new"}?e=${encodeURIComponent("상품명을 입력하세요.")}`);
  }
  if (!Number.isFinite(priceRaw) || priceRaw < 0) {
    redirect(`/admin/shop/products${idExisting ? `/${encodeURIComponent(idExisting)}` : "/new"}?e=${encodeURIComponent("가격이 올바르지 않습니다.")}`);
  }
  if (!Number.isFinite(sortRaw)) {
    redirect(`/admin/shop/products${idExisting ? `/${encodeURIComponent(idExisting)}` : "/new"}?e=${encodeURIComponent("정렬 순서가 올바르지 않습니다.")}`);
  }
  if (modes.length === 0) {
    redirect(`/admin/shop/products${idExisting ? `/${encodeURIComponent(idExisting)}` : "/new"}?e=${encodeURIComponent("노출 모드를 최소 1개 이상 선택하세요.")}`);
  }

  const price_krw = Math.floor(priceRaw);
  const stock_quantity = Math.floor(stockRaw);
  const sort_order = Math.floor(sortRaw);
  const image_url = imageUrlRaw.length > 0 ? imageUrlRaw.slice(0, 2048) : null;
  const video_url = videoUrlRaw.length > 0 ? videoUrlRaw.slice(0, 2048) : null;
  const additional_images = additionalImagesRaw.length > 0 ? additionalImagesRaw : null;
  const content_html = contentHtml.length > 0 ? contentHtml : null;
  const options_json = optionsJsonRaw.length > 0 ? optionsJsonRaw : null;
  const weight_grams = weightGramsRaw
    ? (() => {
        const n = parseFloat(String(weightGramsRaw));
        return Number.isFinite(n) ? n : null;
      })()
    : null;
  const labor_fee_krw = laborFeeRaw
    ? (() => {
        const n = parseInt(String(laborFeeRaw), 10);
        return Number.isFinite(n) ? n : null;
      })()
    : null;

  const db = getDB();
  const shopCols = await getShopProductsColumnSet();
  if (!shopCols.has("id")) {
    redirect(
      `/admin/shop/products${idExisting ? `/${encodeURIComponent(idExisting)}` : "/new"}?e=${encodeURIComponent("shop_products 테이블이 없습니다. D1 마이그레이션을 확인하세요.")}`
    );
  }
  const writeCols = filterShopProductWriteColumns(shopCols);
  if (writeCols.length === 0) {
    redirect(
      `/admin/shop/products${idExisting ? `/${encodeURIComponent(idExisting)}` : "/new"}?e=${encodeURIComponent("shop_products 스키마에 저장 가능한 컬럼이 없습니다.")}`
    );
  }
  /** 상품 폼에서 골드 연동 필드를 제거한 경우: 수정 시 DB 기존 값 유지 (금 시세 메뉴 등과 중복 방지) */
  const formIncludesGoldFields =
    formData.has("weight_grams") ||
    formData.has("labor_fee_krw") ||
    formData.has("is_gold_linked");
  const colsForSave =
    idExisting && !formIncludesGoldFields
      ? writeCols.filter(
          (c) => c !== "weight_grams" && c !== "labor_fee_krw" && c !== "is_gold_linked"
        )
      : writeCols;
  const writeBinds = buildShopProductWriteBinds(colsForSave, {
    slugRaw,
    name,
    description,
    price_krw,
    active,
    target_modes,
    image_url,
    video_url,
    content_html,
    additional_images,
    options_json,
    stock_quantity,
    sort_order,
    weight_grams,
    labor_fee_krw,
    isGoldLinked,
  });

  if (idExisting) {
    const dup = await db
      .prepare(`SELECT id FROM shop_products WHERE slug = ? AND id != ?`)
      .bind(slugRaw, idExisting)
      .first<{ id: string }>();
    if (dup) {
      redirect(`/admin/shop/products/${encodeURIComponent(idExisting)}?e=${encodeURIComponent("이미 사용 중인 슬러그입니다.")}`);
    }
    const setSql = writeCols.map((c) => `${c} = ?`).join(", ");
    const tsSql = shopCols.has("updated_at") ? ", updated_at = CURRENT_TIMESTAMP" : "";
    await db
      .prepare(`UPDATE shop_products SET ${setSql}${tsSql} WHERE id = ?`)
      .bind(...writeBinds, idExisting)
      .run();
    revalidatePath("/admin/shop");
    revalidatePath("/admin/shop/products");
    revalidatePath("/shop");
    redirect(`/admin/shop/products?ok=1`);
  }

  const dupNew = await db.prepare(`SELECT id FROM shop_products WHERE slug = ?`).bind(slugRaw).first<{ id: string }>();
  if (dupNew) {
    redirect(`/admin/shop/products/new?e=${encodeURIComponent("이미 사용 중인 슬러그입니다.")}`);
  }

  const newId = nanoid();
  const insertCols = ["id", ...writeCols];
  const placeholders = insertCols.map(() => "?").join(", ");
  const insertSql = shopCols.has("updated_at")
    ? `INSERT INTO shop_products (${insertCols.join(", ")}, updated_at) VALUES (${placeholders}, CURRENT_TIMESTAMP)`
    : `INSERT INTO shop_products (${insertCols.join(", ")}) VALUES (${placeholders})`;
  await db.prepare(insertSql).bind(newId, ...writeBinds).run();
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/products");
  revalidatePath("/shop");
  redirect(`/admin/shop/products?ok=1`);
}

/**
 * 상품 관련 에셋(이미지, 영상) 업로드
 */
export async function uploadShopAsset(formData: FormData): Promise<{ url: string }> {
  await assertAdminRole();
  const file = formData.get("file") as File;
  if (!file || !file.size) throw new Error("업로드할 파일을 선택해 주세요.");

  // 이미지/영상 타입 체크
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) throw new Error("이미지 또는 영상 파일만 업로드할 수 있습니다.");

  const context = getCfRequestContext();
  const r2 = context.env.R2;
  const folder = isImage ? "shop/images" : "shop/videos";
  const key = `${folder}/${nanoid()}-${file.name.replace(/[^\w.\-]/g, "_")}`;

  const buf = await file.arrayBuffer();
  await r2.put(key, buf, {
    httpMetadata: { contentType: file.type }
  });

  return { url: `/api/r2/${key}` };
}

export type AdminShopOrderRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  subject_kind: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  amount_krw: number;
  status: string;
  external_payment_id: string | null;
  options_selected_json: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  shipping_zip: string | null;
  shipping_address: string | null;
  shipping_memo: string | null;
  resale_policy_id: string | null;
  resale_enabled: number | null;
  resale_offer_price_krw: number | null;
  resale_visible_from: string | null;
  resale_visibility_scope: string | null;
  resale_targets_csv: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminGoldResaleBuyerRow = {
  user_id: string;
  user_email: string;
  user_name: string | null;
  order_count: number;
  total_amount_krw: number;
  last_order_at: string | null;
  last_order_id: string | null;
  last_policy_enabled: number | null;
  last_resale_offer_price_krw: number | null;
  last_resale_visible_from: string | null;
};

export async function listAdminShopOrders(options: {
  limit?: number;
  status?: "all" | "pending" | "paid" | "failed" | "cancelled";
  query?: string;
}): Promise<AdminShopOrderRow[]> {
  const scope = await getAdminDataScope();
  const db = getDB();
  const limit = Math.min(200, Math.max(1, Math.trunc(options.limit ?? 100)));
  const status = options.status ?? "all";
  const q = (options.query ?? "").trim();

  const where: string[] = [];
  const binds: (string | number)[] = [];
  if (status !== "all") {
    where.push("o.status = ?");
    binds.push(status);
  }
  if (q) {
    where.push(
      "(o.id LIKE ? OR u.email LIKE ? OR p.name LIKE ? OR p.slug LIKE ?)"
    );
    const like = `%${q}%`;
    binds.push(like, like, like, like);
  }
  const tenantScope = buildTenantUserScopeSql("o.user_id", scope.tenantIds);
  if (tenantScope.clause) {
    where.push(`1=1 ${tenantScope.clause}`);
    binds.push(...tenantScope.binds);
  }
  const orderCols = new Set(
    (
      await db
        .prepare("PRAGMA table_info(shop_orders)")
        .all<{ name: string }>()
        .catch(() => ({ results: [] as { name: string }[] }))
    ).results.map((x) => x.name)
  );
  const hasOrderCol = (name: string) => orderCols.has(name);
  const selectOrderCol = (name: string, alias?: string) =>
    hasOrderCol(name) ? `o.${name}${alias ? ` AS ${alias}` : ""}` : `NULL AS ${alias ?? name}`;

  const hasResalePolicyTable = Boolean(
    await db
      .prepare(
        `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='gold_order_resale_policies' LIMIT 1`
      )
      .first<{ ok: number }>()
      .catch(() => null)
  );
  const hasResaleTargetsTable = Boolean(
    await db
      .prepare(
        `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='gold_order_resale_targets' LIMIT 1`
      )
      .first<{ ok: number }>()
      .catch(() => null)
  );

  const resaleSelect = hasResalePolicyTable
    ? `rp.id AS resale_policy_id, rp.enabled AS resale_enabled, rp.resale_offer_price_krw, rp.resale_visible_from, rp.visibility_scope AS resale_visibility_scope,
          ${
            hasResaleTargetsTable
              ? `(SELECT group_concat(t.user_id, ',') FROM gold_order_resale_targets t WHERE t.policy_id = rp.id)`
              : "NULL"
          } AS resale_targets_csv,`
    : `NULL AS resale_policy_id, NULL AS resale_enabled, NULL AS resale_offer_price_krw, NULL AS resale_visible_from, NULL AS resale_visibility_scope, NULL AS resale_targets_csv,`;

  const resaleJoin = hasResalePolicyTable
    ? `LEFT JOIN gold_order_resale_policies rp ON rp.order_id = o.id`
    : ``;

  const sql = `SELECT o.id, o.user_id, u.email AS user_email, o.subject_kind, o.product_id,
          p.name AS product_name, p.slug AS product_slug, o.amount_krw, o.status,
          ${selectOrderCol("payment_provider")},
          ${selectOrderCol("external_payment_id")},
          ${selectOrderCol("options_selected_json")},
          ${selectOrderCol("recipient_name")},
          ${selectOrderCol("recipient_phone")},
          ${selectOrderCol("shipping_zip")},
          ${selectOrderCol("shipping_address")},
          ${selectOrderCol("shipping_memo")},
          ${resaleSelect}
          o.created_at, o.updated_at
       FROM shop_orders o
       INNER JOIN shop_products p ON p.id = o.product_id
       LEFT JOIN user u ON u.id = o.user_id
       ${resaleJoin}
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY o.created_at DESC
       LIMIT ?`;
  binds.push(limit);

  const res = await db
    .prepare(sql)
    .bind(...binds)
    .all<AdminShopOrderRow>();
  return res.results ?? [];
}

export async function updateShopOrderStatus(formData: FormData): Promise<void> {
  const scope = await getAdminDataScope();
  const orderId = String(formData.get("order_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const allowed = ["pending", "paid", "failed", "cancelled"] as const;
  if (!orderId || !(allowed as readonly string[]).includes(status)) {
    redirect("/admin/shop/orders?e=" + encodeURIComponent("잘못된 요청입니다."));
  }
  const db = getDB();
  if (scope.tenantIds && scope.tenantIds.length > 0) {
    const scoped = await db
      .prepare(
        `SELECT o.id
         FROM shop_orders o
         WHERE o.id = ?
           AND EXISTS (
             SELECT 1
             FROM tenant_members tm
             WHERE tm.user_id = o.user_id
               AND tm.tenant_id IN (${scope.tenantIds.map(() => "?").join(", ")})
           )
         LIMIT 1`
      )
      .bind(orderId, ...scope.tenantIds)
      .first<{ id: string }>();
    if (!scoped?.id) {
      redirect("/admin/shop/orders?e=" + encodeURIComponent("해당 주문을 변경할 권한이 없습니다."));
    }
  }
  await db
    .prepare(`UPDATE shop_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(status, orderId)
    .run();
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/orders");
  revalidatePath("/shop");
  redirect("/admin/shop/orders?ok=1");
}

async function assertGoldResaleTablesReady(): Promise<void> {
  const db = getDB();
  const hasPolicyTable = Boolean(
    await db
      .prepare(
        `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='gold_order_resale_policies' LIMIT 1`
      )
      .first<{ ok: number }>()
      .catch(() => null)
  );
  const hasTargetTable = Boolean(
    await db
      .prepare(
        `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='gold_order_resale_targets' LIMIT 1`
      )
      .first<{ ok: number }>()
      .catch(() => null)
  );
  if (!hasPolicyTable || !hasTargetTable) {
    throw new Error(
      "되팔기 정책 테이블이 없습니다. migrations/0024_gold_order_resale_policies.sql 적용이 필요합니다."
    );
  }
}

export async function listAdminGoldResaleBuyers(options: {
  limit?: number;
  query?: string;
}): Promise<AdminGoldResaleBuyerRow[]> {
  const scope = await getAdminDataScope();
  await assertGoldResaleTablesReady();
  const db = getDB();
  const limit = Math.min(500, Math.max(1, Math.trunc(options.limit ?? 200)));
  const q = (options.query ?? "").trim();
  const whereParts = ["o.subject_kind = 'gold'", "o.status = 'paid'"];
  const binds: (string | number)[] = [];
  if (q) {
    whereParts.push("(u.email LIKE ? OR COALESCE(u.name,'') LIKE ? OR o.user_id LIKE ?)");
    const like = `%${q}%`;
    binds.push(like, like, like);
  }
  if (scope.tenantIds && scope.tenantIds.length > 0) {
    whereParts.push(
      `EXISTS (
        SELECT 1
        FROM tenant_members tm_scope
        WHERE tm_scope.user_id = o.user_id
          AND tm_scope.tenant_id IN (${scope.tenantIds.map(() => "?").join(", ")})
      )`
    );
    binds.push(...scope.tenantIds);
  }
  const whereSql = `WHERE ${whereParts.join(" AND ")}`;

  const sql = `
    SELECT
      o.user_id,
      u.email AS user_email,
      u.name AS user_name,
      COUNT(*) AS order_count,
      COALESCE(SUM(o.amount_krw), 0) AS total_amount_krw,
      MAX(o.created_at) AS last_order_at,
      (
        SELECT o2.id
        FROM shop_orders o2
        WHERE o2.user_id = o.user_id
          AND o2.subject_kind = 'gold'
          AND o2.status = 'paid'
        ORDER BY o2.created_at DESC
        LIMIT 1
      ) AS last_order_id,
      (
        SELECT rp.enabled
        FROM gold_order_resale_policies rp
        INNER JOIN shop_orders o3 ON o3.id = rp.order_id
        WHERE o3.user_id = o.user_id
          AND o3.subject_kind = 'gold'
          AND o3.status = 'paid'
        ORDER BY o3.created_at DESC
        LIMIT 1
      ) AS last_policy_enabled,
      (
        SELECT rp.resale_offer_price_krw
        FROM gold_order_resale_policies rp
        INNER JOIN shop_orders o3 ON o3.id = rp.order_id
        WHERE o3.user_id = o.user_id
          AND o3.subject_kind = 'gold'
          AND o3.status = 'paid'
        ORDER BY o3.created_at DESC
        LIMIT 1
      ) AS last_resale_offer_price_krw,
      (
        SELECT rp.resale_visible_from
        FROM gold_order_resale_policies rp
        INNER JOIN shop_orders o3 ON o3.id = rp.order_id
        WHERE o3.user_id = o.user_id
          AND o3.subject_kind = 'gold'
          AND o3.status = 'paid'
        ORDER BY o3.created_at DESC
        LIMIT 1
      ) AS last_resale_visible_from
    FROM shop_orders o
    INNER JOIN user u ON u.id = o.user_id
    ${whereSql}
    GROUP BY o.user_id, u.email, u.name
    ORDER BY last_order_at DESC
    LIMIT ?`;
  binds.push(limit);
  const res = await db.prepare(sql).bind(...binds).all<AdminGoldResaleBuyerRow>();
  return (res.results ?? []).map((row) => ({
    ...row,
    order_count: Number(row.order_count ?? 0),
    total_amount_krw: Number(row.total_amount_krw ?? 0),
    last_policy_enabled:
      row.last_policy_enabled === null || row.last_policy_enabled === undefined
        ? null
        : Number(row.last_policy_enabled) ? 1 : 0,
    last_resale_offer_price_krw:
      row.last_resale_offer_price_krw === null || row.last_resale_offer_price_krw === undefined
        ? null
        : Number(row.last_resale_offer_price_krw),
  }));
}

export async function applyGoldResalePolicyToBuyers(formData: FormData): Promise<void> {
  const dataScope = await getAdminDataScope();
  await assertGoldResaleTablesReady();
  const actorId = dataScope.actorId;
  const buyerIds = formData
    .getAll("buyer_user_id")
    .map((x) => String(x).trim())
    .filter(Boolean);
  if (buyerIds.length === 0) {
    redirect("/admin/shop/resale?e=" + encodeURIComponent("적용할 구매자를 한 명 이상 선택해 주세요."));
  }
  const enabled = formData.get("resale_enabled") === "on" ? 1 : 0;
  const visibilityScopeRaw = String(formData.get("resale_visibility_scope") ?? "order_buyer").trim();
  const visibilityScope =
    visibilityScopeRaw === "selected_buyers" ? "selected_buyers" : "order_buyer";
  const priceRaw = Number(formData.get("resale_offer_price_krw"));
  const visibleFromRaw = String(formData.get("resale_visible_from") ?? "").trim();
  const includeBuyer = formData.get("include_order_buyer") === "on";
  const targetsCsv = String(formData.get("resale_targets_csv") ?? "").trim();

  if (!Number.isFinite(priceRaw) || priceRaw < 0) {
    redirect("/admin/shop/resale?e=" + encodeURIComponent("판매가를 올바르게 입력해 주세요."));
  }
  let visibleFromIso: string | null = null;
  if (visibleFromRaw) {
    const dt = new Date(visibleFromRaw);
    if (!Number.isFinite(dt.getTime())) {
      redirect("/admin/shop/resale?e=" + encodeURIComponent("노출 시작일시가 올바르지 않습니다."));
    }
    visibleFromIso = dt.toISOString();
  }

  const db = getDB();
  const placeholders = buyerIds.map(() => "?").join(", ");
  const tenantScopeSql =
    dataScope.tenantIds && dataScope.tenantIds.length > 0
      ? ` AND EXISTS (
          SELECT 1
          FROM tenant_members tm_scope
          WHERE tm_scope.user_id = shop_orders.user_id
            AND tm_scope.tenant_id IN (${dataScope.tenantIds.map(() => "?").join(", ")})
        )`
      : "";
  const orderRows = await db
    .prepare(
      `SELECT id, user_id, amount_krw
       FROM shop_orders
       WHERE subject_kind = 'gold'
         AND status = 'paid'
         AND user_id IN (${placeholders})
         ${tenantScopeSql}`
    )
    .bind(...buyerIds, ...(dataScope.tenantIds ?? []))
    .all<{ id: string; user_id: string; amount_krw: number }>();
  const orders = orderRows.results ?? [];
  if (orders.length === 0) {
    redirect("/admin/shop/resale?e=" + encodeURIComponent("선택한 구매자의 유효한 골드 결제 주문이 없습니다."));
  }

  const requestedTargets = new Set<string>();
  if (visibilityScope === "selected_buyers") {
    for (const token of targetsCsv.split(",")) {
      const t = token.trim();
      if (t) requestedTargets.add(t);
    }
  }

  for (const order of orders) {
    const existing = await db
      .prepare(`SELECT id FROM gold_order_resale_policies WHERE order_id = ?`)
      .bind(order.id)
      .first<{ id: string }>();
    const policyId = existing?.id ?? nanoid();
    if (!existing?.id) {
      await db
        .prepare(
          `INSERT INTO gold_order_resale_policies
            (id, order_id, purchase_price_krw, resale_offer_price_krw, resale_visible_from, visibility_scope, enabled, created_by_user_id, updated_by_user_id, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .bind(
          policyId,
          order.id,
          order.amount_krw,
          Math.floor(priceRaw),
          visibleFromIso,
          visibilityScope,
          enabled,
          actorId,
          actorId
        )
        .run();
    } else {
      await db
        .prepare(
          `UPDATE gold_order_resale_policies
           SET resale_offer_price_krw = ?, resale_visible_from = ?, visibility_scope = ?, enabled = ?, updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        )
        .bind(Math.floor(priceRaw), visibleFromIso, visibilityScope, enabled, actorId, policyId)
        .run();
    }

    const targets = new Set<string>(requestedTargets);
    if (visibilityScope === "selected_buyers" && includeBuyer) {
      targets.add(order.user_id);
    }
    await db.prepare(`DELETE FROM gold_order_resale_targets WHERE policy_id = ?`).bind(policyId).run();
    for (const userId of targets) {
      await db
        .prepare(`INSERT INTO gold_order_resale_targets (id, policy_id, user_id) VALUES (?, ?, ?)`)
        .bind(nanoid(), policyId, userId)
        .run();
    }
  }

  revalidatePath("/admin/shop/resale");
  revalidatePath("/admin/shop/orders");
  revalidatePath("/shop");
  redirect(
    "/admin/shop/resale?ok=1&m=" +
      encodeURIComponent(`${buyerIds.length}명 구매자 / ${orders.length}건 주문에 되팔기 정책을 반영했습니다.`)
  );
}

export async function saveGoldOrderResalePolicy(formData: FormData): Promise<void> {
  await assertAdminRole();
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const actorId = session?.user?.id;
  if (!actorId) {
    redirect("/admin/shop/orders?e=" + encodeURIComponent("로그인이 필요합니다."));
  }

  const db = getDB();
  const hasPolicyTable = Boolean(
    await db
      .prepare(
        `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='gold_order_resale_policies' LIMIT 1`
      )
      .first<{ ok: number }>()
      .catch(() => null)
  );
  const hasTargetTable = Boolean(
    await db
      .prepare(
        `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='gold_order_resale_targets' LIMIT 1`
      )
      .first<{ ok: number }>()
      .catch(() => null)
  );
  if (!hasPolicyTable || !hasTargetTable) {
    redirect(
      "/admin/shop/orders?e=" +
        encodeURIComponent("되팔기 정책 테이블이 없습니다. migrations/0024_gold_order_resale_policies.sql 적용이 필요합니다.")
    );
  }
  const orderId = String(formData.get("order_id") ?? "").trim();
  const enabled = formData.get("resale_enabled") === "on" ? 1 : 0;
  const scopeRaw = String(formData.get("resale_visibility_scope") ?? "order_buyer").trim();
  const scope =
    scopeRaw === "selected_buyers" ? "selected_buyers" : "order_buyer";
  const priceRaw = Number(formData.get("resale_offer_price_krw"));
  const visibleFromRaw = String(formData.get("resale_visible_from") ?? "").trim();
  const targetCsv = String(formData.get("resale_targets_csv") ?? "").trim();
  const includeBuyer = formData.get("include_order_buyer") === "on";

  if (!orderId) {
    redirect("/admin/shop/orders?e=" + encodeURIComponent("주문 ID가 필요합니다."));
  }
  if (!Number.isFinite(priceRaw) || priceRaw < 0) {
    redirect("/admin/shop/orders?e=" + encodeURIComponent("판매가를 올바르게 입력해 주세요."));
  }

  const order = await db
    .prepare(`SELECT id, user_id, subject_kind, amount_krw FROM shop_orders WHERE id = ?`)
    .bind(orderId)
    .first<{ id: string; user_id: string; subject_kind: string; amount_krw: number }>();
  if (!order) {
    redirect("/admin/shop/orders?e=" + encodeURIComponent("주문을 찾을 수 없습니다."));
  }
  if (order.subject_kind !== "gold") {
    redirect("/admin/shop/orders?e=" + encodeURIComponent("골드 주문만 되팔기 설정이 가능합니다."));
  }

  let visibleFromIso: string | null = null;
  if (visibleFromRaw) {
    const dt = new Date(visibleFromRaw);
    if (!Number.isFinite(dt.getTime())) {
      redirect("/admin/shop/orders?e=" + encodeURIComponent("노출 시작일시가 올바르지 않습니다."));
    }
    visibleFromIso = dt.toISOString();
  }

  const existing = await db
    .prepare(`SELECT id FROM gold_order_resale_policies WHERE order_id = ?`)
    .bind(orderId)
    .first<{ id: string }>();

  const policyId = existing?.id ?? nanoid();
  if (!existing?.id) {
    await db
      .prepare(
        `INSERT INTO gold_order_resale_policies
          (id, order_id, purchase_price_krw, resale_offer_price_krw, resale_visible_from, visibility_scope, enabled, created_by_user_id, updated_by_user_id, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .bind(
        policyId,
        orderId,
        order.amount_krw,
        Math.floor(priceRaw),
        visibleFromIso,
        scope,
        enabled,
        actorId,
        actorId
      )
      .run();
  } else {
    await db
      .prepare(
        `UPDATE gold_order_resale_policies
         SET resale_offer_price_krw = ?, resale_visible_from = ?, visibility_scope = ?, enabled = ?, updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(Math.floor(priceRaw), visibleFromIso, scope, enabled, actorId, policyId)
      .run();
  }

  const targets = new Set<string>();
  if (scope === "selected_buyers") {
    for (const token of targetCsv.split(",")) {
      const t = token.trim();
      if (t) targets.add(t);
    }
    if (includeBuyer) targets.add(order.user_id);
  }

  await db.prepare(`DELETE FROM gold_order_resale_targets WHERE policy_id = ?`).bind(policyId).run();
  for (const userId of targets) {
    await db
      .prepare(`INSERT INTO gold_order_resale_targets (id, policy_id, user_id) VALUES (?, ?, ?)`)
      .bind(nanoid(), policyId, userId)
      .run();
  }

  revalidatePath("/admin/shop/orders");
  revalidatePath(`/shop/orders/${encodeURIComponent(orderId)}`);
  redirect("/admin/shop/orders?ok=1");
}

// 금 시세 관련 액션
export async function getAdminGoldSettings() {
  await assertAdminRole();
  return await getGoldSettings(getDB());
}

export async function saveAdminGoldSettings(formData: FormData) {
  await assertAdminRole();
  const useAutoFetch = formData.get("use_auto_fetch") === "on";
  const manualPriceRaw = formData.get("manual_override_price");
  const manualOverridePrice = manualPriceRaw ? parseFloat(String(manualPriceRaw)) : null;

  await updateGoldSettings(getDB(), { useAutoFetch, manualOverridePrice });
  
  revalidatePath("/admin/shop/gold-price");
  revalidatePath("/shop");
}

export async function triggerGoldPriceFetch() {
  await assertAdminRole();
  const context = getCfRequestContext();
  const apiKey = context.env.PUBLIC_DATA_API_KEY as string;
  if (!apiKey) throw new Error("PUBLIC_DATA_API_KEY 환경변수가 설정되지 않았습니다.");
  
  const price = await fetchAndSaveGoldPrice(getDB(), apiKey);
  if (price === null) throw new Error("금 시세를 가져오는 데 실패했습니다.");
  
  revalidatePath("/admin/shop/gold-price");
  revalidatePath("/shop");
  return price;
}
