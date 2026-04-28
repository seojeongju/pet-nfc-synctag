"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB } from "@/lib/db";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";

async function assertAdminRole(): Promise<void> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  const row = await getDB()
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  if (!isPlatformAdminRole(row?.role)) throw new Error("플랫폼 관리자만 사용할 수 있습니다.");
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
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function listAdminShopProducts(): Promise<AdminShopProductRow[]> {
  await assertAdminRole();
  const res = await getDB()
    .prepare(
      `SELECT id, slug, name, description, price_krw, active, target_modes, image_url, sort_order, created_at, updated_at
       FROM shop_products
       ORDER BY sort_order ASC, name ASC`
    )
    .all<AdminShopProductRow>();
  return res.results ?? [];
}

export async function getAdminShopProduct(id: string): Promise<AdminShopProductRow | null> {
  await assertAdminRole();
  const row = await getDB()
    .prepare(
      `SELECT id, slug, name, description, price_krw, active, target_modes, image_url, sort_order, created_at, updated_at
       FROM shop_products WHERE id = ?`
    )
    .bind(id)
    .first<AdminShopProductRow>();
  return row ?? null;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  const sortRaw = Number(formData.get("sort_order"));
  const active = formData.get("active") === "on" ? 1 : 0;
  const imageUrlRaw = String(formData.get("image_url") ?? "").trim();

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
  const sort_order = Math.floor(sortRaw);
  const image_url = imageUrlRaw.length > 0 ? imageUrlRaw.slice(0, 2048) : null;

  const db = getDB();

  if (idExisting) {
    const dup = await db
      .prepare(`SELECT id FROM shop_products WHERE slug = ? AND id != ?`)
      .bind(slugRaw, idExisting)
      .first<{ id: string }>();
    if (dup) {
      redirect(`/admin/shop/products/${encodeURIComponent(idExisting)}?e=${encodeURIComponent("이미 사용 중인 슬러그입니다.")}`);
    }
    await db
      .prepare(
        `UPDATE shop_products SET slug = ?, name = ?, description = ?, price_krw = ?, active = ?, target_modes = ?, image_url = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      )
      .bind(slugRaw, name, description, price_krw, active, target_modes, image_url, sort_order, idExisting)
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
  await db
    .prepare(
      `INSERT INTO shop_products (id, slug, name, description, price_krw, active, target_modes, image_url, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .bind(newId, slugRaw, name, description, price_krw, active, target_modes, image_url, sort_order)
    .run();
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/products");
  revalidatePath("/shop");
  redirect(`/admin/shop/products?ok=1`);
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
  payment_provider: string | null;
  external_payment_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function listAdminShopOrders(options: {
  limit?: number;
  status?: "all" | "pending" | "paid" | "failed" | "cancelled";
  query?: string;
}): Promise<AdminShopOrderRow[]> {
  await assertAdminRole();
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
  const sql = `SELECT o.id, o.user_id, u.email AS user_email, o.subject_kind, o.product_id,
         p.name AS product_name, p.slug AS product_slug, o.amount_krw, o.status,
         o.payment_provider, o.external_payment_id, o.created_at, o.updated_at
       FROM shop_orders o
       INNER JOIN shop_products p ON p.id = o.product_id
       LEFT JOIN user u ON u.id = o.user_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY o.created_at DESC
       LIMIT ?`;
  binds.push(limit);

  const res = await getDB()
    .prepare(sql)
    .bind(...binds)
    .all<AdminShopOrderRow>();
  return res.results ?? [];
}

export async function updateShopOrderStatus(formData: FormData): Promise<void> {
  await assertAdminRole();
  const orderId = String(formData.get("order_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const allowed = ["pending", "paid", "failed", "cancelled"] as const;
  if (!orderId || !(allowed as readonly string[]).includes(status)) {
    redirect("/admin/shop/orders?e=" + encodeURIComponent("잘못된 요청입니다."));
  }
  await getDB()
    .prepare(`UPDATE shop_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(status, orderId)
    .run();
  revalidatePath("/admin/shop");
  revalidatePath("/admin/shop/orders");
  revalidatePath("/shop");
  redirect("/admin/shop/orders?ok=1");
}
