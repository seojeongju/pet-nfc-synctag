"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Building2, Home, LogOut, MapPin, PanelLeft, PanelRight, PawPrint, Shield } from "lucide-react";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { FlowTopNavContent, type FlowTopNavSession } from "@/components/layout/FlowTopNav";
import { DashboardAnnouncementBell } from "@/components/dashboard/DashboardAnnouncementBell";
import { DashboardNavDrawer } from "@/components/dashboard/DashboardNavDrawer";
import { dashboardTopNavLinkClass } from "@/lib/dashboard-nav-styles";
import {
  isDashboardGeofences,
  isDashboardHome,
  isDashboardPets,
  isDashboardScans,
} from "@/lib/dashboard-nav-active";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardNavBarProps = {
  session: FlowTopNavSession;
  isAdmin: boolean;
  orgManageHref?: string | null;
};

function drawerNavLink(active: boolean, className?: string) {
  return cn(
    "flex w-full items-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition-colors",
    active
      ? "bg-teal-50 text-teal-800 ring-1 ring-teal-100"
      : "text-slate-700 hover:bg-slate-50 active:bg-slate-100",
    className
  );
}

export function DashboardNavBar({ session, isAdmin, orgManageHref }: DashboardNavBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const segments = pathname.split("/");
  const pathKind =
    segments[1] === "dashboard" && segments[2] && segments[2] !== "pets" && segments[2] !== "scans" && segments[2] !== "geofences"
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

  const closeDrawers = () => {
    setLeftOpen(false);
    setRightOpen(false);
  };

  useEffect(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, [pathname, searchParams]);

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
        <MapPin className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
        안심 구역
      </a>
    </>
  );

  const leftDrawerContent = (
    <div className="flex flex-col gap-2">
      <a
        href="/hub"
        onClick={closeDrawers}
        className="flex items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/90 px-4 py-3 text-sm font-black text-teal-800"
      >
        <Home className="size-4 shrink-0" aria-hidden />
        모드 선택
      </a>
      <p className="px-1 text-xs font-bold uppercase tracking-wide text-slate-400">{currentModeLabel}</p>
      <p className="mt-2 px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">페이지</p>
      <nav className="flex flex-col gap-1" aria-label="대시보드 메뉴">
        <a href={`/dashboard/${kind}${tenantQs}`} onClick={closeDrawers} className={drawerNavLink(dashHome)} aria-current={dashHome ? "page" : undefined}>
          대시보드
        </a>
        <a href={`/dashboard/${kind}/pets${tenantQs}`} onClick={closeDrawers} className={drawerNavLink(dashPets)} aria-current={dashPets ? "page" : undefined}>
          관리 대상
        </a>
        <a href={`/dashboard/${kind}/scans${tenantQs}`} onClick={closeDrawers} className={drawerNavLink(dashScans)} aria-current={dashScans ? "page" : undefined}>
          스캔 기록
        </a>
        <a
          href={`/dashboard/${kind}/geofences${tenantQs}`}
          onClick={closeDrawers}
          className={drawerNavLink(dashGeo)}
          aria-current={dashGeo ? "page" : undefined}
        >
          <MapPin className="size-4 shrink-0 text-teal-600" aria-hidden />
          안심 구역
        </a>
      </nav>
    </div>
  );

  const rightDrawerContent = (
    <div className="flex flex-col gap-2">
      {session?.user?.name ? (
        <div className="mb-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">로그인</p>
          <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{session.user.name}</p>
        </div>
      ) : null}
      {session && orgManageHref ? (
        <a
          href={orgManageHref}
          onClick={closeDrawers}
          className="flex items-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-black text-teal-700 hover:bg-teal-50"
        >
          <Building2 className="size-4 shrink-0" aria-hidden />
          조직 관리
        </a>
      ) : null}
      <a
        href={isAdmin ? "/admin" : "/admin/login"}
        onClick={closeDrawers}
        className={cn(
          "flex items-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-black",
          isAdmin ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
        )}
      >
        <Shield className="size-4 shrink-0" aria-hidden />
        {isAdmin ? "관리자" : "관리자 로그인"}
      </a>
      <div className="rounded-2xl border border-slate-100 p-3">
        <p className="mb-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">공지</p>
        <div className="flex justify-center">
          <DashboardAnnouncementBell />
        </div>
      </div>
      {session ? (
        <a
          href="/logout"
          onClick={closeDrawers}
          className="mt-2 flex items-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-black text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          로그아웃
        </a>
      ) : null}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
      {/* 모바일: 한 줄 + 좌·우 드로어 */}
      <div className="md:hidden">
        <div className="mx-auto flex w-full min-w-0 max-w-5xl items-center gap-2 px-3 py-2.5 sm:px-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl border-slate-200"
            aria-expanded={leftOpen}
            aria-label="내비게이션 메뉴 열기"
            onClick={() => {
              setRightOpen(false);
              setLeftOpen(true);
            }}
          >
            <PanelLeft className="size-5" aria-hidden />
          </Button>
          <a href="/hub" className="flex min-w-0 flex-1 items-center justify-center gap-2 py-1 text-center text-base font-bold text-primary">
            <PawPrint className="size-5 shrink-0" aria-hidden />
            <span className="truncate">링크유 Link-U</span>
          </a>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl border-slate-200"
            aria-expanded={rightOpen}
            aria-label="계정 및 설정 열기"
            onClick={() => {
              setLeftOpen(false);
              setRightOpen(true);
            }}
          >
            <PanelRight className="size-5" aria-hidden />
          </Button>
        </div>
        <DashboardNavDrawer open={leftOpen} side="left" title="메뉴" onClose={closeDrawers}>
          {leftDrawerContent}
        </DashboardNavDrawer>
        <DashboardNavDrawer open={rightOpen} side="right" title="계정" onClose={closeDrawers}>
          {rightDrawerContent}
        </DashboardNavDrawer>
      </div>

      {/* 데스크톱: 기존 2단 레이아웃 */}
      <div className="hidden md:block">
        <FlowTopNavContent
          variant="dashboard"
          session={session}
          isAdmin={isAdmin}
          currentModeLabel={currentModeLabel}
          orgManageHref={orgManageHref}
        />
        <div className="border-t border-slate-100">
          <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-row items-center justify-between gap-3 px-3 py-2 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <a href="/hub" className="flex min-w-0 items-center gap-2 text-lg font-bold text-primary hover:opacity-90 sm:text-xl">
                <PawPrint className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
                <span className="truncate">링크유 Link-U</span>
              </a>
              <div className="flex shrink-0 items-center gap-2">
                <DashboardAnnouncementBell />
              </div>
            </div>
            <nav className="flex flex-wrap items-center justify-end gap-3 lg:gap-4" aria-label="대시보드 메뉴">
              {dashLinks}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
