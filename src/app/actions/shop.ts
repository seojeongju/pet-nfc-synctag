"use server";

import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB } from "@/lib/db";
import { headers } from "next/headers";

export async function updateOrderShippingInfo(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { success: false, error: "로그인이 필요합니다." };

  const orderId = String(formData.get("orderId") ?? "").trim();
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const recipientPhone = String(formData.get("recipientPhone") ?? "").trim();
  const shippingZip = String(formData.get("shippingZip") ?? "").trim();
  const shippingAddress = String(formData.get("shippingAddress") ?? "").trim();
  const shippingAddressDetail = String(formData.get("shippingAddressDetail") ?? "").trim();
  const shippingMemo = String(formData.get("shippingMemo") ?? "").trim();

  if (!orderId || !recipientName || !recipientPhone || !shippingAddress) {
    return { success: false, error: "필수 배송 정보를 모두 입력해 주세요." };
  }

  const db = getDB();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS shop_order_shipping_details (
        order_id TEXT PRIMARY KEY REFERENCES shop_orders(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        recipient_name TEXT,
        recipient_phone TEXT,
        shipping_zip TEXT,
        shipping_address TEXT,
        shipping_address_detail TEXT,
        shipping_memo TEXT,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run()
    .catch(() => null);
  const orderCols = new Set(
    (
      await db
        .prepare("PRAGMA table_info(shop_orders)")
        .all<{ name: string }>()
        .catch(() => ({ results: [] as { name: string }[] }))
    ).results.map((x) => x.name)
  );
  
  // 주문 소유권 확인
  const row = await db
    .prepare("SELECT id FROM shop_orders WHERE id = ? AND user_id = ?")
    .bind(orderId, session.user.id)
    .first();
  if (!row) return { success: false, error: "주문을 찾을 수 없습니다." };

  const updates: string[] = [];
  const binds: (string | null)[] = [];
  if (orderCols.has("recipient_name")) {
    updates.push("recipient_name = ?");
    binds.push(recipientName);
  }
  if (orderCols.has("recipient_phone")) {
    updates.push("recipient_phone = ?");
    binds.push(recipientPhone);
  }
  if (orderCols.has("shipping_zip")) {
    updates.push("shipping_zip = ?");
    binds.push(shippingZip || null);
  }
  if (orderCols.has("shipping_address")) {
    updates.push("shipping_address = ?");
    const composedAddress =
      !orderCols.has("shipping_address_detail") && shippingAddressDetail
        ? `${shippingAddress} ${shippingAddressDetail}`.trim()
        : shippingAddress;
    binds.push(composedAddress);
  }
  if (orderCols.has("shipping_address_detail")) {
    updates.push("shipping_address_detail = ?");
    binds.push(shippingAddressDetail || null);
  }
  if (orderCols.has("shipping_memo")) {
    updates.push("shipping_memo = ?");
    binds.push(shippingMemo || null);
  }
  if (orderCols.has("updated_at")) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
  }
  if (updates.length > 0) {
    await db
      .prepare(
        `UPDATE shop_orders 
         SET ${updates.join(", ")}
         WHERE id = ? AND user_id = ?`
      )
      .bind(...binds, orderId, session.user.id)
      .run();
  }

  // 구버전 shop_orders 스키마에서도 누락 없이 보여주기 위한 백업 저장소
  await db
    .prepare(
      `INSERT INTO shop_order_shipping_details
         (order_id, user_id, recipient_name, recipient_phone, shipping_zip, shipping_address, shipping_address_detail, shipping_memo, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(order_id) DO UPDATE SET
         user_id = excluded.user_id,
         recipient_name = excluded.recipient_name,
         recipient_phone = excluded.recipient_phone,
         shipping_zip = excluded.shipping_zip,
         shipping_address = excluded.shipping_address,
         shipping_address_detail = excluded.shipping_address_detail,
         shipping_memo = excluded.shipping_memo,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      orderId,
      session.user.id,
      recipientName,
      recipientPhone,
      shippingZip || null,
      shippingAddress,
      shippingAddressDetail || null,
      shippingMemo || null
    )
    .run()
    .catch(() => null);

  revalidatePath(`/shop/orders/${orderId}`);
  return { success: true };
}

export async function completeOrderPaymentPlaceholder(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { success: false, error: "로그인이 필요합니다." };

  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) return { success: false, error: "주문 정보가 올바르지 않습니다." };

  const db = getDB();
  const order = await db
    .prepare("SELECT id, status FROM shop_orders WHERE id = ? AND user_id = ?")
    .bind(orderId, session.user.id)
    .first<{ id: string; status: string }>();
  if (!order) return { success: false, error: "주문을 찾을 수 없습니다." };

  if (order.status === "paid") {
    revalidatePath(`/shop/orders/${orderId}`);
    return { success: true };
  }
  if (order.status !== "pending") {
    return { success: false, error: "결제를 진행할 수 없는 주문 상태입니다." };
  }

  const orderCols = new Set(
    (
      await db
        .prepare("PRAGMA table_info(shop_orders)")
        .all<{ name: string }>()
        .catch(() => ({ results: [] as { name: string }[] }))
    ).results.map((x) => x.name)
  );

  const updates: string[] = ["status = 'paid'"];
  const binds: unknown[] = [];
  if (orderCols.has("payment_provider")) {
    updates.push("payment_provider = ?");
    binds.push("manual-placeholder");
  }
  if (orderCols.has("updated_at")) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
  }
  if (orderCols.has("paid_at")) {
    updates.push("paid_at = CURRENT_TIMESTAMP");
  }

  await db
    .prepare(`UPDATE shop_orders SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`)
    .bind(...binds, orderId, session.user.id)
    .run();

  revalidatePath(`/shop/orders/${orderId}`);
  return { success: true };
}
