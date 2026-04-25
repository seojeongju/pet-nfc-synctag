"use server";

import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB } from "@/lib/db";

async function requireUserId(): Promise<string> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error("로그인이 필요합니다.");
  return userId;
}

export async function requestStorageAddonCheckout(productId: string): Promise<{ intentId: string }> {
  const userId = await requireUserId();
  const db = getDB();

  const product = await db
    .prepare(
      `SELECT id
       FROM storage_addon_products
       WHERE id = ? AND is_active = 1
       LIMIT 1`
    )
    .bind(productId)
    .first<{ id: string }>();
  if (!product) {
    throw new Error("선택한 추가 용량 상품을 찾을 수 없습니다.");
  }

  const intentId = nanoid();
  await db
    .prepare(
      `INSERT INTO storage_addon_checkout_intents (id, user_id, product_id, status, note)
       VALUES (?, ?, ?, 'requested', ?)`
    )
    .bind(intentId, userId, product.id, "PG 연동 전 구매 요청 접수")
    .run();

  return { intentId };
}
