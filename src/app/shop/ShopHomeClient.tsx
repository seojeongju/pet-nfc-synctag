"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Baby,
  Briefcase,
  ChevronRight,
  Gem,
  Package,
  PawPrint,
  Sparkles,
  Store,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import type { ShopGoldPriceTabPayload } from "@/lib/shop-gold-price-tab";
import type { ShopProductPublic } from "@/types/shop";
import { FlowTopNav } from "@/components/layout/FlowTopNav";
import type { FlowTopNavSession } from "@/components/layout/FlowTopNav";
import { formatKrw } from "@/lib/shop";

const modeTileIcons: Record<SubjectKind, typeof PawPrint> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

function ModeIcon({ kind }: { kind: SubjectKind }) {
  const Icon = modeTileIcons[kind];
  return <Icon className="h-5 w-5" aria-hidden />;
}

type ShopHomeClientProps = {
  session: FlowTopNavSession;
  isAdmin: boolean;
  orgManageHref: string | null;
  allowedKinds: SubjectKind[];
  initialKind: SubjectKind | "all";
  fallbackKind: SubjectKind;
  products: ShopProductPublic[];
  hasGoldPurchase: boolean;
  storeTab: "products" | "gold-price";
  goldPricePayload: ShopGoldPriceTabPayload | null;
};

function formatSeoulDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ShopHomeClient({
  session,
  isAdmin,
  orgManageHref,
  allowedKinds,
  initialKind,
  fallbackKind,
  products,
  hasGoldPurchase,
  storeTab,
  goldPricePayload,
}: ShopHomeClientProps) {
  const router = useRouter();

  const visibleKinds =
    allowedKinds.length > 0 ? allowedKinds : ([...SUBJECT_KINDS] as SubjectKind[]);

  const selectKind = (k: SubjectKind | "all") => {
    if (k === "all") {
      router.push(`/shop?kind=all`);
      return;
    }
    router.push(`/shop?kind=${encodeURIComponent(k)}`);
  };

  const isAllKind = initialKind === "all";
  const filteredProducts = products.filter((p) => {
    try {
      if (isAllKind) return true;
      return p.subjectKind === initialKind;
    } catch {
      return false;
    }
  });

  // 다중 카테고리 대응을 위해 ShopProductPublic 인터페이스에 targetModes가 있다고 가정하고 필터링하거나
  // 간단하게 p.subjectKind (첫번째 모드) 기준으로 필터링 (현재 로직)
  // 사실 DB에서 rowToPublic 할 때 kind를 넘겨주는데, listAllActiveShopProducts에서는 modes[0]을 줌.
  // 제대로 하려면 ShopProductPublic에 targetModes: SubjectKind[] 를 추가해야 함.

  const showGoldStoreTabs = !isAllKind && initialKind === "gold" && hasGoldPurchase;

  const goStoreTab = (t: "products" | "gold-price") => {
    if (t === "products") {
      router.push(`/shop?kind=${encodeURIComponent(isAllKind ? fallbackKind : initialKind)}`);
      return;
    }
    router.push(`/shop?kind=gold&tab=gold-price`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      <FlowTopNav
        variant="landing"
        session={session}
        isAdmin={isAdmin}
        orgManageHref={orgManageHref}
        dashboardHref={`/dashboard/${encodeURIComponent(isAllKind ? fallbackKind : initialKind)}`}
      />
      <div className="px-4 min-[430px]:px-5 py-6 min-[430px]:py-8 pb-24">
        <div className="w-full max-w-none lg:max-w-screen-sm mx-auto space-y-6 min-[430px]:space-y-8">
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
              <Store className="h-3.5 w-3.5" />
              링크유 스토어
            </div>
            <h1 className="text-[28px] font-black text-slate-900 leading-tight tracking-tight">
              상품을
              <br />
              <span className="text-teal-600">둘러보세요</span>
            </h1>
          </header>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">이용 모드</p>
              <Sparkles className="h-4 w-4 text-amber-400" aria-hidden />
            </div>
            <div
              className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-thin"
              role="tablist"
              aria-label="스토어 모드 선택"
            >
              {/* 전체 탭 추가 */}
              <button
                type="button"
                role="tab"
                aria-selected={isAllKind}
                onClick={() => selectKind("all")}
                className={cn(
                  "shrink-0 inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-left transition min-h-[48px]",
                  isAllKind
                    ? "border-teal-400 bg-gradient-to-br from-teal-50 to-cyan-50/80 shadow-sm ring-2 ring-teal-200/60"
                    : "border-slate-200 bg-slate-50/80 hover:border-teal-200 hover:bg-white"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    isAllKind ? "bg-teal-100 text-teal-700" : "bg-white text-slate-500"
                  )}
                >
                  <Package className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-black text-slate-900 leading-tight">전체</span>
                  <span className="block text-[10px] font-semibold text-slate-500 mt-0.5">모든 상품</span>
                </span>
              </button>

              {visibleKinds.map((k) => {
                const active = k === initialKind;
                return (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectKind(k)}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-left transition min-h-[48px]",
                      active
                        ? "border-teal-400 bg-gradient-to-br from-teal-50 to-cyan-50/80 shadow-sm ring-2 ring-teal-200/60"
                        : "border-slate-200 bg-slate-50/80 hover:border-teal-200 hover:bg-white"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        active ? "bg-teal-100 text-teal-700" : "bg-white text-slate-500"
                      )}
                    >
                      <ModeIcon kind={k} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-black text-slate-900 leading-tight">
                        {subjectKindMeta[k].label}
                      </span>
                      <span className="block text-[10px] font-semibold text-slate-500 mt-0.5 truncate max-w-[10rem]">
                        상품 보기
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {showGoldStoreTabs ? (
            <section className="rounded-2xl border border-amber-100/90 bg-gradient-to-br from-amber-50/90 to-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-800/80">
                  골드 스토어
                </p>
                <Gem className="h-4 w-4 text-amber-500" aria-hidden />
              </div>
              <div className="flex gap-2" role="tablist" aria-label="골드 스토어 보기 전환">
                <button
                  type="button"
                  role="tab"
                  aria-selected={storeTab === "products"}
                  onClick={() => goStoreTab("products")}
                  className={cn(
                    "flex-1 rounded-2xl border px-3 py-2.5 text-[12px] font-black transition min-h-[48px]",
                    storeTab === "products"
                      ? "border-amber-400 bg-white shadow-sm ring-2 ring-amber-200/70 text-slate-900"
                      : "border-slate-200/80 bg-white/60 text-slate-500 hover:border-amber-200"
                  )}
                >
                  상품
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={storeTab === "gold-price"}
                  onClick={() => goStoreTab("gold-price")}
                  className={cn(
                    "flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-[12px] font-black transition min-h-[48px]",
                    storeTab === "gold-price"
                      ? "border-amber-400 bg-white shadow-sm ring-2 ring-amber-200/70 text-slate-900"
                      : "border-slate-200/80 bg-white/60 text-slate-500 hover:border-amber-200"
                  )}
                >
                  <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
                  오늘의 금시세
                </button>
              </div>
            </section>
          ) : null}

          <section>
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h2 className="text-[13px] font-black text-slate-800">
                {storeTab === "gold-price"
                  ? "오늘의 금시세"
                  : isAllKind ? "전체 상품" : `${subjectKindMeta[initialKind].label} 상품`}
              </h2>
              {storeTab === "products" ? (
                <span className="text-[11px] font-bold text-slate-400">{filteredProducts.length}개</span>
              ) : null}
            </div>

            {storeTab === "gold-price" && goldPricePayload ? (
              <div className="space-y-4">
                <div className="rounded-[28px] border border-amber-100 bg-white p-5 shadow-[0_8px_24px_rgba(180,83,9,0.08)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700/80 mb-1">
                    적용 시세 (1g)
                  </p>
                  <p className="text-[26px] font-black tabular-nums text-slate-900 tracking-tight">
                    {formatKrw(goldPricePayload.pricePerGram)}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-slate-500 leading-relaxed">
                    {goldPricePayload.manualOverridePrice !== null
                      ? "관리자 수동 단가가 적용된 값입니다."
                      : goldPricePayload.useAutoFetch
                        ? "자동 연동·저장된 최근 시세를 사용합니다."
                        : "자동 연동이 꺼져 있어 저장된 시세 이력을 사용합니다."}
                    {goldPricePayload.lastFetchedAt ? (
                      <>
                        {" "}
                        <span className="text-slate-400">
                          (참고 시각 KST {formatSeoulDateTime(goldPricePayload.lastFetchedAt)})
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] font-black text-slate-800 mb-2">내가 산 골드 기준</p>
                  {goldPricePayload.holdings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center">
                      <p className="text-[13px] font-bold text-slate-500">
                        표시할 결제 완료 내역이 없습니다.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {goldPricePayload.holdings.map((h) => (
                        <li key={h.orderId}>
                          <Link
                            href={`/shop/orders/${encodeURIComponent(h.orderId)}?kind=gold`}
                            className="block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-amber-200 hover:shadow-md active:scale-[0.99]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[14px] font-black text-slate-900 leading-snug line-clamp-2">
                                  {h.productName}
                                </p>
                                <p className="mt-1 text-[10px] font-bold text-slate-400">
                                  주문 {formatSeoulDateTime(h.orderedAt)}
                                </p>
                                {h.weightGrams != null && h.isGoldLinked ? (
                                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                                    중량 {h.weightGrams}g
                                    {h.laborFeeKrw != null ? ` · 공임 ${formatKrw(h.laborFeeKrw)}` : null}
                                  </p>
                                ) : null}
                              </div>
                              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                                결제 {formatKrw(h.paidAmountKrw)}
                              </span>
                              {h.estimatedValueKrw != null ? (
                                <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-800 ring-1 ring-amber-100">
                                  오늘 추정 {formatKrw(h.estimatedValueKrw)}
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                                  금 시세 연동 상품만 추정가 표시
                                </span>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <p className="text-center text-[10px] font-bold text-slate-400 leading-relaxed px-1">
                  추정가는 현재 관리 시세·상품 중량·공임을 바탕으로 한 참고값이며, 매입·환급 금액과 다를 수 있습니다.
                </p>
              </div>
            ) : null}

            {storeTab === "products" && filteredProducts.length === 0 ? (
              <div className="rounded-[40px] border border-dashed border-slate-200 bg-white/50 px-5 py-16 text-center shadow-inner">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 mx-auto mb-4">
                  <Package className="h-8 w-8 text-slate-300" aria-hidden />
                </div>
                <p className="text-[16px] font-black text-slate-800">준비된 상품이 없어요</p>
                <p className="mt-2 text-[12px] font-bold text-slate-400 leading-relaxed max-w-[15rem] mx-auto">
                  조금만 기다려 주세요!<br/>멋진 상품들을 곧 만나보실 수 있습니다.
                </p>
              </div>
            ) : storeTab === "products" ? (
              <div className="grid grid-cols-2 gap-3 min-[430px]:gap-4">
                {filteredProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/shop/${encodeURIComponent(p.slug)}?kind=${encodeURIComponent(isAllKind ? p.subjectKind : initialKind)}`}
                    className={cn(
                      "group flex flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]",
                      "transition-all duration-300 hover:border-teal-200 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] hover:-translate-y-1 active:scale-[0.98]"
                    )}
                  >
                    {/* 썸네일 영역 */}
                    <div className="relative aspect-square overflow-hidden bg-slate-50">
                      {p.imageUrl ? (
                        <img 
                          src={p.imageUrl} 
                          alt={p.name} 
                          className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100/50">
                          <Package className="h-10 w-10 text-slate-200 group-hover:scale-110 transition-transform" />
                        </div>
                      )}
                      {/* 배지 (선택사항: 신상품 등) */}
                      <div className="absolute top-3 left-3">
                        <div className="rounded-full bg-white/80 backdrop-blur-md px-2 py-0.5 border border-white/50 shadow-sm">
                           <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest">Premium</p>
                        </div>
                      </div>
                    </div>

                    {/* 정보 영역 */}
                    <div className="flex flex-1 flex-col p-4 pt-3.5">
                      <div className="flex-1 space-y-1">
                        <h3 className="text-[14px] min-[430px]:text-[15px] font-black text-slate-900 leading-tight group-hover:text-teal-700 transition-colors line-clamp-2 break-keep">
                          {p.name}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400 line-clamp-1">
                          {p.description}
                        </p>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between gap-1">
                        <p className="text-[15px] font-black text-slate-900 tabular-nums">
                          {formatKrw(p.priceKrw)}
                        </p>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>

          {storeTab === "products" ? (
            <p className="text-center text-[10px] font-bold text-slate-400 leading-relaxed">
              가격은 부가세 포함 기준 예시이며, 실제 결제 금액은 주문·결제 단계에서 확정됩니다.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
