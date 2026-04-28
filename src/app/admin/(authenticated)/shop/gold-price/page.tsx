import Link from "next/link";
import { ChevronLeft, Coins } from "lucide-react";
import { getAdminGoldSettings } from "@/app/actions/admin-shop";
import { AdminGoldPriceManager } from "@/components/admin/shop/AdminGoldPriceManager";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AdminGoldPricePage() {
  const settings = await getAdminGoldSettings();

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe)}>
      <header className="mb-8 flex items-start justify-between">
        <div className="space-y-1">
          <Link 
            href="/admin/shop" 
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition"
          >
            <ChevronLeft className="h-3 w-3" />
            Shop Admin
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Coins className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">금 시세 관리</h1>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            오늘의 금 시세를 수동으로 설정하거나 공공데이터 연동 상태를 관리합니다.
          </p>
        </div>
      </header>

      <AdminGoldPriceManager settings={settings} />
    </div>
  );
}
