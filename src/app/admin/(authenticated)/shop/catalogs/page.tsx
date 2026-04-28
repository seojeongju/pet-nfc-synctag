import Link from "next/link";
import { Plus, BookOpen, ChevronRight, Trash2, Edit } from "lucide-react";
import { getAdminCatalogs, deleteCatalogAction } from "@/app/actions/admin-catalog";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import AdminPageIntro from "@/components/admin/layout/AdminPageIntro";

export default async function AdminCatalogListPage() {
  const catalogs = await getAdminCatalogs();

  return (
    <div className={adminUi.pageContainer}>
      <AdminPageIntro 
        title="상품 카달로그 관리" 
        description="사용자별, 테넌트별 맞춤형 카달로그를 구성하고 관리합니다."
      />

      <div className="flex justify-end">
        <Link
          href="/admin/shop/catalogs/new"
          className={cn(adminUi.darkButton, "flex items-center gap-2 px-6 h-12 rounded-2xl")}
        >
          <Plus className="h-5 w-5" /> 새 카달로그 생성
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catalogs.map((catalog) => (
          <div key={catalog.id} className={cn(adminUi.sectionCard, "flex flex-col h-full")}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-teal-50 text-teal-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex gap-2">
                <Link 
                  href={`/admin/shop/catalogs/${catalog.id}`}
                  className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-teal-600 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">{catalog.title}</h3>
            <p className="text-[11px] font-bold text-slate-500 mb-4 line-clamp-2">
              {catalog.description || "설명이 없습니다."}
            </p>

            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-black text-slate-600 uppercase">
                  {catalog.mode}
                </span>
                {!catalog.isActive && (
                   <span className="px-2 py-1 rounded-md bg-rose-50 text-[10px] font-black text-rose-600">비활성</span>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                상품 {catalog.productIds.length}개
              </span>
            </div>
          </div>
        ))}

        {catalogs.length === 0 && (
          <div className="col-span-full py-20 text-center rounded-[40px] border-2 border-dashed border-slate-100 bg-slate-50/30">
            <p className="text-sm font-bold text-slate-400">등록된 카달로그가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
