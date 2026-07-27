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
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";

const items = [
  {
    href: "/admin/nfc-tags",
    label: "허브",
    icon: LayoutGrid,
    match: "exact" as const,
    step: null as string | null,
  },
  {
    href: "/admin/nfc-tags/register",
    label: "등록",
    icon: ListPlus,
    match: "prefix" as const,
    step: "1",
  },
  {
    href: "/admin/nfc-tags/write-url",
    label: "기록",
    icon: Smartphone,
    match: "prefix" as const,
    step: "2",
  },
  {
    href: "/admin/nfc-tags/inventory",
    label: "인벤토리",
    icon: Database,
    match: "prefix" as const,
    step: "3",
  },
  {
    href: "/admin/nfc-tags/history",
    label: "감사",
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
      <div className={cn(adminUi.pageContainer, "py-3 md:py-3.5")}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-black text-slate-900">태그</p>
          <Link
            href="/admin"
            prefetch={false}
            className="touch-manipulation inline-flex min-h-9 shrink-0 items-center gap-1 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[11px] font-black text-slate-500 transition hover:border-teal-200 hover:text-teal-800"
          >
            대시보드
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileStepsOpen((v) => !v)}
            aria-expanded={mobileStepsOpen}
            className={cn(
              "touch-manipulation flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition active:scale-[0.99]",
              "border-teal-200 bg-teal-50/80"
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              {current.step ? (
                <span className="flex h-6 min-w-[1.25rem] items-center justify-center rounded-md bg-teal-600 px-1 text-[10px] font-black text-white">
                  {current.step}
                </span>
              ) : null}
              <CurrentIcon className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
              <span className="text-[13px] font-black text-slate-900">{current.label}</span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 text-teal-600 transition-transform", mobileStepsOpen && "rotate-180")}
              aria-hidden
            />
          </button>

          {mobileStepsOpen ? (
            <nav
              className="mt-2 flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm"
              aria-label="태그 하위 메뉴"
            >
              {items.map(({ href, label, icon: Icon, match, step }) => {
                const active = isActive(pathname, href, match);
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    onClick={() => setMobileStepsOpen(false)}
                    className={cn(
                      "touch-manipulation flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 transition active:scale-[0.99]",
                      active ? "bg-teal-50 text-teal-950" : "hover:bg-slate-50"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {step ? (
                      <span
                        className={cn(
                          "flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1 text-[10px] font-black",
                          active ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
                        )}
                      >
                        {step}
                      </span>
                    ) : (
                      <span className="w-5 shrink-0" aria-hidden />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-teal-700" : "text-slate-400")} aria-hidden />
                    <span className={cn("text-xs font-black", active ? "text-teal-900" : "text-slate-800")}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>

        <nav
          className="hidden gap-1.5 md:flex"
          aria-label="태그 하위 메뉴"
        >
          {items.map(({ href, label, icon: Icon, match, step }) => {
            const active = isActive(pathname, href, match);
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 transition",
                  active
                    ? "border-teal-300 bg-teal-50 text-teal-950 shadow-sm"
                    : "border-transparent bg-slate-50/80 text-slate-600 hover:border-slate-200 hover:bg-white"
                )}
                aria-current={active ? "page" : undefined}
              >
                {step ? (
                  <span
                    className={cn(
                      "flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1 text-[10px] font-black",
                      active ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {step}
                  </span>
                ) : null}
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-teal-700" : "text-slate-400")} aria-hidden />
                <span className="text-xs font-black tracking-tight">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
