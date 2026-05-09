"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2, 
  Package, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  PlayCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import type { ShopProductPublic } from "@/types/shop";
import { FlowTopNav } from "@/components/layout/FlowTopNav";
import type { FlowTopNavSession } from "@/components/layout/FlowTopNav";
import { formatKrw } from "@/lib/shop";
import { sanitizeShopContentHtml } from "@/lib/shop-content-html";

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
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // 미디어 목록 구성 (메인 이미지 + 추가 이미지 + 비디오)
  const mediaList = useMemo(() => {
    const list: { type: "image" | "video"; url: string }[] = [];
    if (product.imageUrl) list.push({ type: "image", url: product.imageUrl });
    if (product.additionalImages) {
      product.additionalImages.forEach((url) => list.push({ type: "image", url }));
    }
    if (product.videoUrl) list.push({ type: "video", url: product.videoUrl });
    return list;
  }, [product.imageUrl, product.additionalImages, product.videoUrl]);

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
  const safeContentHtml = useMemo(
    () => sanitizeShopContentHtml(product.contentHtml ?? ""),
    [product.contentHtml]
  );

  const nextMedia = () => setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length);
  const prevMedia = () => setCurrentMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);

  const renderMedia = (media: { type: "image" | "video"; url: string }) => {
    if (media.type === "video") {
      const isYoutube = media.url.includes("youtube.com") || media.url.includes("youtu.be");
      if (isYoutube) {
        let videoId = "";
        if (media.url.includes("v=")) videoId = media.url.split("v=")[1].split("&")[0];
        else if (media.url.includes("youtu.be/")) videoId = media.url.split("youtu.be/")[1].split("?")[0];
        
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0`}
            className="h-full w-full min-h-[160px] border-0 sm:min-h-[200px]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
      return (
        <video
          src={media.url}
          controls
          className="h-full w-full max-h-full object-contain bg-black"
        />
      );
    }
    return (
      <img
        src={media.url}
        alt={product.name}
        className={cn(
          "h-full w-full max-h-full object-contain object-center",
          isSoldOut && "grayscale opacity-50"
        )}
        loading="eager"
        decoding="async"
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-outfit">
      <FlowTopNav
        variant="landing"
        session={session}
        isAdmin={isAdmin}
        orgManageHref={orgManageHref}
        dashboardHref={`/dashboard/${encodeURIComponent(kind)}`}
      />
      
      <div className="px-4 min-[430px]:px-5 py-4 min-[430px]:py-6 pb-24">
        <div className="w-full max-w-none lg:max-w-screen-sm mx-auto space-y-6">
          {/* 뒤로가기 브레드크럼 */}
          <div className="flex items-center justify-between">
            <Link
              href={`/shop?kind=${encodeURIComponent(kind)}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-teal-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {subjectKindMeta[kind].label} 목록
            </Link>
          </div>

          {/* 메인 미디어 캐러셀 */}
          {mediaList.length > 0 && (
            <div className="group relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
              {/* 모바일: 뷰포트 높이 상한으로 메인 미디어 영역을 줄여 제목·가격 가독성 확보 */}
              <div
                className={cn(
                  "relative flex w-full items-center justify-center overflow-hidden",
                  "bg-gradient-to-b from-slate-50/90 to-white",
                  "h-[min(48dvh,400px)] min-h-[180px]",
                  "sm:h-auto sm:min-h-[220px] sm:max-h-[min(72dvh,560px)] sm:aspect-video"
                )}
              >
                <AnimatePresence initial={false} mode="sync">
                  <motion.div
                    key={currentMediaIndex}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.5}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = offset.x;
                      if (swipe < -50) {
                        nextMedia();
                      } else if (swipe > 50) {
                        prevMedia();
                      }
                    }}
                    initial={{ x: 36 }}
                    animate={{ x: 0 }}
                    exit={{ x: -36 }}
                    transition={{
                      x: { type: "spring", stiffness: 360, damping: 36, mass: 0.8 },
                    }}
                    className="absolute inset-0 flex h-full w-full touch-pan-y cursor-grab items-center justify-center active:cursor-grabbing will-change-transform"
                  >
                    {renderMedia(mediaList[currentMediaIndex])}
                  </motion.div>
                </AnimatePresence>

                {isSoldOut && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="rounded-full bg-white/95 px-8 py-3 shadow-2xl border border-white/50">
                      <p className="text-sm font-black text-slate-900 tracking-[0.2em]">SOLD OUT</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 내비게이션 버튼 (2개 이상일 때) */}
              {mediaList.length > 1 && (
                <>
                  <button
                    onClick={prevMedia}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-slate-800 shadow-lg border border-white/20 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextMedia}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-slate-800 shadow-lg border border-white/20 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  
                  {/* 인디케이터 */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 rounded-full bg-black/10 backdrop-blur-sm">
                    {mediaList.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 transition-all duration-300 rounded-full",
                          i === currentMediaIndex ? "w-5 bg-white" : "w-1.5 bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* 비디오 뱃지 */}
              {mediaList[currentMediaIndex].type === "video" && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-teal-600/90 backdrop-blur-md px-3 py-1 text-[10px] font-black text-white">
                  <PlayCircle className="h-3 w-3" />
                  VIDEO
                </div>
              )}
            </div>
          )}

          {/* 상품 기본 정보 헤더 */}
          <div className="rounded-[32px] border border-slate-100 bg-white p-6 min-[430px]:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600">
                {product.isGoldLinked ? "프리미엄 골드" : "Official Store"}
              </p>
            </div>
            
            <h1 className="text-[24px] min-[430px]:text-[28px] font-black text-slate-900 leading-tight break-keep [word-break:keep-all]">
              {product.name}
            </h1>
            
            <div className="mt-4 flex items-baseline gap-2">
              <p className="text-[26px] font-black text-teal-600 tabular-nums">
                {formatKrw(product.priceKrw)}
              </p>
              {product.isGoldLinked && (
                <p className="text-[12px] font-bold text-slate-400">
                  (시세 반영가)
                </p>
              )}
            </div>

            {/* 상단 빠른 구매 버튼 */}
            <button
              type="button"
              onClick={handleOrder}
              disabled={loading || isSoldOut}
              className={cn(
                "mt-5 relative w-full h-14 rounded-2xl px-5 text-[15px] font-black text-white shadow-lg transition-all overflow-hidden",
                isSoldOut
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-500 hover:shadow-teal-500/20 active:scale-[0.98] active:shadow-inner",
                "disabled:opacity-60 disabled:pointer-events-none",
                "flex items-center justify-center gap-2.5"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  주문 예약 중...
                </>
              ) : isSoldOut ? (
                "품절된 상품입니다"
              ) : (
                <>
                  <Package className="h-4.5 w-4.5" />
                  지금 주문하기
                </>
              )}
            </button>

            <p className="mt-5 text-[15px] font-medium text-slate-500 leading-relaxed whitespace-pre-line break-keep [word-break:keep-all]">
              {product.description}
            </p>
          </div>

          {/* 상세 설명 컨텐츠 (HTML) */}
          {safeContentHtml && (
            <div className="pt-4">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[16px] font-black text-slate-900 shrink-0">상품 상세 정보</h2>
                <div className="h-[1px] w-full bg-slate-100" />
              </div>
              <div 
                className={cn(
                  "shop-detail-content overflow-hidden prose prose-slate max-w-none",
                  "rounded-[32px] border border-slate-50 bg-white p-4 min-[430px]:p-6 shadow-sm",
                  isSoldOut && "grayscale opacity-80"
                )}
                dangerouslySetInnerHTML={{ __html: safeContentHtml }} 
              />
            </div>
          )}

          {/* 재고 안내 */}
          {(isSoldOut || isLowStock) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-2xl px-5 py-4 flex items-center gap-3 border shadow-sm",
                isSoldOut ? "bg-slate-50 border-slate-200" : "bg-rose-50 border-rose-100"
              )}
            >
              <div className={cn("h-2.5 w-2.5 rounded-full", isSoldOut ? "bg-slate-400" : "bg-rose-500")} />
              <p className={cn("text-[13px] font-bold", isSoldOut ? "text-slate-600" : "text-rose-700")}>
                {isSoldOut ? "현재 전 수량 품절되었습니다." : `품절 임박! 현재 ${product.stockQuantity}개 남았습니다.`}
              </p>
            </motion.div>
          )}

          {/* 옵션 선택 */}
          {product.options && product.options.length > 0 && (
            <div className={cn(
              "space-y-6 rounded-[32px] border border-slate-100 bg-white p-6 min-[430px]:p-8 shadow-sm transition-all",
              isSoldOut && "opacity-50 pointer-events-none grayscale"
            )}>
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">옵션 선택</p>
                <div className="rounded-full bg-teal-50 px-3 py-1">
                  <span className="text-[10px] font-black text-teal-600">필수</span>
                </div>
              </div>
              <div className="space-y-5">
                {product.options.map((group) => (
                  <div key={group.id} className="space-y-2.5">
                    <label className="text-[13px] font-black text-slate-700 ml-1">{group.name}</label>
                    <div className="relative">
                      <select 
                        className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50/50 px-5 text-[14px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all appearance-none cursor-pointer"
                        value={selectedOptions[group.name] || ""}
                        onChange={(e) => setSelectedOptions(prev => ({ ...prev, [group.name]: e.target.value }))}
                        disabled={isSoldOut}
                      >
                        <option value="">{group.name} 선택</option>
                        {group.values.map((v) => (
                          <option key={v.label} value={v.label}>
                            {v.label} {v.priceDeltaKrw !== 0 ? `(${v.priceDeltaKrw > 0 ? "+" : ""}${formatKrw(v.priceDeltaKrw)})` : ""}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="h-4 w-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 안내 정보 */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-4 flex gap-4">
            <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-[13px] font-black text-amber-900">결제 안내</p>
              <p className="text-[12px] font-medium text-amber-800/80 mt-1 leading-relaxed">
                현재 버전은 주문 예약 단계입니다. 주문하기 완료 후 관리자 확인을 통해 결제 안내가 진행됩니다.
              </p>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-rose-50 border border-rose-100 p-4"
            >
              <p className="text-[13px] font-bold text-rose-600 text-center" role="alert">
                {error}
              </p>
            </motion.div>
          )}

          {/* 하단 플로팅 구매 섹션 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
               <span className="text-[15px] font-black text-slate-400">최종 결제 금액</span>
               <div className="flex flex-col items-end">
                 <span className="text-[28px] font-black text-teal-600 tabular-nums">
                   {formatKrw(totalPrice)}
                 </span>
                 {product.priceKrw !== totalPrice && (
                   <span className="text-[11px] font-bold text-slate-400">기본가 {formatKrw(product.priceKrw)} + 옵션 포함</span>
                 )}
               </div>
            </div>
            
            <button
              type="button"
              onClick={handleOrder}
              disabled={loading || isSoldOut}
              className={cn(
                "relative w-full h-16 rounded-[24px] px-6 text-[16px] font-black text-white shadow-xl transition-all overflow-hidden",
                isSoldOut 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-teal-600 hover:bg-teal-500 hover:shadow-teal-500/20 active:scale-[0.98] active:shadow-inner",
                "disabled:opacity-60 disabled:pointer-events-none",
                "flex items-center justify-center gap-3"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  주문 예약 중...
                </>
              ) : isSoldOut ? (
                "품절된 상품입니다"
              ) : (
                <>
                  <Package className="h-5 w-5" />
                  지금 주문하기
                </>
              )}
              {!isSoldOut && !loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              )}
            </button>
            
            <p className="text-center text-[11px] font-semibold text-slate-400">
              {subjectKindMeta[kind].label} 모드 맞춤형 혜택이 적용되었습니다.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .shop-detail-content img {
          max-width: 100%;
          height: auto;
          border-radius: 16px;
          margin: 1.5rem 0;
        }
        .shop-detail-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
          word-break: keep-all;
        }
        .shop-detail-content iframe {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 16px;
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}
