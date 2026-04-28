import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Package } from "lucide-react";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { getUserConsentStatus } from "@/lib/privacy-consent";
import { getShopOrderByIdForUser, formatKrw, subjectKindLabel } from "@/lib/shop";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import { FlowTopNav } from "@/components/layout/FlowTopNav";
import { cn } from "@/lib/utils";

export const runtime = "edge";

const statusLabel: Record<string, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "실패",
  cancelled: "취소됨",
};

export default async function ShopOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId: rawId } = await params;
  const orderId = decodeURIComponent(rawId || "").trim();
  if (!orderId) notFound();

  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/shop/orders/${encodeURIComponent(orderId)}`)}`);
  }
  const consent = await getUserConsentStatus(session.user.id);
  if (!consent.hasRequired) {
    redirect(
      `/consent?next=${encodeURIComponent(`/shop/orders/${encodeURIComponent(orderId)}`)}`
    );
  }

  const db = context.env.DB;
  const roleRow = await db
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  const isPlatformAdmin = isPlatformAdminRole(roleRow?.role);

  const order = await getShopOrderByIdForUser(db, orderId, session.user.id);
  if (!order) {
    notFound();
  }

  const orgManageHref = await getOrgManageHrefForUser(session.user.id).catch(() => null);
  const st = order.status;
  const statusKo = statusLabel[st] ?? st;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      <FlowTopNav
        variant="landing"
        session={{ user: { name: session.user.name } }}
        isAdmin={isPlatformAdmin}
        orgManageHref={orgManageHref}
        dashboardHref={`/dashboard/${encodeURIComponent(order.subjectKind)}`}
      />
      <div className="px-4 min-[430px]:px-5 py-6 min-[430px]:py-8 pb-20">
        <div className="w-full max-w-none lg:max-w-screen-sm mx-auto space-y-5">
          <div className="text-center">
            <div
              className={cn(
                "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ring-1",
                st === "pending"
                  ? "bg-amber-50 text-amber-600 ring-amber-100"
                  : st === "paid"
                    ? "bg-teal-50 text-teal-600 ring-teal-100"
                    : "bg-slate-100 text-slate-500 ring-slate-200"
              )}
            >
              {st === "paid" ? <CheckCircle2 className="h-9 w-9" /> : <Package className="h-8 w-8" />}
            </div>
            <h1 className="text-[22px] font-black text-slate-900">주문이 접수되었어요</h1>
            <p className="mt-2 text-[13px] font-semibold text-slate-500">
              <span
                className={cn(
                  "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-black",
                  st === "pending" && "bg-amber-100 text-amber-800",
                  st === "paid" && "bg-teal-100 text-teal-800"
                )}
              >
                {statusKo}
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 text-[13px]">
            <div className="flex justify-between gap-2">
              <span className="font-bold text-slate-500">상품</span>
              <span className="font-black text-slate-900 text-right min-w-0 break-words">
                {order.product.name}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="font-bold text-slate-500">모드</span>
              <span className="font-black text-slate-800">{subjectKindLabel(order.subjectKind)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="font-bold text-slate-500">금액</span>
              <span className="font-black text-teal-700 tabular-nums">{formatKrw(order.amountKrw)}</span>
            </div>
            <div className="flex justify-between gap-2 text-[12px]">
              <span className="font-bold text-slate-500">주문 번호</span>
              <span className="font-mono text-slate-600 break-all text-right text-[11px]">{order.id}</span>
            </div>
          </div>

          {st === "pending" ? (
            <p className="text-[12px] font-medium text-slate-600 leading-relaxed rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2.5">
              <strong className="font-black text-teal-800">다음 단계:</strong> PG·간편결제·가상계좌·결제선생
              API 등을 연동하면 이 주문에 대해 결제를 완료·실패로 바꿀 수 있습니다. 운영자는 관리 콘솔에서
              수동 처리도 가능해요.
            </p>
          ) : null}

          <div className="flex flex-col gap-2.5">
            <Link
              href={`/shop?kind=${encodeURIComponent(order.subjectKind)}`}
              className="block w-full rounded-2xl bg-slate-900 py-3.5 text-center text-[14px] font-black text-white hover:bg-slate-800"
            >
              스토어로 돌아가기
            </Link>
            <Link
              href="/hub"
              className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 text-center text-[14px] font-black text-slate-700 hover:bg-slate-50"
            >
              허브로 이동
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
