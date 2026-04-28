import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { getEffectiveAllowedSubjectKinds } from "@/lib/mode-visibility";
import {
  createPendingShopOrder,
  ShopForbiddenError,
  ShopNotFoundError,
} from "@/lib/shop";
import { SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";

export const runtime = "edge";

export async function POST(request: Request) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { productId?: string; kind?: string; idempotencyKey?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  if (!productId) {
    return NextResponse.json({ error: "productId가 필요합니다." }, { status: 400 });
  }

  const kindRaw = typeof body.kind === "string" ? body.kind.trim() : "";
  if (!kindRaw || !(SUBJECT_KINDS as readonly string[]).includes(kindRaw)) {
    return NextResponse.json({ error: "유효한 kind가 필요합니다." }, { status: 400 });
  }
  const kind = kindRaw as SubjectKind;

  const roleRow = await getDB()
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  const isPlatformAdmin = isPlatformAdminRole(roleRow?.role);
  const allowed = await getEffectiveAllowedSubjectKinds(getDB(), session.user.id, { isPlatformAdmin });
  if (!allowed.includes(kind)) {
    return NextResponse.json({ error: "이 모드로 주문할 수 없습니다." }, { status: 403 });
  }

  const idem =
    request.headers.get("Idempotency-Key") ||
    (typeof body.idempotencyKey === "string" ? body.idempotencyKey : null);

  try {
    const result = await createPendingShopOrder({
      db: getDB(),
      userId: session.user.id,
      kind,
      productId,
      idempotencyKey: idem,
    });
    return NextResponse.json({
      orderId: result.orderId,
      amountKrw: result.amountKrw,
      productName: result.productName,
      message:
        "주문이 접수되었습니다. 곧 PG·간편결제 연동으로 결제를 완료할 수 있게 될 예정입니다.",
    });
  } catch (e: unknown) {
    if (e instanceof ShopNotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof ShopForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Order failed", detail: msg }, { status: 500 });
  }
}
