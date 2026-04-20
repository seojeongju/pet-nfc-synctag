"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { ADMIN_NAV_SECTIONS, isAdminNavActive } from "@/components/admin/layout/admin-nav-config";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AdminMobileDrawer({ open, onClose }: Props) {
  const pathname = usePathname() || "";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="관리자 메뉴">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="메뉴 닫기"
        onClick={onClose}
      />
      <div
        id="admin-mobile-drawer"
        className="absolute left-0 top-0 flex h-full w-[min(100vw,20rem)] flex-col bg-white shadow-2xl animate-in slide-in-from-left-2 duration-200"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[14px] bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-black tracking-tighter text-slate-900 text-lg leading-none italic uppercase block truncate">
                Link-U
              </span>
              <span className="text-[10px] font-black text-teal-500 tracking-[0.3em] uppercase mt-1 block">관리자 콘솔</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.id} className="mb-6 last:mb-2">
              <p className="px-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{section.title}</p>
              <div className="flex flex-col gap-1.5">
                {section.items.map((item) => {
                  const NavIcon = item.icon;
                  const active = isAdminNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all min-h-11",
                        active
                          ? "border-teal-200/80 bg-teal-50 shadow-sm"
                          : "border-slate-100 bg-white shadow-sm hover:border-teal-100/80 hover:bg-teal-50/50"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <NavIcon className={cn("w-5 h-5 shrink-0", item.color)} aria-hidden />
                      <span className={cn("font-black text-xs text-slate-800 truncate", active && "text-teal-900")}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4 space-y-2 shrink-0">
          <Link
            href="/"
            prefetch={false}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 bg-slate-50 text-slate-500 hover:text-slate-900 transition-all rounded-2xl min-h-12",
              adminUi.subtleCard
            )}
          >
            <Home className="w-5 h-5 shrink-0" />
            <span className="font-black text-xs tracking-wide">사용자 화면</span>
          </Link>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-rose-500/10 transition-all text-rose-500 border border-rose-100/0 hover:border-rose-500/20 bg-white shadow-md min-h-12"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="font-black text-xs tracking-wide">안전 로그아웃</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
