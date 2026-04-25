"use server";

import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB } from "@/lib/db";
import { isPlatformAdminRole } from "@/lib/platform-admin";

export type StorageCheckoutIntentStatus =
  | "requested"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type ListStorageCheckoutIntentOptions = {
  limit?: number;
  status?: StorageCheckoutIntentStatus | "all";
  query?: string;
  sla?: "none" | "requested_over_24h" | "processing_over_24h";
};

const ALLOWED_STATUS_TRANSITIONS: Record<StorageCheckoutIntentStatus, StorageCheckoutIntentStatus[]> = {
  requested: ["processing", "completed", "failed", "cancelled"],
  processing: ["completed", "failed", "cancelled"],
  completed: [],
  failed: ["processing", "cancelled"],
  cancelled: [],
};

export type StorageCheckoutIntentRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  product_id: string;
  product_name: string;
  extra_quota_mb: number;
  monthly_price_krw: number;
  status: StorageCheckoutIntentStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type StorageCheckoutIntentStatusCount = {
  status: StorageCheckoutIntentStatus;
  count: number;
};

export type StorageCheckoutIntentSlaCounts = {
  requestedOver24h: number;
  processingOver24h: number;
};

async function assertAdminRole() {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  const row = await getDB()
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  if (!isPlatformAdminRole(row?.role)) throw new Error("플랫폼 관리자만 사용할 수 있습니다.");
  return session.user.id;
}

export async function listStorageCheckoutIntents(
  options: ListStorageCheckoutIntentOptions = {}
): Promise<StorageCheckoutIntentRow[]> {
  await assertAdminRole();
  const safeLimit = Math.min(300, Math.max(1, Math.trunc(options.limit ?? 100)));
  const where: string[] = [];
  const binds: Array<string | number> = [];
  const status = options.status;
  const query = (options.query ?? "").trim();
  const sla = options.sla ?? "none";

  if (
    status &&
    status !== "all" &&
    (["requested", "processing", "completed", "failed", "cancelled"] as const).includes(status)
  ) {
    where.push("i.status = ?");
    binds.push(status);
  }
  if (query) {
    where.push("(i.id LIKE ? OR i.user_id LIKE ? OR COALESCE(u.email, '') LIKE ?)");
    const q = `%${query}%`;
    binds.push(q, q, q);
  }
  if (sla === "requested_over_24h") {
    where.push("i.status = 'requested' AND i.created_at <= DATETIME('now', '-24 hours')");
  } else if (sla === "processing_over_24h") {
    where.push("i.status = 'processing' AND i.updated_at <= DATETIME('now', '-24 hours')");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sql = `SELECT i.id, i.user_id, u.email AS user_email, i.product_id,
                      p.name AS product_name, p.extra_quota_mb, p.monthly_price_krw,
                      i.status, i.note, i.created_at, i.updated_at
                 FROM storage_addon_checkout_intents i
                 INNER JOIN storage_addon_products p ON p.id = i.product_id
                 LEFT JOIN user u ON u.id = i.user_id
                 ${whereSql}
                ORDER BY i.created_at DESC
                LIMIT ?`;
  binds.push(safeLimit);

  const { results } = await getDB()
    .prepare(sql)
    .bind(...binds)
    .all<StorageCheckoutIntentRow>();
  return results ?? [];
}

export async function getStorageCheckoutIntentStatusCounts(
  query?: string
): Promise<StorageCheckoutIntentStatusCount[]> {
  await assertAdminRole();
  const q = (query ?? "").trim();
  const where = q ? "WHERE (i.id LIKE ? OR i.user_id LIKE ? OR COALESCE(u.email, '') LIKE ?)" : "";
  const binds = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];

  const { results } = await getDB()
    .prepare(
      `SELECT i.status AS status, COUNT(*) AS count
       FROM storage_addon_checkout_intents i
       LEFT JOIN user u ON u.id = i.user_id
       ${where}
       GROUP BY i.status`
    )
    .bind(...binds)
    .all<{ status: StorageCheckoutIntentStatus; count: number | string }>();

  const map = new Map<StorageCheckoutIntentStatus, number>([
    ["requested", 0],
    ["processing", 0],
    ["completed", 0],
    ["failed", 0],
    ["cancelled", 0],
  ]);
  for (const row of results ?? []) {
    map.set(row.status, Number(row.count ?? 0));
  }

  return (["requested", "processing", "completed", "failed", "cancelled"] as const).map((status) => ({
    status,
    count: map.get(status) ?? 0,
  }));
}

