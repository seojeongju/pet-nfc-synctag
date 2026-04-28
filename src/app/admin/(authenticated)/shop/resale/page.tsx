import {
  applyGoldResalePolicyToBuyers,
  listAdminGoldResaleBuyers,
} from "@/app/actions/admin-shop";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AdminShopResalePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; e?: string; m?: string }>;
}) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const ok = sp.ok === "1";
  const err = typeof sp.e === "string" ? decodeURIComponent(sp.e) : null;
  const msg = typeof sp.m === "string" ? decodeURIComponent(sp.m) : null;
  const buyers = await listAdminGoldResaleBuyers({ query: query || undefined, limit: 300 });

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe)}>
      <header className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Store · Gold Resale</p>
        <h1 className="text-2xl font-black text-slate-900">소비자 되팔기 관리</h1>
        <p className="text-sm font-semibold text-slate-500">
          링크유-골드 <strong className="text-slate-700">결제 완료 구매자</strong>만 모아서, 선택 구매자 대상 되팔기 정책을
          일괄 적용합니다.
        </p>
      </header>

      {ok ? (
        <p className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2 text-[12px] font-bold text-teal-800">
          {msg || "반영되었습니다."}
        </p>
      ) : null}
      {err ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-[12px] font-bold text-rose-800" role="alert">
          {err}
        </p>
      ) : null}

      <form method="get" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="구매자 이메일 · 이름 · user_id"
          className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-semibold outline-none focus:border-teal-400 sm:max-w-md"
        />
        <button
          type="submit"
          className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-700 hover:bg-slate-50"
        >
          검색
        </button>
      </form>

      <form action={applyGoldResalePolicyToBuyers} className="space-y-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 space-y-2">
          <p className="text-[11px] font-black text-amber-900">선택 구매자 일괄 설정</p>
          <label className="inline-flex items-center gap-2 text-[11px] font-bold text-amber-900">
            <input type="checkbox" name="resale_enabled" defaultChecked />
            소비자 되팔기 판매가 노출 사용
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="number"
              name="resale_offer_price_krw"
              defaultValue={15900}
              className="h-9 rounded-lg border border-amber-200 bg-white px-2 text-[11px] font-bold"
              placeholder="판매가(원)"
            />
            <input
              type="datetime-local"
              name="resale_visible_from"
              className="h-9 rounded-lg border border-amber-200 bg-white px-2 text-[11px] font-bold"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              name="resale_visibility_scope"
              defaultValue="order_buyer"
              className="h-9 rounded-lg border border-amber-200 bg-white px-2 text-[11px] font-bold"
            >
              <option value="order_buyer">주문 구매자만</option>
              <option value="selected_buyers">특정 소비자</option>
            </select>
            <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-700">
              <input type="checkbox" name="include_order_buyer" defaultChecked />
              구매자 자동 포함
            </label>
          </div>
          <input
            type="text"
            name="resale_targets_csv"
            className="h-9 w-full rounded-lg border border-amber-200 bg-white px-2 text-[11px] font-semibold"
            placeholder="특정 소비자 user_id 콤마 구분 (selected_buyers 선택 시)"
          />
          <button
            type="submit"
            className="h-9 rounded-lg border border-amber-300 bg-white px-3 text-[11px] font-black text-amber-900 hover:bg-amber-100"
          >
            선택 구매자 일괄 저장
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-md">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className={adminUi.tableHeadRow}>
                <th className={adminUi.tableHeadCell}>선택</th>
                <th className={adminUi.tableHeadCell}>구매자</th>
                <th className={adminUi.tableHeadCell}>골드 결제 주문</th>
                <th className={adminUi.tableHeadCell}>누적 금액</th>
                <th className={adminUi.tableHeadCell}>최근 정책</th>
              </tr>
            </thead>
            <tbody>
              {buyers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                    조회된 골드 구매자가 없습니다.
                  </td>
                </tr>
              ) : (
                buyers.map((b) => (
                  <tr key={b.user_id} className={adminUi.tableRowHover}>
                    <td className={adminUi.tableBodyCell}>
                      <input type="checkbox" name="buyer_user_id" value={b.user_id} className="h-4 w-4" />
                    </td>
                    <td className={adminUi.tableBodyCell}>
                      <p className="font-black text-slate-800 break-all">{b.user_email}</p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {b.user_name ?? "-"} · {b.user_id}
                      </p>
                    </td>
                    <td className={adminUi.tableBodyCell}>
                      <p className="font-black text-slate-800">{b.order_count}건</p>
                      <p className="text-[10px] font-semibold text-slate-400">{b.last_order_at ?? "-"}</p>
                    </td>
                    <td className={adminUi.tableBodyCellStrong}>
                      {new Intl.NumberFormat("ko-KR").format(b.total_amount_krw)}원
                    </td>
                    <td className={adminUi.tableBodyCell}>
                      <p className="text-[11px] font-black text-slate-700">
                        {b.last_policy_enabled == null
                          ? "미설정"
                          : b.last_policy_enabled === 1
                          ? "활성"
                          : "비활성"}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500">
                        판매가:{" "}
                        {b.last_resale_offer_price_krw == null
                          ? "-"
                          : `${new Intl.NumberFormat("ko-KR").format(b.last_resale_offer_price_krw)}원`}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </form>

      <p className="text-center">
        <Link href="/admin/shop/orders" className="text-[11px] font-black text-slate-500 hover:text-teal-700">
          ← 주문 관리로 돌아가기
        </Link>
      </p>
    </div>
  );
}
