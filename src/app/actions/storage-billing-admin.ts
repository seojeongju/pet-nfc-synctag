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

export async function listStorageCheckoutIntents(limit = 100): Promise<StorageCheckoutIntentRow[]> {
  await assertAdminRole();
  const safeLimit = Math.min(300, Math.max(1, Math.trunc(limit)));
  const { results } = await getDB()
    .prepare(
      `SELECT i.id, i.user_id, u.email AS user_email, i.product_id,
              p.name AS product_name, p.extra_quota_mb, p.monthly_price_krw,
              i.status, i.note, i.created_at, i.updated_at
         FROM storage_addon_checkout_intents i
         INNER JOIN storage_addon_products p ON p.id = i.product_id
         LEFT JOIN user u ON u.id = i.user_id
        ORDER BY i.created_at DESC
        LIMIT ?`
    )
    .bind(safeLimit)
    .all<StorageCheckoutIntentRow>();
  return results ?? [];
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
