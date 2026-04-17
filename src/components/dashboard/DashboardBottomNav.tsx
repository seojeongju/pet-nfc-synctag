"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Baby, Briefcase, Gem, History, Home, LogOut, MapPin, PanelLeft, PanelRight, PawPrint, UserRound } from "lucide-react";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import { cn } from "@/lib/utils";
import { dashboardBottomIconWrap, dashboardBottomLabelClass } from "@/lib/dashboard-nav-styles";
import {
  isDashboardGeofences,
  isDashboardHome,
  isDashboardPets,
  isDashboardScans,
} from "@/lib/dashboard-nav-active";
import { DashboardNavDrawer } from "@/components/dashboard/DashboardNavDrawer";
import { Button } from "@/components/ui/button";

const subjectAvatars: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

function bottomDrawerLink(active: boolean) {
  return cn(
    "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black transition-colors",
    active ? "bg-teal-50 text-teal-800 ring-1 ring-teal-100" : "text-slate-700 hover:bg-slate-50"
  );
}

/**
 * 대시보드 하단 메뉴. 모바일(md 미만)은 좌·우 드로어 + 홈만 노출해 가독성을 높입니다.
 */
export function DashboardBottomNav() {
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
  const tenant = searchParams.get("tenant")?.trim() ?? null;
  const tenantQs = tenant ? `?tenant=${encodeURIComponent(tenant)}` : "";
  const AvatarIcon = subjectAvatars[kind];

  const home = isDashboardHome(pathname);
  const pets = isDashboardPets(pathname);
  const scans = isDashboardScans(pathname);
  const geofences = isDashboardGeofences(pathname);

  const close = () => {
    setLeftOpen(false);
    setRightOpen(false);
  };

  useEffect(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, [pathname, searchParams]);

  const bottomClass =
    "pointer-events-auto fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-1/2 z-50 -translate-x-1/2 border border-white/20 bg-slate-900/85 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md supports-[backdrop-filter]:bg-slate-900/75";

  return (
    <>
      {/* 데스크톱: 기존 5탭 */}
      <nav
        className={`${bottomClass} hidden h-[4.75rem] w-[min(100%,24rem)] max-w-[min(96vw,calc(100vw-1rem))] items-center justify-around rounded-[28px] px-3 md:flex`}
        aria-label="대시보드 하단 메뉴"
      >
        <a
          href={`/dashboard/${kind}${tenantQs}`}
          className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1"
          aria-current={home ? "page" : undefined}
        >
          <div className={cn(dashboardBottomIconWrap(home))}>
            <Home className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
          </div>
          <span className={dashboardBottomLabelClass(home)}>홈</span>
        </a>

        <a
          href={`/dashboard/${kind}/pets${tenantQs}`}
          className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1"
          aria-current={pets ? "page" : undefined}
        >
          <div className={cn(dashboardBottomIconWrap(pets))}>
            <AvatarIcon className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
          </div>
          <span className={dashboardBottomLabelClass(pets)}>관리</span>
        </a>

        <a
          href={`/dashboard/${kind}/scans${tenantQs}`}
          className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1"
          aria-current={scans ? "page" : undefined}
        >
          <div className={cn(dashboardBottomIconWrap(scans))}>
            <History className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
          </div>
          <span className={dashboardBottomLabelClass(scans)}>스캔</span>
        </a>

        <a
          href={`/dashboard/${kind}/geofences${tenantQs}`}
          className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1"
          aria-current={geofences ? "page" : undefined}
        >
          <div className={cn(dashboardBottomIconWrap(geofences))}>
            <MapPin className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
          </div>
          <span className={dashboardBottomLabelClass(geofences)}>안심</span>
        </a>

        <a href="/logout" className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1">
          <div className="p-2 transition-all active:scale-90 rounded-2xl text-slate-400 group-hover:text-rose-400">
            <LogOut className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
          </div>
          <span className="text-[10px] font-black tracking-wide text-slate-500 group-hover:text-rose-300 min-[400px]:text-xs">
            나가기
          </span>
        </a>
      </nav>

      {/* 모바일: 좌·홈·우 */}
      <nav
        className={`${bottomClass} flex h-[4.25rem] w-[min(100%,22rem)] max-w-[min(96vw,calc(100vw-1rem))] items-center gap-2 rounded-[28px] px-2 md:hidden`}
        aria-label="대시보드 하단 메뉴"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-2xl text-slate-300 hover:bg-white/10 hover:text-white"
          aria-expanded={leftOpen}
          aria-label="관리·스캔 메뉴 열기"
          onClick={() => {
            setRightOpen(false);
            setLeftOpen(true);
          }}
        >
          <PanelLeft className="size-6" aria-hidden />
        </Button>

        <a
          href={`/dashboard/${kind}${tenantQs}`}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-white"
          aria-current={home ? "page" : undefined}
        >
          <div className={cn(dashboardBottomIconWrap(home))}>
            <Home className="h-6 w-6" aria-hidden />
          </div>
          <span className={cn(dashboardBottomLabelClass(home), "text-[11px] min-[400px]:text-xs")}>홈</span>
        </a>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-2xl text-slate-300 hover:bg-white/10 hover:text-white"
          aria-expanded={rightOpen}
          aria-label="안심 구역·나가기 열기"
          onClick={() => {
            setLeftOpen(false);
            setRightOpen(true);
          }}
        >
          <PanelRight className="size-6" aria-hidden />
        </Button>
      </nav>

      <DashboardNavDrawer open={leftOpen} side="left" title="관리·기록" onClose={close}>
        <nav className="flex flex-col gap-1" aria-label="관리 및 스캔">
          <a href={`/dashboard/${kind}/pets${tenantQs}`} onClick={close} className={bottomDrawerLink(pets)} aria-current={pets ? "page" : undefined}>
            <AvatarIcon className="size-5 shrink-0 text-teal-600" aria-hidden />
            관리 대상
          </a>
          <a href={`/dashboard/${kind}/scans${tenantQs}`} onClick={close} className={bottomDrawerLink(scans)} aria-current={scans ? "page" : undefined}>
            <History className="size-5 shrink-0 text-teal-600" aria-hidden />
            스캔 기록
          </a>
        </nav>
      </DashboardNavDrawer>

      <DashboardNavDrawer open={rightOpen} side="right" title="안심·종료" onClose={close}>
        <nav className="flex flex-col gap-1" aria-label="안심 구역 및 로그아웃">
          <a
            href={`/dashboard/${kind}/geofences${tenantQs}`}
            onClick={close}
            className={bottomDrawerLink(geofences)}
            aria-current={geofences ? "page" : undefined}
          >
            <MapPin className="size-5 shrink-0 text-teal-600" aria-hidden />
            안심 구역
          </a>
          <a href="/logout" onClick={close} className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black text-rose-600 hover:bg-rose-50">
            <LogOut className="size-5 shrink-0" aria-hidden />
            로그아웃
          </a>
        </nav>
      </DashboardNavDrawer>
    </>
  );
}
