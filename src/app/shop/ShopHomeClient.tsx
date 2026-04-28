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
      <FlowTopNav variant="landing" session={session} isAdmin={isAdmin} orgManageHref={orgManageHref} />
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-12 text-center">
                <Package className="h-10 w-10 mx-auto text-slate-300 mb-3" aria-hidden />
                <p className="text-[14px] font-black text-slate-700">이 모드에 등록된 상품이 아직 없어요</p>
                <p className="mt-2 text-[12px] font-medium text-slate-500 leading-relaxed">
                  준비되는 대로 이곳에 표시됩니다. 다른 모드를 선택해 보세요.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {products.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/shop/${encodeURIComponent(p.slug)}?kind=${encodeURIComponent(initialKind)}`}
                      className={cn(
                        "group flex items-stretch gap-4 rounded-[22px] border border-slate-100 bg-white p-4 shadow-sm",
                        "transition-all hover:border-teal-200 hover:shadow-md active:scale-[0.99] min-h-[100px]"
                      )}
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 text-teal-600 ring-1 ring-teal-100">
                        <Package className="h-7 w-7" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <p className="text-[15px] font-black text-slate-900 leading-snug group-hover:text-teal-800 transition-colors line-clamp-2">
                          {p.name}
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-slate-500 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                        <p className="mt-2 text-[15px] font-black text-teal-700 tabular-nums">
                          {formatKrw(p.priceKrw)}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 shrink-0 self-center group-hover:text-teal-500 transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
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
