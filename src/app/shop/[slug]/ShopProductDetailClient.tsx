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

  const handleOrder = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/shop/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `shop-${product.id}-${Date.now()}`,
        },
        body: JSON.stringify({ productId: product.id, kind }),
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      <FlowTopNav variant="landing" session={session} isAdmin={isAdmin} orgManageHref={orgManageHref} />
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

          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 flex gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-[12px] font-black text-amber-900">결제 연동 전 단계</p>
              <p className="text-[11px] font-semibold text-amber-800/90 mt-1 leading-relaxed">
                주문하기를 누르면 대기 주문이 생성됩니다. 이후 PG·간편결제·가상계좌 등으로 실제 결제를 연동할
                수 있게 됩니다.
              </p>
            </div>
          </div>

          {error ? (
            <p className="text-[12px] font-bold text-rose-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleOrder}
              disabled={loading}
              className={cn(
                "w-full min-h-14 rounded-2xl bg-teal-600 px-5 text-[15px] font-black text-white shadow-sm",
                "hover:bg-teal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2",
                "disabled:opacity-60 disabled:pointer-events-none",
                "inline-flex items-center justify-center gap-2 active:scale-[0.99] transition"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  주문 처리 중…
                </>
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
