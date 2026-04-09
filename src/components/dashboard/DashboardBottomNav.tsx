"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Baby, Briefcase, Gem, History, Home, LogOut, MapPin, PawPrint, UserRound } from "lucide-react";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import { cn } from "@/lib/utils";
import { dashboardBottomIconWrap, dashboardBottomLabelClass } from "@/lib/dashboard-nav-styles";
import {
  isDashboardGeofences,
  isDashboardHome,
  isDashboardPets,
  isDashboardScans,
} from "@/lib/dashboard-nav-active";

const subjectAvatars: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

/**
 * 대시보드 하단 메뉴. Cloudflare 등 환경에서 RSC 클라이언트 네비 시 세션 쿠키가 누락되는 경우를 피하려고
 * 보호자 구간 링크는 전체 문서 이동(<a>)으로 처리합니다.
 */
export function DashboardBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const kind = parseSubjectKind(searchParams.get("kind"));
  const tenant = searchParams.get("tenant")?.trim() ?? "";
  const qs = new URLSearchParams({ kind });
  if (tenant) qs.set("tenant", tenant);
  const q = `?${qs.toString()}`;
  const AvatarIcon = subjectAvatars[kind];

  const home = isDashboardHome(pathname);
  const pets = isDashboardPets(pathname);
  const scans = isDashboardScans(pathname);
  const geofences = isDashboardGeofences(pathname);

  return (
    <nav
      className="pointer-events-auto fixed bottom-4 left-1/2 z-50 flex h-[4.25rem] w-[min(100%,24rem)] max-w-[96vw] -translate-x-1/2 items-center justify-around rounded-[28px] border border-white/20 bg-slate-900/85 px-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md supports-[backdrop-filter]:bg-slate-900/75 min-[400px]:px-3"
      aria-label="대시보드 하단 메뉴"
    >
      <a
        href={`/dashboard${q}`}
        className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1"
        aria-current={home ? "page" : undefined}
      >
        <div className={cn(dashboardBottomIconWrap(home))}>
          <Home className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
        </div>
        <span className={dashboardBottomLabelClass(home)}>홈</span>
      </a>

      <a
        href={`/dashboard/pets${q}`}
        className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1"
        aria-current={pets ? "page" : undefined}
      >
        <div className={cn(dashboardBottomIconWrap(pets))}>
          <AvatarIcon className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
        </div>
        <span className={dashboardBottomLabelClass(pets)}>관리</span>
      </a>

      <a
        href={`/dashboard/scans${q}`}
        className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1"
        aria-current={scans ? "page" : undefined}
      >
        <div className={cn(dashboardBottomIconWrap(scans))}>
          <History className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
        </div>
        <span className={dashboardBottomLabelClass(scans)}>스캔</span>
      </a>

      <a
        href={`/dashboard/geofences${q}`}
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
        <span className="text-[8px] font-black tracking-wide text-slate-500 group-hover:text-rose-300 min-[400px]:text-[9px]">
          나가기
        </span>
      </a>
    </nav>
  );
}
