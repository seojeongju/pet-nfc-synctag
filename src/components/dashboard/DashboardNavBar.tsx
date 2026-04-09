"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { PawPrint, MapPin } from "lucide-react";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { FlowTopNavContent, type FlowTopNavSession } from "@/components/layout/FlowTopNav";
import { DashboardAnnouncementBell } from "@/components/dashboard/DashboardAnnouncementBell";
import { dashboardTopNavLinkClass } from "@/lib/dashboard-nav-styles";
import {
  isDashboardGeofences,
  isDashboardHome,
  isDashboardPets,
  isDashboardScans,
} from "@/lib/dashboard-nav-active";

type DashboardNavBarProps = {
  session: FlowTopNavSession;
  isAdmin: boolean;
  orgManageHref?: string | null;
};

export function DashboardNavBar({ session, isAdmin, orgManageHref }: DashboardNavBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kind = parseSubjectKind(searchParams.get("kind"));
  const currentModeLabel = subjectKindMeta[kind].label;
  const tenantRaw = searchParams.get("tenant");
  const tenant = typeof tenantRaw === "string" && tenantRaw.trim() ? tenantRaw.trim() : null;
  const qs = new URLSearchParams({ kind });
  if (tenant) qs.set("tenant", tenant);
  const q = `?${qs.toString()}`;

  const dashHome = isDashboardHome(pathname);
  const dashPets = isDashboardPets(pathname);
  const dashScans = isDashboardScans(pathname);
  const dashGeo = isDashboardGeofences(pathname);

  const dashLinks = (
    <>
      <a href={`/dashboard${q}`} className={dashboardTopNavLinkClass(dashHome)} aria-current={dashHome ? "page" : undefined}>
        대시보드
      </a>
      <a href={`/dashboard/pets${q}`} className={dashboardTopNavLinkClass(dashPets)} aria-current={dashPets ? "page" : undefined}>
        관리 대상
      </a>
      <a href={`/dashboard/scans${q}`} className={dashboardTopNavLinkClass(dashScans)} aria-current={dashScans ? "page" : undefined}>
        스캔 기록
      </a>
      <a
        href={`/dashboard/geofences${q}`}
        className={`inline-flex items-center gap-1 ${dashboardTopNavLinkClass(dashGeo)}`}
        aria-current={dashGeo ? "page" : undefined}
      >
        <MapPin className="w-3.5 h-3.5 shrink-0 md:w-4 md:h-4" />
        안심 구역
      </a>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
      <FlowTopNavContent
        variant="dashboard"
        session={session}
        isAdmin={isAdmin}
        currentModeLabel={currentModeLabel}
        orgManageHref={orgManageHref}
      />
      <div className="border-t border-slate-100">
        <div className="container flex max-w-5xl flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center md:justify-between md:py-2">
          <div className="flex min-w-0 items-center justify-between gap-3 md:justify-start">
            <a href="/hub" className="flex min-w-0 items-center gap-2 font-bold text-xl text-primary hover:opacity-90">
              <PawPrint className="h-6 w-6 shrink-0" />
              <span className="truncate">링크유 Link-U</span>
            </a>
            <div className="flex shrink-0 items-center gap-2">
              <DashboardAnnouncementBell />
              {session?.user?.name ? (
                <span className="truncate text-xs font-bold text-slate-400 md:hidden">{session.user.name}</span>
              ) : null}
            </div>
          </div>

          <nav className="hidden md:flex md:flex-wrap md:items-center md:gap-3 lg:gap-4" aria-label="대시보드 메뉴">
            {dashLinks}
          </nav>

          <nav
            className="-mx-1 flex gap-2 overflow-x-auto pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="대시보드 메뉴"
          >
            <div className="flex gap-2 text-slate-700">{dashLinks}</div>
          </nav>
        </div>
      </div>
    </header>
  );
}
