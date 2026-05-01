"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  PawPrint,
  MapPin,
  LayoutDashboard,
  ClipboardList,
  NotebookPen,
  ScanLine,
  Images,
  Store,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
} from "lucide-react";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { subjectKindFromDashboardPathname } from "@/lib/dashboard-path-kind";
import { useDashboardNavSearchSnapshot } from "@/hooks/use-dashboard-nav-search-snapshot";
import { FlowTopNavContent, type FlowTopNavSession } from "@/components/layout/FlowTopNav";
import { DashboardAnnouncementBell } from "@/components/dashboard/DashboardAnnouncementBell";
import { DashboardContextualHelp } from "@/components/dashboard/DashboardContextualHelp";
import { dashboardTopNavLinkClass } from "@/lib/dashboard-nav-styles";
import { cn } from "@/lib/utils";
import {
  isDashboardAlbums,
  isDashboardGeofences,
  isDashboardHome,
  isDashboardNfc,
  isDashboardPets,
  isDashboardScans,
} from "@/lib/dashboard-nav-active";

type DashboardNavBarProps = {
  session: FlowTopNavSession;
  isAdmin: boolean;
  orgManageHref?: string | null;
};

/** 데스크톱 가로 탭은 xl(1280px) 이상만. pointer:fine은 안드 Chrome·OAuth 직후에 오탐되어 모바일에서도 PC 탭이 뜰 수 있음 */
export function DashboardNavBar({ session, isAdmin, orgManageHref }: DashboardNavBarProps) {
  const pathname = usePathname();
  /** 휴대폰: 기본 접어 맵·본문 여유 확보, 탭 시 6칸 메뉴 펼침 */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchSnap = useDashboardNavSearchSnapshot();
  const pathKind = subjectKindFromDashboardPathname(pathname);
  const kind =
    pathKind ?? (searchSnap == null ? parseSubjectKind(null) : parseSubjectKind(searchSnap.kind));
  const currentModeLabel = subjectKindMeta[kind].label;
  const currentModeDescription = subjectKindMeta[kind].description;
  const tenant = searchSnap == null ? null : searchSnap.tenant;
  const tenantQs = tenant ? `?tenant=${encodeURIComponent(tenant)}` : "";

  const dashHome = isDashboardHome(pathname);
  const dashPets = isDashboardPets(pathname);
  const dashScans = isDashboardScans(pathname);
  const dashGeo = isDashboardGeofences(pathname);
  const dashAlbums = isDashboardAlbums(pathname);
  const dashNfc = isDashboardNfc(pathname);
  const dashStore = pathname === "/shop" || pathname.startsWith("/shop/");

  const navItems = [
    {
      href: `/dashboard/${kind}${tenantQs}`,
      label: "대시보드",
      active: dashHome,
      Icon: LayoutDashboard,
    },
    {
      href: `/dashboard/${kind}/pets${tenantQs}`,
      label: "관리대상",
      active: dashPets,
      Icon: ClipboardList,
    },
    {
      href: `/dashboard/${kind}/nfc${tenantQs}`,
      label: "NFC일기",
      active: dashNfc,
      Icon: NotebookPen,
    },
    {
      href: `/dashboard/${kind}/scans${tenantQs}`,
      label: "스캔기록",
      active: dashScans,
      Icon: ScanLine,
    },
    {
      href: `/dashboard/${kind}/albums${tenantQs}`,
      label: "전자앨범",
      active: dashAlbums,
      Icon: Images,
    },
    {
      href: `/dashboard/${kind}/geofences${tenantQs}`,
      label: "안심구역",
      active: dashGeo,
      Icon: MapPin,
    },
    {
      href: `/shop?kind=${encodeURIComponent(kind)}`,
      label: "스토어",
      active: dashStore,
      Icon: Store,
    },
  ] as const;

  const activeNavItem = navItems.find((item) => item.active);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
      <FlowTopNavContent
        variant="dashboard"
        session={session}
        isAdmin={isAdmin}
        currentModeLabel={currentModeLabel}
        currentModeDescription={currentModeDescription}
        orgManageHref={orgManageHref}
        logoutLandingKind={kind}
        dashboardHref={`/dashboard/${kind}${tenantQs}`}
      />
      <div className="border-t border-slate-100">
        <div className="container flex max-w-5xl flex-col gap-2 px-4 py-2.5 xl:flex-row xl:items-center xl:justify-between xl:py-2">
          <div className="flex min-w-0 items-center justify-between gap-2.5 xl:justify-start">
            <a
              href={`/dashboard/${kind}${tenantQs}`}
              className="flex min-w-0 max-w-[10rem] items-center gap-1.5 font-bold text-xl text-primary hover:opacity-90 min-[390px]:max-w-[12rem]"
            >
              <PawPrint className="h-6 w-6 shrink-0" />
              <span className="truncate">링크유 Link-U</span>
            </a>
            <div className="flex min-w-0 items-center justify-end gap-1.5">
              <DashboardContextualHelp />
              <DashboardAnnouncementBell />
              {session?.user?.name ? (
                <span className="max-w-[9.5rem] truncate text-xs font-bold text-slate-400 xl:hidden min-[390px]:max-w-[12rem]">
                  {session.user.name}
                </span>
              ) : null}
            </div>
          </div>

          <nav className="hidden xl:flex xl:flex-wrap xl:items-center xl:gap-3" aria-label="대시보드 메뉴">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn("inline-flex items-center gap-1.5", dashboardTopNavLinkClass(item.active))}
                aria-current={item.active ? "page" : undefined}
              >
                <item.Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </a>
            ))}
          </nav>

          <nav className="xl:hidden" aria-label="대시보드 메뉴">
            <div className="space-y-2">
              <button
                type="button"
                id="dashboard-mobile-nav-toggle"
                aria-expanded={mobileMenuOpen}
                aria-controls="dashboard-mobile-nav-grid"
                onClick={() => setMobileMenuOpen((o) => !o)}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                  mobileMenuOpen
                    ? "border-teal-200 bg-teal-50/80"
                    : "border-slate-200 bg-slate-50/90 hover:border-slate-300 hover:bg-white"
                )}
              >
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600">
                    <LayoutGrid className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">대시보드 메뉴</span>
                    <span className="block truncate text-sm font-black text-slate-800">
                      {mobileMenuOpen ? "닫기" : activeNavItem ? activeNavItem.label : "빠른 이동"}
                    </span>
                  </span>
                </span>
                {mobileMenuOpen ? (
                  <ChevronUp className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
                )}
              </button>
              {mobileMenuOpen ? (
                <div id="dashboard-mobile-nav-grid" className="grid grid-cols-3 gap-2 text-slate-700">
                  {navItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      aria-current={item.active ? "page" : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center",
                        item.active
                          ? "border-teal-200 bg-teal-50 text-teal-800"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <item.Icon className="h-4.5 w-4.5 shrink-0" />
                      <span className="text-[11px] font-black leading-tight tracking-[-0.01em]">{item.label}</span>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
