"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB } from "@/lib/db";
import { SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";


import { resolveAdminScope } from "@/lib/admin-authz";

async function assertAdminRole(): Promise<void> {
  await resolveAdminScope("admin");
}

async function getAdminDataScope(): Promise<{ actorId: string; tenantIds: string[] | null }> {
  const { actor, tenantIds } = await resolveAdminScope("admin");
  return { actorId: actor.userId, tenantIds };
}

/** datetime-local 등 빈 값이면 null */
function parseOptionalDatetimeToIso(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const dt = new Date(s);
  if (!Number.isFinite(dt.getTime())) return null;
  return dt.toISOString();
}

/** 조직 관리자(tenantIds ≠ null): 본인이 등록한 상품만 */
function isOrgAdminProductScope(tenantIds: string[] | null): boolean {
  return tenantIds !== null;
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
  /** NULL이면 레거시·시드 상품(플랫폼 관리자만 편집) */
  created_by_user_id: string | null;
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
  "created_by_user_id",
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
    created_by_user_id: existing.has("created_by_user_id") ? optStr("created_by_user_id") : null,
  };
}

export async function listAdminShopProducts(): Promise<AdminShopProductRow[]> {
  await assertAdminRole();
  const scope = await getAdminDataScope();
  const existing = await getShopProductsColumnSet();
  const cols = ADMIN_SHOP_PRODUCT_SELECT_KEYS.filter((c) => existing.has(c));
  if (!cols.includes("id")) {
    return [];
  }
  const orderSql = existing.has("sort_order")
    ? "ORDER BY sort_order ASC, name ASC"
    : "ORDER BY name ASC";
  if (isOrgAdminProductScope(scope.tenantIds)) {
    if (!existing.has("created_by_user_id")) {
      return [];
    }
    const sql = `SELECT ${cols.join(", ")} FROM shop_products WHERE created_by_user_id = ? ${orderSql}`;
    const res = await getDB()
      .prepare(sql)
      .bind(scope.actorId)
      .all<Record<string, unknown>>();
    return (res.results ?? []).map((row) => normalizeAdminShopProductRow(row, existing));
  }
  const sql = `SELECT ${cols.join(", ")} FROM shop_products ${orderSql}`;
  const res = await getDB().prepare(sql).all<Record<string, unknown>>();
  return (res.results ?? []).map((row) => normalizeAdminShopProductRow(row, existing));
}

export async function getAdminShopProduct(id: string): Promise<AdminShopProductRow | null> {
  await assertAdminRole();
  const scope = await getAdminDataScope();
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
  const normalized = normalizeAdminShopProductRow(row, existing);
  if (isOrgAdminProductScope(scope.tenantIds)) {
    if (!existing.has("created_by_user_id")) {
      return null;
    }
    if (normalized.created_by_user_id !== scope.actorId) {
      return null;
    }
  }
  return normalized;
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
  console.log("--- SAVE SHOP PRODUCT START ---");
  const scope = await getAdminDataScope();

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

  console.log("Data:", {
    id: idExisting,
    slug: slugRaw,
    name,
    modes,
    price: priceRaw,
    active
  });

  if (!slugRaw || !SLUG_RE.test(slugRaw)) {
    console.warn("Validation failed: invalid slug", slugRaw);
    redirect(`/admin/shop/products${idExisting ? `/${encodeURIComponent(idExisting)}` : "/new"}?e=${encodeURIComponent("슬러그는 영문 소문자·숫자·하이픈만 사용합니다.")}`);
  }
  if (!name) {
    console.warn("Validation failed: missing name");
    redirect(`/admin/shop/products${idExisting ? `/${encodeURIComponent(idExisting)}` : "/new"}?e=${encodeURIComponent("상품명을 입력하세요.")}`);
  }
  if (!Number.isFinite(priceRaw) || priceRaw < 0) {
    console.warn("Validation failed: invalid price", priceRaw);
    redirect(`/admin/shop/products${idExisting ? `/${encodeURIComponent(idExisting)}` : "/new"}?e=${encodeURIComponent("가격이 올바르지 않습니다.")}`);
  }
  if (!Number.isFinite(sortRaw)) {
    console.warn("Validation failed: invalid sort_order", sortRaw);
    redirect(`/admin/shop/products${idExisting ? `/${encodeURIComponent(idExisting)}` : "/new"}?e=${encodeURIComponent("정렬 순서가 올바르지 않습니다.")}`);
  }
  if (modes.length === 0) {
    console.warn("Validation failed: no modes selected");
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
    if (isOrgAdminProductScope(scope.tenantIds)) {
      if (!shopCols.has("created_by_user_id")) {
        redirect(
          `/admin/shop/products/${encodeURIComponent(idExisting)}?e=${encodeURIComponent("DB에 상품 등록자 컬럼이 없습니다. 마이그레이션 0030을 적용하세요.")}`
        );
      }
      const prior = await db
        .prepare(`SELECT created_by_user_id FROM shop_products WHERE id = ?`)
        .bind(idExisting)
        .first<{ created_by_user_id: string | null }>();
      if (!prior || prior.created_by_user_id !== scope.actorId) {
        redirect(
          `/admin/shop/products/${encodeURIComponent(idExisting)}?e=${encodeURIComponent("이 상품을 수정할 권한이 없습니다.")}`
        );
      }
    }
    const dup = await db
      .prepare(`SELECT id FROM shop_products WHERE slug = ? AND id != ?`)
      .bind(slugRaw, idExisting)
      .first<{ id: string }>();
    if (dup) {
      redirect(`/admin/shop/products/${encodeURIComponent(idExisting)}?e=${encodeURIComponent("이미 사용 중인 슬러그입니다.")}`);
    }
    const setSql = colsForSave.map((c) => `${c} = ?`).join(", ");
    const tsSql = shopCols.has("updated_at") ? ", updated_at = CURRENT_TIMESTAMP" : "";
    await db
      .prepare(`UPDATE shop_products SET ${setSql}${tsSql} WHERE id = ?`)
      .bind(...writeBinds, idExisting)
      .run();
    revalidatePath("/admin/shop");
    revalidatePath("/admin/shop/products");
    if (idExisting) {
      revalidatePath(`/admin/shop/products/${idExisting}`);
    }
    revalidatePath("/shop");
    revalidatePath("/shop/[slug]", "page");
    redirect(`/admin/shop/products?ok=1`);
  }

  const dupNew = await db.prepare(`SELECT id FROM shop_products WHERE slug = ?`).bind(slugRaw).first<{ id: string }>();
  if (dupNew) {
    redirect(`/admin/shop/products/new?e=${encodeURIComponent("이미 사용 중인 슬러그입니다.")}`);
  }

  if (isOrgAdminProductScope(scope.tenantIds) && !shopCols.has("created_by_user_id")) {
    redirect(
      `/admin/shop/products/new?e=${encodeURIComponent("DB에 상품 등록자 컬럼이 없습니다. 마이그레이션 0030을 적용하세요.")}`
    );
  }

  const newId = nanoid();
  const insertCols = ["id", ...writeCols];
  const insertBinds: unknown[] = [newId, ...writeBinds];
  if (shopCols.has("created_by_user_id")) {
    insertCols.push("created_by_user_id");
    insertBinds.push(scope.actorId);
  }
  const placeholders = insertCols.map(() => "?").join(", ");
  const insertSql = shopCols.has("updated_at")
    ? `INSERT INTO shop_products (${insertCols.join(", ")}, updated_at) VALUES (${placeholders}, CURRENT_TIMESTAMP)`
    : `INSERT INTO shop_products (${insertCols.join(", ")}) VALUES (${placeholders})`;
  await db.prepare(insertSql).bind(...insertBinds).run();
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/products");
  revalidatePath("/shop");
  redirect(`/admin/shop/products?ok=1`);
}

