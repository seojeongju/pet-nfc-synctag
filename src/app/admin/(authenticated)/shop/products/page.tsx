import { cn } from "@/lib/utils";
import { 
  Plus, 
  Pencil, 
  ExternalLink, 
  Package, 
  Eye, 
  Zap,
  ShoppingBag,
  ChevronRight,
  DollarSign,
  Layers
} from "lucide-react";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function parseModes(json: string): SubjectKind[] {
  try {
    const v = JSON.parse(json) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x): x is SubjectKind => typeof x === "string" && (SUBJECT_KINDS as readonly string[]).includes(x)
    );
  } catch {
    return [];
  }
}

export default async function AdminShopProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  const sp = await searchParams;
  const products = await listAdminShopProducts();
  const ok = sp.ok === "1";
  const err = typeof sp.e === "string" ? decodeURIComponent(sp.e) : null;

  return (
    <div className={cn("min-h-screen bg-[#f8fafc] pb-20 font-outfit", adminUi.pageBottomSafe)}>
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                <ShoppingBag className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600">Store · Inventory</p>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">스토어 상품 관리</h1>
            <p className="text-[13px] font-bold text-slate-400">등록된 상품의 노출 모드, 가격 및 재고 상태를 실시간으로 관리합니다.</p>
          </div>
          
          <Link
            href="/admin/shop/products/new"
            className={cn(
              "group relative flex items-center justify-center gap-2 overflow-hidden rounded-[20px] bg-slate-900 px-8 py-4 text-sm font-black text-white shadow-xl transition-all hover:bg-teal-600 active:scale-95"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Plus className="h-4 w-4" />
            새 상품 등록
          </Link>
        </header>

        {ok && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/50 p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-white">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <p className="text-[13px] font-black text-teal-900">상품 정보가 성공적으로 업데이트되었습니다.</p>
          </div>
        )}

        {err && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4" role="alert">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white">
              <Plus className="h-4 w-4 rotate-45" />
            </div>
            <p className="text-[13px] font-black text-rose-900">{err}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 shadow-sm">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
                <Package className="h-10 w-10" />
              </div>
              <p className="text-[15px] font-black text-slate-400">등록된 상품이 없습니다.</p>
              <p className="text-[12px] font-bold text-slate-300 mt-1">상단의 &apos;새 상품 등록&apos; 버튼을 클릭해 상품을 추가해 보세요.</p>
            </div>
          ) : (
            products.map((p) => {
              const modes = parseModes(p.target_modes);
              const modeLabels = modes.map((m) => subjectKindMeta[m]?.label ?? m);
              
              return (
                <div 
                  key={p.id} 
                  className="group relative flex flex-col bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-2xl hover:shadow-slate-200/50 hover:border-teal-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500"
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black shadow-sm backdrop-blur-md",
                      p.active 
                        ? "bg-teal-500/10 text-teal-600 border border-teal-100" 
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", p.active ? "bg-teal-500 animate-pulse" : "bg-slate-300")} />
                      {p.active ? "판매 중" : "중지됨"}
                    </span>
                  </div>

                  {/* Image/Thumbnail */}
                  <div className="relative aspect-[4/3] w-full bg-slate-50 overflow-hidden">
                    {p.image_url ? (
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-200">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 p-6 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-tighter">#{p.slug}</p>
                      <h3 className="text-[17px] font-black text-slate-900 line-clamp-1 group-hover:text-teal-600 transition-colors">
                        {p.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                         <div className="flex items-center gap-1 text-teal-600">
                           <DollarSign className="h-3.5 w-3.5" />
                           <span className="text-[18px] font-black tracking-tight">
                             {p.price_krw.toLocaleString()}원
                           </span>
                         </div>
                         <p className="text-[10px] font-bold text-slate-400">재고: {p.stock_quantity.toLocaleString()}개</p>
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[44px] content-start pt-2 border-t border-slate-50">
                      {modeLabels.length > 0 ? (
                        modeLabels.map((m, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[10px] font-bold">
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">지정된 채널 없음</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Link
                        href={`/admin/shop/products/${encodeURIComponent(p.id)}`}
                        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-[16px] bg-slate-50 text-[13px] font-black text-slate-900 transition-all hover:bg-slate-900 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        상세 편집
                      </Link>
                      <Link
                        href={`/shop/${p.slug}`}
                        target="_blank"
                        className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-slate-100 text-slate-400 hover:border-teal-200 hover:text-teal-600 hover:bg-teal-50 transition-all"
                        title="스토어 페이지 보기"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <footer className="mt-16 text-center">
          <Link 
            href="/admin/shop" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-100 text-[12px] font-black text-slate-400 shadow-sm transition-all hover:text-teal-600 hover:border-teal-100"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            스토어 관리 홈으로 돌아가기
          </Link>
        </footer>
      </div>
    </div>
  );
}
