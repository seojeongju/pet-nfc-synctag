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
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";

const items = [
  {
    href: "/admin/nfc-tags",
    label: "허브",
    hint: "요약·이동",
    icon: LayoutGrid,
    match: "exact" as const,
    step: null as string | null,
  },
  {
    href: "/admin/nfc-tags/register",
    label: "UID 등록",
    hint: "인벤토리에 추가",
    icon: ListPlus,
    match: "prefix" as const,
    step: "1",
  },
  {
    href: "/admin/nfc-tags/write-url",
    label: "URL 기록",
    hint: "Web NFC로 기록",
    icon: Smartphone,
    match: "prefix" as const,
    step: "2",
  },
  {
    href: "/admin/nfc-tags/inventory",
    label: "인벤토리",
    hint: "마스터 데이터",
    icon: Database,
    match: "prefix" as const,
    step: "3",
  },
  {
    href: "/admin/nfc-tags/history",
    label: "연결·감사",
    hint: "로그 조회",
    icon: History,
    match: "prefix" as const,
    step: "4",
  },
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
    <div className="border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 backdrop-blur-md sticky top-16 lg:top-20 z-[15] shadow-sm shadow-slate-100/80">
      <div className={cn(adminUi.pageContainer, "py-4 lg:py-5 space-y-4")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-600">Pet-ID NFC 운영</p>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
              <h2 className="text-base font-black text-slate-900 sm:text-lg">표준 워크플로</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500 shadow-sm">
                등록 → 기록 → 점검 → 감사
                <ArrowRight className="h-3 w-3 text-teal-500" aria-hidden />
              </span>
            </div>
            <p className="text-xs font-bold leading-relaxed text-slate-500 max-w-2xl">
              Android Chrome에서 URL 기록 시 HTTPS·사용자 제스처가 필요합니다. iOS Safari는 Web NFC를 지원하지 않습니다.
            </p>
          </div>
          <Link
            href="/admin"
            prefetch={false}
            className="inline-flex shrink-0 items-center gap-1 self-start rounded-2xl border border-slate-100 bg-white px-3 py-2 text-[11px] font-black text-slate-600 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
          >
            운영 대시보드
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="NFC 태그 하위 메뉴">
          {items.map(({ href, label, hint, icon: Icon, match, step }) => {
            const active = isActive(pathname, href, match);
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={cn(
                  "inline-flex min-w-[9.5rem] shrink-0 flex-col gap-0.5 rounded-2xl border px-3 py-2.5 text-left transition-all sm:min-w-[10.5rem]",
                  active
                    ? "border-teal-300 bg-teal-50 text-teal-950 shadow-md ring-1 ring-teal-500/15"
                    : "border-slate-100 bg-white text-slate-600 hover:border-teal-100 hover:bg-teal-50/40"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="flex items-center gap-2">
                  {step ? (
                    <span
                      className={cn(
                        "flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1 text-[10px] font-black",
                        active ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {step}
                    </span>
                  ) : null}
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-teal-700" : "text-slate-400")} aria-hidden />
                  <span className={cn("text-xs font-black tracking-tight", active ? "text-teal-900" : "text-slate-800")}>
                    {label}
                  </span>
                </span>
                <span className={cn("pl-0.5 text-[10px] font-bold", active ? "text-teal-700/90" : "text-slate-400")}>
                  {hint}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