export async function deleteShopProduct(formData: FormData): Promise<void> {
  const scope = await getAdminDataScope();
  const productId = String(formData.get("product_id") ?? "").trim();
  if (!productId) {
    redirect("/admin/shop/products?e=" + encodeURIComponent("상품 ID가 없습니다."));
  }
  const db = getDB();
  const shopCols = await getShopProductsColumnSet();
  if (!shopCols.has("created_by_user_id")) {
    redirect(
      "/admin/shop/products?e=" + encodeURIComponent("삭제하려면 마이그레이션 0030을 적용하세요.")
    );
  }
  const row = await db
    .prepare(`SELECT id, created_by_user_id FROM shop_products WHERE id = ?`)
    .bind(productId)
    .first<{ id: string; created_by_user_id: string | null }>();
  if (!row) {
    redirect("/admin/shop/products?e=" + encodeURIComponent("상품을 찾을 수 없습니다."));
  }
  if (isOrgAdminProductScope(scope.tenantIds)) {
    if (row.created_by_user_id !== scope.actorId) {
      redirect("/admin/shop/products?e=" + encodeURIComponent("이 상품을 삭제할 권한이 없습니다."));
    }
  }
  const orderCount = await db
    .prepare(`SELECT COUNT(*) AS c FROM shop_orders WHERE product_id = ?`)
    .bind(productId)
    .first<{ c: number }>();
  if (Number(orderCount?.c ?? 0) > 0) {
    redirect(
      `/admin/shop/products/${encodeURIComponent(productId)}?e=` +
        encodeURIComponent("주문 이력이 있는 상품은 삭제할 수 없습니다.")
    );
  }
  await db.prepare(`DELETE FROM shop_products WHERE id = ?`).bind(productId).run();
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/products");
  revalidatePath("/shop");
  redirect("/admin/shop/products?ok=1");
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
  created_at: string;
};

export async function listAdminShopOrders(options: {
  limit?: number;
  status?: "all" | "pending" | "paid" | "failed" | "cancelled";
  query?: string;
}): Promise<AdminShopOrderRow[]> {
  const scope = await getAdminDataScope();
  const db = getDB();
  if (isOrgAdminProductScope(scope.tenantIds)) {
    const pc = await getShopProductsColumnSet();
    if (!pc.has("created_by_user_id")) {
      return [];
    }
  }
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
  if (isOrgAdminProductScope(scope.tenantIds)) {
    where.push(`p.created_by_user_id = ?`);
    binds.push(scope.actorId);
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
          o.created_at, o.updated_at
       FROM shop_orders o
       INNER JOIN shop_products p ON p.id = o.product_id
       LEFT JOIN user u ON u.id = o.user_id
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
  if (isOrgAdminProductScope(scope.tenantIds)) {
    const productCols = await getShopProductsColumnSet();
    if (!productCols.has("created_by_user_id")) {
      redirect("/admin/shop/orders?e=" + encodeURIComponent("주문 권한 검증을 위해 마이그레이션 0030이 필요합니다."));
    }
    const scoped = await db
      .prepare(
        `SELECT o.id
         FROM shop_orders o
         INNER JOIN shop_products p ON p.id = o.product_id
         WHERE o.id = ?
           AND p.created_by_user_id = ?
         LIMIT 1`
      )
      .bind(orderId, scope.actorId)
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

