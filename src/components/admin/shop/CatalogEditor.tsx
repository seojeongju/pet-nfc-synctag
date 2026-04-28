"use client";

import { useState } from "react";
import { Save, X, Plus, Package, Check } from "lucide-react";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import { saveCatalogAction } from "@/app/actions/admin-catalog";
import type { ShopCatalog, AdminShopProductRow } from "@/types/shop";

interface CatalogEditorProps {
  catalog: any | null;
  products: any[];
}

export default function CatalogEditor({ catalog, products }: CatalogEditorProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    catalog?.productIds || []
  );

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <form action={saveCatalogAction} className="space-y-8">
      {catalog?.id && <input type="hidden" name="id" value={catalog.id} />}
      <input type="hidden" name="productIds" value={JSON.stringify(selectedProductIds)} />

      <div className={adminUi.sectionCard}>
        <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <Package className="h-5 w-5 text-teal-600" /> 기본 설정
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">카달로그 제목</label>
            <input
              name="title"
              required
              defaultValue={catalog?.title || ""}
              className={cn("w-full", adminUi.input, "h-12")}
              placeholder="예: 2026 봄 시즌 골드바 컬렉션"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">대상 모드</label>
            <select
              name="mode"
              defaultValue={catalog?.mode || "all"}
              className={cn("w-full appearance-none", adminUi.input, "h-12")}
            >
              <option value="all">전체</option>
              <option value="pet">반려동물 (Pet)</option>
              <option value="child">미아방지 (Child)</option>
              <option value="gold">골드/주얼리 (Gold)</option>
            </select>
          </div>

          <div className="col-span-full space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">카달로그 설명</label>
            <textarea
              name="description"
              defaultValue={catalog?.description || ""}
              className={cn("w-full p-4 min-h-[100px]", adminUi.input, "h-auto")}
              placeholder="카달로그에 대한 간략한 설명을 입력하세요."
            />
          </div>
        </div>
      </div>

      <div className={adminUi.sectionCard}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-teal-600" /> 상품 선택
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {selectedProductIds.length}개 선택됨
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => {
            const isSelected = selectedProductIds.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggleProduct(p.id)}
                className={cn(
                  "relative cursor-pointer rounded-2xl border-2 p-4 transition-all",
                  isSelected
                    ? "border-teal-500 bg-teal-50/50"
                    : "border-slate-100 bg-slate-50 hover:border-slate-200"
                )}
              >
                <div className="aspect-square rounded-xl bg-white mb-3 overflow-hidden flex items-center justify-center border border-slate-100">
                  {p.image_url ? (
                    <img src={p.image_url} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-slate-200" />
                  )}
                </div>
                <p className="text-[11px] font-black text-slate-800 line-clamp-1">{p.name}</p>
                <p className="text-[10px] font-bold text-slate-400">{p.price_krw?.toLocaleString()}원</p>
                
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-teal-500 text-white rounded-full p-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          className={cn(adminUi.darkButton, "px-12 h-14 rounded-3xl text-sm")}
        >
          {catalog?.id ? "변경사항 저장" : "카달로그 생성하기"}
        </button>
      </div>
    </form>
  );
}
