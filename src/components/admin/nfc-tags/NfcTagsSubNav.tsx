"use client";

import { useEffect, useState } from "react";
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
  ChevronDown,
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
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);

  const current =
    items.find((it) => isActive(pathname, it.href, it.match)) ?? items[0];
  const CurrentIcon = current.icon;

  useEffect(() => {
    setMobileStepsOpen(false);
  }, [pathname]);

  return (
    <div
      className={cn(
        "border-b border-slate-200/80 bg-white shadow-sm",
        "relative z-10",
        "md:sticky md:top-16 lg:top-20"
      )}
    >
      <div
        className={cn(
          adminUi.pageContainer,
          "py-4 pb-5 md:py-4 md:pb-5 lg:py-5 lg:pb-6 space-y-3 md:space-y-4"
        )}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-600">Pet-ID NFC 운영</p>
            <div className="flex flex-wrap items-end gap-2 sm:flex-row sm:gap-3">
              <h2 className="text-base font-black text-slate-900 sm:text-lg">표준 워크플로</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500 shadow-sm">
                등록 → 기록 → 점검 → 감사
                <ArrowRight className="h-3 w-3 text-teal-500" aria-hidden />
              </span>
            </div>
          </div>
          <Link
            href="/admin"
            prefetch={false}
            className="touch-manipulation inline-flex min-h-11 shrink-0 items-center gap-1 self-start rounded-2xl border border-slate-100 bg-white px-4 py-2.5 text-[11px] font-black text-slate-600 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.99]"
          >
            운영 대시보드
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {/* 모바일: 접었다 펼치는 단계 메뉴 */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileStepsOpen((v) => !v)}
            aria-expanded={mobileStepsOpen}
            className={cn(
              "touch-manipulation flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99]",
              "border-teal-200 bg-teal-50/80 shadow-sm ring-1 ring-teal-500/10"
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              {current.step ? (
                <span className="flex h-6 min-w-[1.25rem] items-center justify-center rounded-md bg-teal-600 px-1 text-[10px] font-black text-white">
                  {current.step}
                </span>
              ) : null}
              <CurrentIcon className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
              <span className="min-w-0">
                <span className="block text-[13px] font-black text-slate-900 sm:text-xs">{current.label}</span>
                <span className="block text-[11px] font-bold text-slate-500 sm:text-[10px]">{current.hint}</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="text-[11px] font-black text-teal-700">
                {mobileStepsOpen ? "접기" : "단계 이동"}
              </span>
              <ChevronDown
                className={cn("h-4 w-4 text-teal-600 transition-transform", mobileStepsOpen && "rotate-180")}
                aria-hidden
              />
            </span>
          </button>

          {mobileStepsOpen ? (
            <nav
              className="mt-2 space-y-1.5 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm"
              aria-label="NFC 태그 하위 메뉴"
            >
              {items.map(({ href, label, hint, icon: Icon, match, step }) => {
                const active = isActive(pathname, href, match);
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    onClick={() => setMobileStepsOpen(false)}
                    className={cn(
                      "touch-manipulation flex min-h-[48px] items-center gap-3 rounded-xl border px-3 py-3 transition-colors active:scale-[0.99]",
                      active
                        ? "border-teal-300 bg-teal-50 text-teal-950"
                        : "border-transparent bg-slate-50/80 hover:bg-teal-50/60"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {step ? (
                      <span
                        className={cn(
                          "flex h-6 min-w-[1.25rem] items-center justify-center rounded-md px-1 text-[10px] font-black",
                          active ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
                        )}
                      >
                        {step}
                      </span>
                    ) : (
                      <span className="w-6 shrink-0" aria-hidden />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-teal-700" : "text-slate-400")} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-xs font-black", active ? "text-teal-900" : "text-slate-800")}>
                        {label}
                      </span>
                      <span className="block text-[10px] font-bold text-slate-500">{hint}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>

        {/* 태블릿·데스크톱: 기존 가로 탭 */}
        <nav
          className="hidden md:flex gap-2 overflow-x-auto pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="NFC 태그 하위 메뉴"
        >
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
