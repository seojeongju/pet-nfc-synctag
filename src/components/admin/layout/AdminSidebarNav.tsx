"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Radio,
  Building2,
  Home,
  LogOut,
  ChevronRight,
  Package,
  LayoutGrid,
  ListPlus,
  Smartphone,
  Database,
  History,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";

type NavLeaf = { href: string; label: string; icon: LucideIcon; color: string };

export type NavSection = { id: string; title: string; items: NavLeaf[] };

const NAV_SECTIONS: NavSection[] = [
  {
    id: "ops",
    title: "운영·현황",
    items: [
      { href: "/admin", label: "운영 대시보드", icon: LayoutDashboard, color: "text-teal-500" },
      { href: "/admin/announcements", label: "모드·배치 공지", icon: Megaphone, color: "text-indigo-500" },
      { href: "/admin/monitoring", label: "NFC/BLE 모니터링", icon: Radio, color: "text-sky-500" },
    ],
  },
  {
    id: "nfc",
    title: "Pet-ID NFC",
    items: [
      { href: "/admin/nfc-tags", label: "허브·워크플로", icon: LayoutGrid, color: "text-amber-500" },
      { href: "/admin/nfc-tags/register", label: "① UID 등록", icon: ListPlus, color: "text-teal-600" },
      { href: "/admin/nfc-tags/write-url", label: "② URL 기록", icon: Smartphone, color: "text-indigo-600" },
      { href: "/admin/nfc-tags/inventory", label: "③ 인벤토리", icon: Database, color: "text-amber-600" },
      { href: "/admin/nfc-tags/history", label: "④ 연결·감사", icon: History, color: "text-slate-600" },
    ],
  },
  {
    id: "org",
    title: "조직",
    items: [{ href: "/admin/tenants", label: "조직·멤버 관리", icon: Building2, color: "text-emerald-500" }],
  },
];

function normalizePath(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p;
}

function isNavActive(pathname: string, href: string) {
  const p = normalizePath(pathname);
  const h = normalizePath(href);
  if (h === "/admin") return p === "/admin";
  /* NFC 허브는 개요 페이지에서만 활성(하위 경로는 전용 메뉴가 담당) */
  if (h === "/admin/nfc-tags") return p === "/admin/nfc-tags";
  return p === h || p.startsWith(`${h}/`);
}

type SessionUser = { id: string; image?: string | null; name?: string | null };

export function AdminSidebarNav() {
  const pathname = usePathname() || "";

  return (
    <aside className="w-full shrink-0 border-b border-slate-100 bg-white/90 shadow-lg shadow-slate-100/50 backdrop-blur-md lg:z-auto lg:w-auto lg:border-b-0 lg:border-r lg:max-h-screen lg:sticky lg:top-0 lg:flex lg:flex-col lg:min-h-screen">
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
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className="mb-6 last:mb-2">
            <p className="px-3 lg:px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
              {section.title}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-1.5">
              {section.items.map((item) => {
                const NavIcon = item.icon;
                const active = isNavActive(pathname, item.href);
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

export function AdminHeaderUser({ user }: { user?: SessionUser }) {
  return (
    <div className="flex items-center gap-2 lg:gap-4 group cursor-pointer p-1 lg:pr-4 rounded-full hover:bg-slate-50 transition-all">
      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-teal-500/20 overflow-hidden shadow-lg group-hover:border-teal-500 transition-colors shrink-0">
        {user?.image ? (
          <Image
            src={user.image.replace("http://", "https://")}
            alt={user.name || ""}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center uppercase font-black text-teal-400 text-xs">
            {(user?.name || "A").charAt(0)}
          </div>
        )}
      </div>
      <div className="text-right hidden sm:block min-w-0">
        <p className="text-xs font-black text-slate-800 leading-none uppercase tracking-tighter truncate max-w-[140px] lg:max-w-[200px]">
          {user?.name}
        </p>
        <p className="text-[9px] text-teal-500 font-black uppercase tracking-[0.2em] mt-1.5 opacity-80 italic">
          관리자 인증
        </p>
      </div>
    </div>
  );
}