export async function getStorageCheckoutIntentSlaCounts(
  query?: string
): Promise<StorageCheckoutIntentSlaCounts> {
  await assertAdminRole();
  const q = (query ?? "").trim();
  const where = q ? "AND (i.id LIKE ? OR i.user_id LIKE ? OR COALESCE(u.email, '') LIKE ?)" : "";
  const binds = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];

  const row = await getDB()
    .prepare(
      `SELECT
         SUM(CASE WHEN i.status = 'requested'
                   AND i.created_at <= DATETIME('now', '-24 hours') THEN 1 ELSE 0 END) AS requested_over_24h,
         SUM(CASE WHEN i.status = 'processing'
                   AND i.updated_at <= DATETIME('now', '-24 hours') THEN 1 ELSE 0 END) AS processing_over_24h
       FROM storage_addon_checkout_intents i
       LEFT JOIN user u ON u.id = i.user_id
       WHERE 1 = 1
       ${where}`
    )
    .bind(...binds)
    .first<{ requested_over_24h?: number | string | null; processing_over_24h?: number | string | null }>();

  return {
    requestedOver24h: Number(row?.requested_over_24h ?? 0),
    processingOver24h: Number(row?.processing_over_24h ?? 0),
  };
}

export async function updateStorageCheckoutIntentStatus(input: {
  intentId: string;
  status: StorageCheckoutIntentStatus;
  note?: string | null;
}): Promise<{ ok: true }> {
  await assertAdminRole();
  const db = getDB();
  const intentId = input.intentId.trim();
  const status = input.status;
  const note = (input.note ?? "").trim() || null;
  if (!intentId) throw new Error("요청 ID가 비어 있습니다.");

  const intent = await db
    .prepare(
      `SELECT id, user_id, product_id, status
       FROM storage_addon_checkout_intents
       WHERE id = ?
       LIMIT 1`
    )
    .bind(intentId)
    .first<{ id: string; user_id: string; product_id: string; status: StorageCheckoutIntentStatus }>();
  if (!intent) throw new Error("요청 정보를 찾을 수 없습니다.");
  if (intent.status === status) {
    revalidatePath("/admin/storage-billing");
    return { ok: true };
  }
  const allowedNext = ALLOWED_STATUS_TRANSITIONS[intent.status] ?? [];
  if (!allowedNext.includes(status)) {
    throw new Error(`상태 전환 불가: ${intent.status} -> ${status}`);
  }

  await db
    .prepare(
      `UPDATE storage_addon_checkout_intents
       SET status = ?, note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(status, note, intent.id)
    .run();

  if (status === "completed" && intent.status !== "completed") {
    const alreadyProvisioned = await db
      .prepare(
        `SELECT id
         FROM user_storage_addon_subscriptions
         WHERE external_provider = 'manual_admin' AND external_id = ?
         LIMIT 1`
      )
      .bind(intent.id)
      .first<{ id: string }>();
    if (!alreadyProvisioned) {
      await db
        .prepare(
          `INSERT INTO user_storage_addon_subscriptions
             (id, user_id, product_id, status, current_period_end, external_provider, external_id)
           VALUES (?, ?, ?, 'active', DATETIME('now', '+30 days'), 'manual_admin', ?)`
        )
        .bind(nanoid(), intent.user_id, intent.product_id, intent.id)
        .run();
    }
  }

  revalidatePath("/admin/storage-billing");
  revalidatePath("/hub");
  return { ok: true };
}
