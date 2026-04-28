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
  const shippingMemo = String(formData.get("shippingMemo") ?? "").trim();

  if (!orderId || !recipientName || !recipientPhone || !shippingAddress) {
    return { success: false, error: "필수 배송 정보를 모두 입력해 주세요." };
  }

  const db = getDB();
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
    binds.push(shippingAddress);
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

  revalidatePath(`/shop/orders/${orderId}`);
  return { success: true };
}
