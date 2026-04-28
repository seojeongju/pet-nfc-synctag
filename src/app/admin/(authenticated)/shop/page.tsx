import Link from "next/link";
import { Package, ChevronRight, Coins, BookOpen } from "lucide-react";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

export const runtime = "edge";

export default function AdminShopHomePage() {
  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe)}>
      <header className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">Store</p>
        <h1 className="text-2xl font-black text-slate-900">스토어 관리</h1>
        <p className="text-sm font-semibold text-slate-500">
          보호자 스토어 상품 등록·노출 모드·주문 상태를 관리합니다.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/shop/products"
          className={cn(
            "flex items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-md transition hover:border-teal-200 hover:shadow-lg",
            adminUi.subtleCard
          )}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <Package className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">상품</p>
              <p className="text-lg font-black text-slate-900">상품 목록·등록</p>
              <p className="mt-0.5 text-[12px] font-semibold text-slate-500">가격·모드·활성 여부</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
        </Link>

        <Link
          href="/admin/shop/gold-price"
          className={cn(
            "flex items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-md transition hover:border-teal-200 hover:shadow-lg",
            adminUi.subtleCard
          )}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Coins className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">시세</p>
              <p className="text-lg font-black text-slate-900">금 시세 관리</p>
              <p className="mt-0.5 text-[12px] font-semibold text-slate-500">자동 연동 · 수동 설정</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
        </Link>

        <Link
          href="/admin/shop/catalogs"
          className={cn(
            "flex items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-md transition hover:border-teal-200 hover:shadow-lg",
            adminUi.subtleCard
          )}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">카달로그</p>
              <p className="text-lg font-black text-slate-900">카달로그 관리</p>
              <p className="mt-0.5 text-[12px] font-semibold text-slate-500">사용자·모드별 구성</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
        </Link>
      </div>
    </div>
  );
}
