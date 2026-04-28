"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Package,
  Home,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { ADMIN_NAV_SECTIONS, isAdminNavActive } from "@/components/admin/layout/admin-nav-config";

export { AdminHeaderUser, type SessionUser } from "@/components/admin/layout/AdminHeaderUser";

export type { NavSection } from "@/components/admin/layout/admin-nav-config";

export function AdminSidebarNav() {
  const pathname = usePathname() || "";

  return (
    <aside className="hidden lg:flex w-full shrink-0 flex-col border-b border-slate-100 bg-white/90 shadow-lg shadow-slate-100/50 backdrop-blur-md lg:z-auto lg:w-auto lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:min-h-0 lg:overflow-hidden lg:border-b-0 lg:border-r">
      <div className="p-5 lg:p-8 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-[14px] bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-black tracking-tighter text-slate-900 text-lg leading-none italic uppercase truncate">
            Link-U
          </span>
          <span className="text-[10px] font-black text-teal-500 tracking-[0.3em] uppercase mt-1">관리자 콘솔</span>
        </div>
      </div>

      <nav className="px-4 pb-4 lg:pb-2 lg:overflow-y-auto lg:flex-1 lg:min-h-0 custom-scrollbar">
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.id} className="mb-6 last:mb-2">
            <p className="px-3 lg:px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
              {section.title}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-1.5">
              {section.items.map((item) => {
                const NavIcon = item.icon;
                const active = isAdminNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between px-3 lg:px-4 py-3 lg:py-3 rounded-2xl border transition-all group min-h-11",
                      active
                        ? "border-teal-200/80 bg-teal-50 shadow-sm"
                        : "border-slate-100 bg-white shadow-sm hover:border-teal-100/80 hover:bg-teal-50/50"
                    )}
                  >
                    <div className="flex items-center gap-3 lg:gap-3 relative z-10 min-w-0">
                      <NavIcon
                        className={cn(
                          "w-4 h-4 lg:w-5 lg:h-5 shrink-0 transition-transform",
                          item.color,
                          active ? "scale-110" : "group-hover:scale-110"
                        )}
                      />
                      <span
                        className={cn(
                          "font-black text-[11px] lg:text-xs text-slate-800 tracking-tight lg:tracking-wide truncate",
                          active && "text-teal-900"
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "hidden lg:block w-3 h-3 shrink-0 transition-colors",
                        active ? "text-teal-500" : "text-slate-300 group-hover:text-teal-500"
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 lg:p-6 space-y-3 lg:space-y-4 border-t border-slate-100 mb-4 lg:mb-6 mt-auto shrink-0">
        <Link
          href="/"
          prefetch={false}
          className={cn(
            "flex items-center gap-4 px-4 py-4 bg-slate-50 text-slate-500 hover:text-slate-900 transition-all group min-h-12",
            adminUi.subtleCard
          )}
        >
          <Home className="w-5 h-5 shrink-0" />
          <span className="font-black text-xs tracking-wide">사용자 화면</span>
        </Link>
        <form action="/logout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-rose-500/10 transition-all text-rose-500 border border-rose-100/0 hover:border-rose-500/20 bg-white shadow-md min-h-12"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-black text-xs tracking-wide">안전 로그아웃</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
