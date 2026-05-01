import Link from "next/link";
import { ArrowRight, HandCoins, ShoppingBag } from "lucide-react";
import { listAdminShopOrders, updateShopOrderStatus } from "@/app/actions/admin-shop";
import { subjectKindLabelKo } from "@/lib/shop";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["all", "pending", "paid", "failed", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function orderStatusLabel(s: string): string {
  switch (s) {
    case "pending":
      return "결제 대기";
    case "paid":
      return "결제 완료";
    case "failed":
      return "실패";
    case "cancelled":
      return "취소";
    default:
      return s;
  }
}

function statusBadgeClass(s: string): string {
  if (s === "paid") return adminUi.successBadge;
  if (s === "pending") return adminUi.warningBadge;
  if (s === "failed") return adminUi.dangerBadge;
  return adminUi.neutralBadge;
}

export default async function AdminShopOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; ok?: string; e?: string }>;
}) {
  const sp = await searchParams;
  const status: StatusFilter =
    typeof sp.status === "string" && STATUS_FILTERS.includes(sp.status as StatusFilter)
      ? (sp.status as StatusFilter)
      : "all";
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const ok = sp.ok === "1";
  const err = typeof sp.e === "string" ? decodeURIComponent(sp.e) : null;

  const orders = await listAdminShopOrders({
    limit: 150,
    status: status === "all" ? "all" : status,
    query: query || undefined,
  });

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe)}>
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">Store · Orders</p>
          <h1 className="text-2xl font-black text-slate-900">스토어 주문</h1>
          <p className="text-sm font-semibold text-slate-500">
            결제 연동 전에는 대부분 <strong className="text-slate-700">결제 대기</strong>입니다. 운영에 맞게 상태를
            갱신하세요.
          </p>
        </header>

        {ok ? (
          <p className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2 text-[12px] font-bold text-teal-800">
            반영되었습니다.
          </p>
        ) : null}
        {err ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-[12px] font-bold text-rose-800" role="alert">
            {err}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <a
              key={s}
              href={`/admin/shop/orders?status=${s}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-black",
                status === s ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 bg-white text-slate-600"
              )}
            >
              {s === "all" ? "전체" : orderStatusLabel(s)}
            </a>
          ))}
        </div>

        <form method="get" className="flex flex-wrap gap-2">
          <input type="hidden" name="status" value={status} />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="주문 ID · 이메일 · 상품명 · 슬러그"
            className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-semibold outline-none focus:border-teal-400 sm:max-w-md"
          />
          <button
            type="submit"
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-700 hover:bg-slate-50"
          >
            검색
          </button>
        </form>

        <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-md">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className={adminUi.tableHeadRow}>
                <th className={adminUi.tableHeadCell}>주문</th>
                <th className={adminUi.tableHeadCell}>사용자</th>
                <th className={adminUi.tableHeadCell}>모드</th>
                <th className={adminUi.tableHeadCell}>상품</th>
                <th className={adminUi.tableHeadCell}>금액</th>
                <th className={adminUi.tableHeadCell}>상태</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                    주문이 없습니다.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className={adminUi.tableRowHover}>
                    <td className={adminUi.tableBodyCellMono}>
                      <span className="line-clamp-2 break-all">{o.id}</span>
                      <span className="mt-1 block text-[9px] font-semibold text-slate-400">{o.created_at}</span>
                    </td>
                    <td className={adminUi.tableBodyCell}>
                      <span className="break-all">{o.user_email || o.user_id}</span>
                    </td>
                    <td className={adminUi.tableBodyCell}>{subjectKindLabelKo(o.subject_kind)}</td>
                    <td className={adminUi.tableBodyCellStrong}>
                      <span className="line-clamp-2">{o.product_name}</span>
                      <span className="block text-[9px] font-mono text-slate-400">{o.product_slug}</span>
                    </td>
                    <td className={adminUi.tableBodyCell}>
                      {new Intl.NumberFormat("ko-KR").format(o.amount_krw)}원
                    </td>
                    <td className={cn(adminUi.tableBodyCell, "align-top")}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span
                          className={cn(
                            "inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-black",
                            statusBadgeClass(o.status)
                          )}
                        >
                          {orderStatusLabel(o.status)}
                        </span>
                        <form action={updateShopOrderStatus} className="flex flex-wrap items-center gap-1.5">
                          <input type="hidden" name="order_id" value={o.id} />
                          <select
                            name="status"
                            defaultValue={o.status}
                            className="h-9 min-w-[7rem] rounded-lg border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-bold text-slate-800"
                          >
                            <option value="pending">결제 대기</option>
                            <option value="paid">결제 완료</option>
                            <option value="failed">실패</option>
                            <option value="cancelled">취소</option>
                          </select>
                          <button
                            type="submit"
                            className="h-9 rounded-lg border border-teal-200 bg-teal-50 px-2.5 text-[10px] font-black text-teal-800 hover:bg-teal-100"
                          >
                            저장
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <nav
          className="mx-auto flex max-w-xl flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4"
          aria-label="스토어 관련 바로가기"
        >
          <Link
            href="/admin/shop/resale"
            className={cn(
              "group relative flex min-h-[52px] flex-1 items-center justify-center gap-3 overflow-hidden rounded-[22px] border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-orange-50/90 px-5 py-3.5 shadow-sm ring-1 ring-amber-100/80 transition",
              "hover:border-amber-300 hover:shadow-md hover:ring-amber-200/60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner ring-1 ring-amber-200/60">
              <HandCoins className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[10px] font-black uppercase tracking-wider text-amber-700/80">Gold · Resale</span>
              <span className="block text-[13px] font-black leading-tight text-amber-950">소비자 되팔기 관리</span>
            </span>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-amber-600/90 transition group-hover:translate-x-0.5 group-hover:text-amber-800"
              aria-hidden
            />
          </Link>

          <Link
            href="/admin/shop"
            className={cn(
              "group relative flex min-h-[52px] flex-1 items-center justify-center gap-3 overflow-hidden rounded-[22px] border border-slate-200 bg-white px-5 py-3.5 shadow-sm ring-1 ring-slate-100 transition",
              "hover:border-teal-200 hover:bg-gradient-to-br hover:from-teal-50/80 hover:to-white hover:shadow-md hover:ring-teal-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2"
            )}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 shadow-inner ring-1 ring-teal-100">
              <ShoppingBag className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-teal-600/90">
                Store
              </span>
              <span className="block text-[13px] font-black leading-tight text-slate-800 group-hover:text-teal-900">
                스토어 관리 홈
              </span>
            </span>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600"
              aria-hidden
            />
          </Link>
        </nav>
      </div>
  );
}
