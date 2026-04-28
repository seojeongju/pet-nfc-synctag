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
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
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
  initialKind: SubjectKind;
  products: ShopProductPublic[];
};

export default function ShopHomeClient({
  session,
  isAdmin,
  orgManageHref,
  allowedKinds,
  initialKind,
  products,
}: ShopHomeClientProps) {
  const router = useRouter();

  const visibleKinds =
    allowedKinds.length > 0 ? allowedKinds : ([...SUBJECT_KINDS] as SubjectKind[]);

  const selectKind = (k: SubjectKind) => {
    router.push(`/shop?kind=${encodeURIComponent(k)}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      <FlowTopNav
        variant="landing"
        session={session}
        isAdmin={isAdmin}
        orgManageHref={orgManageHref}
        dashboardHref={`/dashboard/${encodeURIComponent(initialKind)}`}
      />
      <div className="px-4 min-[430px]:px-5 py-6 min-[430px]:py-8 pb-24">
        <div className="w-full max-w-none lg:max-w-screen-sm mx-auto space-y-6 min-[430px]:space-y-8">
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
              <Store className="h-3.5 w-3.5" />
              링크유 스토어
            </div>
            <h1 className="text-[28px] font-black text-slate-900 leading-tight tracking-tight">
              모드에 맞는
              <br />
              <span className="text-teal-600">상품만</span> 보여드려요
            </h1>
            <p className="text-[14px] text-slate-500 font-medium leading-relaxed">
              선택한 이용 모드와 연결된 상품만 표시됩니다. 결제는 PG·간편결제 연동 단계에서 완료할 수 있게 준비 중이에요.
            </p>
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
                        {active ? "선택됨" : "탭하여 전환"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h2 className="text-[13px] font-black text-slate-800">
                {subjectKindMeta[initialKind].label} 상품
              </h2>
              <span className="text-[11px] font-bold text-slate-400">{products.length}개</span>
            </div>

            {products.length === 0 ? (
              <div className="rounded-[40px] border border-dashed border-slate-200 bg-white/50 px-5 py-16 text-center shadow-inner">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 mx-auto mb-4">
                  <Package className="h-8 w-8 text-slate-300" aria-hidden />
                </div>
                <p className="text-[16px] font-black text-slate-800">준비된 상품이 없어요</p>
                <p className="mt-2 text-[12px] font-bold text-slate-400 leading-relaxed max-w-[15rem] mx-auto">
                  이 모드에 어울리는 멋진 상품들을<br/>곧 만나보실 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 min-[430px]:gap-4">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/shop/${encodeURIComponent(p.slug)}?kind=${encodeURIComponent(initialKind)}`}
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
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
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
            )}
          </section>

          <p className="text-center text-[10px] font-bold text-slate-400 leading-relaxed">
            가격은 부가세 포함 기준 예시이며, 실제 결제 금액은 주문·결제 단계에서 확정됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
