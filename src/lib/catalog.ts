import type { D1Database } from "@cloudflare/workers-types";
import { nanoid } from "nanoid";
import type { ShopCatalog, CatalogConfig } from "@/types/shop";

export async function createCatalog(
  db: D1Database,
  input: {
    tenantId?: string | null;
    userId?: string | null;
    mode: string;
    title: string;
    description?: string | null;
    productIds: string[];
    config?: CatalogConfig;
  }
): Promise<string> {
  const id = nanoid();
  await db
    .prepare(
      `INSERT INTO shop_catalogs (id, tenant_id, user_id, mode, title, description, products_json, config_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.tenantId ?? null,
      input.userId ?? null,
      input.mode,
      input.title,
      input.description ?? null,
      JSON.stringify(input.productIds),
      JSON.stringify(input.config ?? {})
    )
    .run();
  return id;
}

export async function updateCatalog(
  db: D1Database,
  id: string,
  input: Partial<{
    mode: string;
    title: string;
    description: string | null;
    productIds: string[];
    config: CatalogConfig;
    isActive: boolean;
  }>
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];

  if (input.mode !== undefined) {
    updates.push("mode = ?");
    params.push(input.mode);
  }
  if (input.title !== undefined) {
    updates.push("title = ?");
    params.push(input.title);
  }
  if (input.description !== undefined) {
    updates.push("description = ?");
    params.push(input.description);
  }
  if (input.productIds !== undefined) {
    updates.push("products_json = ?");
    params.push(JSON.stringify(input.productIds));
  }
  if (input.config !== undefined) {
    updates.push("config_json = ?");
    params.push(JSON.stringify(input.config));
  }
  if (input.isActive !== undefined) {
    updates.push("is_active = ?");
    params.push(input.isActive ? 1 : 0);
  }

  if (updates.length === 0) return;

  params.push(id);
  await db
    .prepare(
      `UPDATE shop_catalogs SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    )
    .bind(...params)
    .run();
}

export async function getCatalog(db: D1Database, id: string): Promise<ShopCatalog | null> {
  const row = await db
    .prepare("SELECT * FROM shop_catalogs WHERE id = ?")
    .bind(id)
    .first<any>();

  if (!row) return null;
  return rowToCatalog(row);
}

export async function listCatalogs(
  db: D1Database,
  filter: { tenantId?: string; userId?: string; mode?: string }
): Promise<ShopCatalog[]> {
  let sql = "SELECT * FROM shop_catalogs WHERE 1=1";
  const params: any[] = [];

  if (filter.tenantId) {
    sql += " AND tenant_id = ?";
    params.push(filter.tenantId);
  }
  if (filter.userId) {
    sql += " AND user_id = ?";
    params.push(filter.userId);
  }
  if (filter.mode) {
    sql += " AND mode = ?";
    params.push(filter.mode);
  }

  sql += " ORDER BY created_at DESC";

  const res = await db.prepare(sql).bind(...params).all<any>();
  return (res.results ?? []).map(rowToCatalog);
}

export async function deleteCatalog(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM shop_catalogs WHERE id = ?").bind(id).run();
}

function rowToCatalog(row: any): ShopCatalog {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    mode: row.mode,
    title: row.title,
    description: row.description,
    productIds: JSON.parse(row.products_json || "[]"),
    config: JSON.parse(row.config_json || "{}"),
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
