"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { AdminHeaderUser, type SessionUser } from "@/components/admin/layout/AdminHeaderUser";
import { AdminMobileDrawer } from "@/components/admin/layout/AdminMobileDrawer";
import { AdminDashboardHelp } from "@/components/admin/layout/AdminDashboardHelp";

export function AdminHeaderBar({
  user,
  isPlatformAdmin,
}: {
  user?: SessionUser;
  isPlatformAdmin: boolean;
}) {
  const pathname = usePathname() || "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <AdminMobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isPlatformAdmin={isPlatformAdmin}
      />
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-slate-100 bg-white/80 px-3 backdrop-blur-md sm:px-4 lg:h-20 lg:px-10">
        <button
          type="button"
          className={cn(
            "lg:hidden inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-700 shadow-sm transition-colors",
            "hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.98]"
          )}
          aria-expanded={mobileMenuOpen}
          aria-controls="admin-mobile-drawer"
          aria-label="관리자 메뉴 열기"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:gap-4">
          <div className="w-2 h-2 shrink-0 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
          <h2 className="text-slate-700 text-[10px] font-black italic tracking-[0.02em] sm:text-[11px] lg:text-sm lg:tracking-[0.08em] truncate">
            시스템 상태:{" "}
            <span className="text-slate-400 font-bold ml-1 hidden sm:inline">실시간 운영 모니터링</span>
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-8">
          <AdminDashboardHelp />
          <form action="/logout" method="post" className="flex items-center">
            <button
              type="submit"
              className={cn(
                "flex items-center gap-1 px-2 py-2 lg:gap-1.5 lg:px-3 lg:py-2.5 rounded-2xl transition-all text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20",
                adminUi.subtleCard
              )}
              title="로그아웃"
              aria-label="관리자 로그아웃"
            >
              <LogOut className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
              <span className="font-black text-[10px] lg:text-xs uppercase tracking-wide hidden sm:inline">로그아웃</span>
            </button>
          </form>
          <AdminHeaderUser user={user} />
        </div>
      </header>
    </>
  );
}
