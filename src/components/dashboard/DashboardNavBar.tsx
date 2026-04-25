"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { PawPrint, MapPin } from "lucide-react";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { FlowTopNavContent, type FlowTopNavSession } from "@/components/layout/FlowTopNav";
import { DashboardAnnouncementBell } from "@/components/dashboard/DashboardAnnouncementBell";
import { DashboardContextualHelp } from "@/components/dashboard/DashboardContextualHelp";
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

/** 데스크톱 가로 탭은 xl(1280px) 이상만. pointer:fine은 안드 Chrome·OAuth 직후에 오탐되어 모바일에서도 PC 탭이 뜰 수 있음 */
export function DashboardNavBar({ session, isAdmin, orgManageHref }: DashboardNavBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // 경로에서 [kind] 추출 시도 (/dashboard/[kind]...)
  const segments = pathname.split("/");
  const pathKind = (segments[1] === "dashboard" && segments[2] && segments[2] !== "pets" && segments[2] !== "scans" && segments[2] !== "geofences") 
    ? segments[2] 
    : null;
  
  const kind = parseSubjectKind(pathKind || searchParams.get("kind"));
  const currentModeLabel = subjectKindMeta[kind].label;
  const tenantRaw = searchParams.get("tenant");
  const tenant = typeof tenantRaw === "string" && tenantRaw.trim() ? tenantRaw.trim() : null;
  
  const tenantQs = tenant ? `?tenant=${encodeURIComponent(tenant)}` : "";

  const dashHome = isDashboardHome(pathname);
  const dashPets = isDashboardPets(pathname);
  const dashScans = isDashboardScans(pathname);
  const dashGeo = isDashboardGeofences(pathname);

  const dashLinks = (
    <>
      <a href={`/dashboard/${kind}${tenantQs}`} className={dashboardTopNavLinkClass(dashHome)} aria-current={dashHome ? "page" : undefined}>
        대시보드
      </a>
      <a href={`/dashboard/${kind}/pets${tenantQs}`} className={dashboardTopNavLinkClass(dashPets)} aria-current={dashPets ? "page" : undefined}>
        관리 대상
      </a>
      <a href={`/dashboard/${kind}/scans${tenantQs}`} className={dashboardTopNavLinkClass(dashScans)} aria-current={dashScans ? "page" : undefined}>
        스캔 기록
      </a>
      <a
        href={`/dashboard/${kind}/geofences${tenantQs}`}
        className={`inline-flex items-center gap-1 ${dashboardTopNavLinkClass(dashGeo)}`}
        aria-current={dashGeo ? "page" : undefined}
      >
        <MapPin className="w-3.5 h-3.5 shrink-0 xl:w-4 xl:h-4" />
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
        logoutLandingKind={kind}
      />
      <div className="border-t border-slate-100">
        <div className="container flex max-w-5xl flex-col gap-2 px-4 py-2.5 xl:flex-row xl:items-center xl:justify-between xl:py-2">
          <div className="flex min-w-0 items-center justify-between gap-3 xl:justify-start">
            <a href="/hub" className="flex min-w-0 items-center gap-2 font-bold text-xl text-primary hover:opacity-90">
              <PawPrint className="h-6 w-6 shrink-0" />
              <span className="truncate">링크유 Link-U</span>
            </a>
            <div className="flex shrink-0 items-center gap-2">
              <DashboardContextualHelp />
              <DashboardAnnouncementBell />
              {session?.user?.name ? (
                <span className="truncate text-xs font-bold text-slate-400 xl:hidden">{session.user.name}</span>
              ) : null}
            </div>
          </div>

          <nav className="hidden xl:flex xl:flex-wrap xl:items-center xl:gap-4" aria-label="대시보드 메뉴">
            {dashLinks}
          </nav>

          <nav
            className="-mx-1 flex gap-2 overflow-x-auto pb-1 xl:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="대시보드 메뉴"
          >
            <div className="flex gap-2 text-slate-700">{dashLinks}</div>
          </nav>
        </div>
      </div>
    </header>
  );
}
