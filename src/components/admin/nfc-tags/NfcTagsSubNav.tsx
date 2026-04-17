"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ListPlus,
  Smartphone,
  Database,
  History,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";

const items = [
  { href: "/admin/nfc-tags", label: "개요", icon: LayoutGrid, match: "exact" as const },
  { href: "/admin/nfc-tags/register", label: "UID 등록", icon: ListPlus, match: "prefix" as const },
  { href: "/admin/nfc-tags/write-url", label: "URL 기록", icon: Smartphone, match: "prefix" as const },
  { href: "/admin/nfc-tags/inventory", label: "인벤토리", icon: Database, match: "prefix" as const },
  { href: "/admin/nfc-tags/history", label: "연결·감사 이력", icon: History, match: "prefix" as const },
];

function isActive(pathname: string, href: string, match: "exact" | "prefix") {
  if (match === "exact") {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NfcTagsSubNav() {
  const pathname = usePathname() || "";

  return (
    <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-16 lg:top-20 z-[15]">
      <div className={cn(adminUi.pageContainer, "py-3 lg:py-4 space-y-0")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">NFC 태그 관리</p>
            <p className="text-sm font-black text-slate-800 truncate">등록 · URL 기록 · 재고 · 이력</p>
          </div>
          <Link
            href="/admin"
            prefetch={false}
            className="inline-flex items-center gap-1 text-[11px] font-black text-slate-500 hover:text-slate-800 shrink-0"
          >
            운영 대시보드
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <nav
          className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="NFC 태그 하위 메뉴"
        >
          {items.map(({ href, label, icon: Icon, match }) => {
            const active = isActive(pathname, href, match);
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-black transition-all",
                  active
                    ? "border-teal-200 bg-teal-50 text-teal-800 shadow-sm"
                    : "border-slate-100 bg-white text-slate-600 hover:border-teal-100 hover:bg-teal-50/50"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("h-4 w-4", active ? "text-teal-600" : "text-slate-400")} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
