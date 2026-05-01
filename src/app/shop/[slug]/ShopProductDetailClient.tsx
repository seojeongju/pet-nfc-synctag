"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Package, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import type { ShopProductPublic } from "@/types/shop";
import { FlowTopNav } from "@/components/layout/FlowTopNav";
import type { FlowTopNavSession } from "@/components/layout/FlowTopNav";
import { formatKrw } from "@/lib/shop";

type ShopProductDetailClientProps = {
  session: FlowTopNavSession;
  isAdmin: boolean;
  orgManageHref: string | null;
  product: ShopProductPublic;
  kind: SubjectKind;
};

export default function ShopProductDetailClient({
  session,
  isAdmin,
  orgManageHref,
  product,
  kind,
}: ShopProductDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const calculateTotalPrice = () => {
    let total = product.priceKrw;
    if (product.options) {
      for (const group of product.options) {
        const selectedLabel = selectedOptions[group.name];
        const val = group.values.find((v) => v.label === selectedLabel);
        if (val) total += val.priceDeltaKrw;
      }
    }
    return total;
  };

  const handleOrder = async () => {
    // 필수 옵션 체크 (모든 그룹이 선택되었는지)
    if (product.options) {
      for (const group of product.options) {
        if (!selectedOptions[group.name]) {
          setError(`${group.name} 옵션을 선택해 주세요.`);
          return;
        }
      }
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `shop-${product.id}-${Date.now()}`,
        },
        body: JSON.stringify({ 
          productId: product.id, 
          kind,
          options: selectedOptions 
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        orderId?: string;
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(data.error || "주문에 실패했습니다.");
        return;
      }
      if (data.orderId) {
        router.push(`/shop/orders/${encodeURIComponent(data.orderId)}`);
        return;
      }
      setError("응답이 올바르지 않습니다.");
    } catch {
      setError("네트워크 오류가 났습니다.");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = calculateTotalPrice();

  const isSoldOut = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      <FlowTopNav
        variant="landing"
        session={session}
        isAdmin={isAdmin}
        orgManageHref={orgManageHref}
        dashboardHref={`/dashboard/${encodeURIComponent(kind)}`}
      />
      <div className="px-4 min-[430px]:px-5 py-5 min-[430px]:py-7 pb-24">
        <div className="w-full max-w-none lg:max-w-screen-sm mx-auto space-y-5 min-[430px]:space-y-6">
          <div>
            <Link
              href={`/shop?kind=${encodeURIComponent(kind)}`}
              className="inline-flex items-center gap-1.5 text-[12px] font-black text-teal-600 hover:text-teal-800 min-h-10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {subjectKindMeta[kind].label} 목록
            </Link>
          </div>

          {product.imageUrl ? (
            <div className="relative overflow-hidden rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <img src={product.imageUrl} alt={product.name} className={cn("w-full object-contain object-center bg-slate-50 aspect-square sm:aspect-video", isSoldOut && "grayscale opacity-50")} />
              {isSoldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="rounded-full bg-white/90 backdrop-blur-md px-6 py-2.5 shadow-xl border border-white">
                    <p className="text-sm font-black text-slate-900 tracking-widest">SOLD OUT</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {product.contentHtml ? (
            <div 
              className={cn("shop-detail-content overflow-hidden", isSoldOut && "grayscale opacity-80")}
              dangerouslySetInnerHTML={{ __html: product.contentHtml }} 
            />
          ) : (
            <div className="rounded-[28px] border border-slate-100 bg-white p-5 min-[430px]:p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-600 ring-1 ring-teal-100 mb-5">
                <Package className="h-10 w-10" aria-hidden />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 mb-1.5">상품</p>
              <h1 className="text-[22px] min-[430px]:text-2xl font-black text-slate-900 leading-snug break-keep [word-break:keep-all]">
                {product.name}
              </h1>
              <p className="mt-3 text-[20px] font-black text-teal-700 tabular-nums">{formatKrw(product.priceKrw)}</p>
              <p className="mt-4 text-[14px] font-medium text-slate-600 leading-relaxed whitespace-pre-line break-keep [word-break:keep-all]">
                {product.description}
              </p>
            </div>
          )}

          {/* 재고 안내 (품절 또는 임박 시) */}
          {(isSoldOut || isLowStock) && (
            <div className={cn(
              "rounded-2xl px-4 py-3 flex items-center gap-3 border animate-pulse",
              isSoldOut ? "bg-slate-50 border-slate-200" : "bg-rose-50 border-rose-100"
            )}>
              <div className={cn("h-2 w-2 rounded-full", isSoldOut ? "bg-slate-400" : "bg-rose-500")} />
              <p className={cn("text-[12px] font-black", isSoldOut ? "text-slate-600" : "text-rose-700")}>
                {isSoldOut ? "죄송합니다. 현재 상품이 모두 판매되었습니다." : `품절 임박! 현재 ${product.stockQuantity}개 남았습니다.`}
              </p>
            </div>
          )}

          {/* 옵션 선택 섹션 */}
          {product.options && product.options.length > 0 && (
            <div className={cn("space-y-5 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm", isSoldOut && "opacity-50 pointer-events-none")}>
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">옵션 선택</p>
                <span className="text-[10px] font-bold text-teal-600">필수 항목</span>
              </div>
              <div className="space-y-4">
                {product.options.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <label className="text-[12px] font-black text-slate-700">{group.name}</label>
                    <select 
                      className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-[13px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all appearance-none"
                      value={selectedOptions[group.name] || ""}
                      onChange={(e) => setSelectedOptions(prev => ({ ...prev, [group.name]: e.target.value }))}
                      disabled={isSoldOut}
                    >
                      <option value="">{group.name}을(를) 선택하세요</option>
                      {group.values.map((v) => (
                        <option key={v.label} value={v.label}>
                          {v.label} {v.priceDeltaKrw !== 0 ? `(${v.priceDeltaKrw > 0 ? "+" : ""}${formatKrw(v.priceDeltaKrw)})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 flex gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-[12px] font-black text-amber-900">결제 연동 전 단계</p>
              <p className="text-[11px] font-semibold text-amber-800/90 mt-1 leading-relaxed">
                주문하기를 누르면 대기 주문이 생성됩니다. 이후 실제 결제 수단을 연동할 수 있게 됩니다.
              </p>
            </div>
          </div>

          {error ? (
            <p className="text-[12px] font-bold text-rose-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2 mb-1">
               <span className="text-sm font-black text-slate-500">최종 결제 금액</span>
               <span className="text-2xl font-black text-teal-600 tabular-nums">{formatKrw(totalPrice)}</span>
            </div>
            <button
              type="button"
              onClick={handleOrder}
              disabled={loading || isSoldOut}
              className={cn(
                "w-full min-h-14 rounded-2xl px-5 text-[15px] font-black text-white shadow-sm transition-all",
                isSoldOut 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-teal-600 hover:bg-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 active:scale-[0.99]",
                "disabled:opacity-60 disabled:pointer-events-none",
                "inline-flex items-center justify-center gap-2"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  주문 처리 중…
                </>
              ) : isSoldOut ? (
                "품절되었습니다"
              ) : (
                "주문하기"
              )}
            </button>
            <p className="text-center text-[11px] font-medium text-slate-400">
              {subjectKindMeta[kind].label} 모드로만 구매할 수 있어요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
