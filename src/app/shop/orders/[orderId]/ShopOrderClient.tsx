"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Package, MapPin, Phone, User, CreditCard, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKrw, subjectKindLabel } from "@/lib/shop";
import { updateOrderShippingInfo } from "@/app/actions/shop";
import type { ShopOrderPublic } from "@/types/shop";

type ShopOrderClientProps = {
  order: ShopOrderPublic;
  session: { user: { name: string } };
};

const statusLabel: Record<string, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "실패",
  cancelled: "취소됨",
};

export function ShopOrderClient({ order, session }: ShopOrderClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(Boolean(order.recipientName));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateOrderShippingInfo(formData);

    if (res.success) {
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(res.error || "배송 정보를 저장하는 중 오류가 발생했습니다.");
    }
    setIsSubmitting(false);
  };

  const st = order.status;
  const statusKo = statusLabel[st] ?? st;

  return (
    <div className="w-full max-w-none lg:max-w-screen-sm mx-auto space-y-6">
      {/* 주문 상태 헤더 */}
      <div className="text-center">
        <div
          className={cn(
            "mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[32px] ring-1 shadow-inner transition-transform hover:scale-105",
            st === "pending"
              ? "bg-amber-50 text-amber-600 ring-amber-100"
              : st === "paid"
                ? "bg-teal-50 text-teal-600 ring-teal-100"
                : "bg-slate-100 text-slate-500 ring-slate-200"
          )}
        >
          {st === "paid" ? <CheckCircle2 className="h-10 w-10" /> : <Package className="h-10 w-10" />}
        </div>
        <h1 className="text-[24px] font-black text-slate-900 tracking-tight">
          {st === "paid" ? "결제가 완료되었습니다" : success ? "배송 정보가 확인되었습니다" : "주문서를 완성해 주세요"}
        </h1>
        <p className="mt-2 flex items-center justify-center gap-2 text-[13px] font-bold text-slate-500">
          <span>주문번호 {order.id.slice(0, 8).toUpperCase()}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
              st === "pending" && "bg-amber-100 text-amber-800",
              st === "paid" && "bg-teal-100 text-teal-800"
            )}
          >
            {statusKo}
          </span>
        </p>
      </div>

      {/* 상품 정보 요약 */}
      <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
           <h2 className="text-[14px] font-black text-slate-800">주문 상품 정보</h2>
           <span className="text-[11px] font-bold text-teal-600">{subjectKindLabel(order.subjectKind)} 모드</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Package className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-black text-slate-900 leading-tight truncate">{order.product.name}</p>
              {order.selectedOptions && Object.entries(order.selectedOptions).map(([k, v]) => (
                <p key={k} className="mt-1 text-[11px] font-bold text-slate-400">
                  {k}: {v}
                </p>
              ))}
              <p className="mt-2 text-[15px] font-black text-teal-700">{formatKrw(order.amountKrw)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 배송지 정보 입력 / 확인 */}
      {st === "pending" && !success ? (
        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="text-[18px] font-black text-slate-900">배송지 정보 입력</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="orderId" value={order.id} />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase ml-1">수령인</label>
                <div className="relative">
                  <input
                    name="recipientName"
                    required
                    defaultValue={order.recipientName || session.user.name}
                    className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 pl-10 pr-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="이름"
                  />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase ml-1">연락처</label>
                <div className="relative">
                  <input
                    name="recipientPhone"
                    type="tel"
                    required
                    defaultValue={order.recipientPhone || ""}
                    className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 pl-10 pr-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="010-0000-0000"
                  />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase ml-1">배송 주소</label>
              <input
                name="shippingZip"
                className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-[13px] font-bold outline-none mb-2"
                placeholder="우편번호 (선택)"
                defaultValue={order.shippingZip || ""}
              />
              <input
                name="shippingAddress"
                required
                defaultValue={order.shippingAddress || ""}
                className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="전체 주소를 입력하세요"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase ml-1">배송 메모</label>
              <textarea
                name="shippingMemo"
                rows={2}
                defaultValue={order.shippingMemo || ""}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="부재 시 문 앞에 놓아주세요"
              />
            </div>

            {error && <p className="text-[12px] font-bold text-rose-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-indigo-600 text-white text-[15px] font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "배송 정보 저장하고 다음으로"}
              {!isSubmitting && <ChevronRight className="h-5 w-5" />}
            </button>
          </form>
        </div>
      ) : (
        /* 저장된 배송 정보 요약 */
        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-black text-slate-800">배송 정보</h2>
            {st === "pending" && (
              <button onClick={() => setSuccess(false)} className="text-[11px] font-black text-slate-400 hover:text-indigo-600">수정하기</button>
            )}
          </div>
          <div className="space-y-2 text-[13px] font-bold text-slate-600 bg-slate-50/50 rounded-2xl p-4">
            <p className="flex justify-between"><span>수령인</span><span className="text-slate-900">{order.recipientName}</span></p>
            <p className="flex justify-between"><span>연락처</span><span className="text-slate-900">{order.recipientPhone}</span></p>
            <p className="flex flex-col gap-1 mt-1 border-t border-slate-100 pt-2">
              <span className="text-[11px] text-slate-400">배송지</span>
              <span className="text-slate-900">{order.shippingZip ? `[${order.shippingZip}] ` : ""}{order.shippingAddress}</span>
            </p>
            {order.shippingMemo && (
              <p className="text-[11px] italic text-slate-400 mt-1">
                <span className="text-slate-500">&ldquo;</span>
                {order.shippingMemo}
                <span className="text-slate-500">&rdquo;</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 결제 안내 (정보 입력 완료 시) */}
      {success && st === "pending" && (
        <div className="rounded-[32px] border border-teal-100 bg-teal-50/50 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
               <CreditCard className="h-5 w-5" />
             </div>
             <h2 className="text-[18px] font-black text-teal-900">결제 진행하기</h2>
          </div>
          <p className="text-[13px] font-bold text-teal-800/70 leading-relaxed">
            배송 정보가 확인되었습니다. 이제 아래 결제 수단을 통해 주문을 완료해 주세요. 
            (현재는 안내 단계이며 실제 결제 연동 시 결제창이 나타납니다.)
          </p>
          <button className="w-full h-14 rounded-2xl bg-teal-600 text-white text-[15px] font-black shadow-lg shadow-teal-200 hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            결제하기 (PG 연동 준비 중)
          </button>
        </div>
      )}

      {/* 푸터 버튼 */}
      <div className="flex flex-col gap-3 pt-4">
        <Link
          href={`/shop?kind=${encodeURIComponent(order.subjectKind)}`}
          className="block w-full rounded-2xl bg-white border border-slate-200 py-3.5 text-center text-[13px] font-black text-slate-500 hover:bg-slate-50"
        >
          스토어로 돌아가기
        </Link>
        <Link
          href="/hub"
          className="block w-full text-center text-[11px] font-bold text-slate-400 hover:text-slate-600"
        >
          허브로 이동
        </Link>
      </div>
    </div>
  );
}
