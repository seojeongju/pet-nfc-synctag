"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Baby, Briefcase, Gem, History, Home, LogOut, MapPin, PawPrint, UserRound } from "lucide-react";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import { cn } from "@/lib/utils";

const subjectAvatars: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

/**
 * 대시보드 공통 하단 고정 메뉴 (모든 /dashboard/* 에서 kind·tenant 유지).
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

  const isHome = pathname === "/dashboard";
  const isPets = pathname.startsWith("/dashboard/pets");
  const isScans = pathname.startsWith("/dashboard/scans");
  const isGeofences = pathname.startsWith("/dashboard/geofences");

  const activeWrap = (on: boolean) =>
    on ? "rounded-2xl bg-teal-500 text-white shadow-xl shadow-teal-500/20" : "rounded-2xl text-slate-400 group-hover:text-white";

  return (
    <nav
      className="pointer-events-auto fixed bottom-4 left-1/2 z-50 flex h-[4.25rem] w-[min(100%,24rem)] max-w-[96vw] -translate-x-1/2 items-center justify-around rounded-[28px] border border-white/20 bg-slate-900/85 px-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md supports-[backdrop-filter]:bg-slate-900/75 min-[400px]:px-3"
      aria-label="대시보드 하단 메뉴"
    >
      <Link
        href={`/dashboard${q}`}
        className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1"
        aria-current={isHome ? "page" : undefined}
      >
        <div className={cn("p-2 transition-all active:scale-90", activeWrap(isHome))}>
          <Home className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
        </div>
        <span className={cn("text-[8px] font-black uppercase tracking-wider min-[400px]:text-[9px]", isHome ? "text-teal-300" : "text-slate-500 group-hover:text-slate-300")}>
          홈
        </span>
      </Link>

      <Link
        href={`/dashboard/pets${q}`}
        className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1"
        aria-current={isPets ? "page" : undefined}
      >
        <div className={cn("p-2 transition-all active:scale-90", activeWrap(isPets))}>
          <AvatarIcon className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
        </div>
        <span
          className={cn(
            "text-[8px] font-black uppercase tracking-wider min-[400px]:text-[9px]",
            isPets ? "text-teal-300" : "text-slate-500 group-hover:text-slate-300"
          )}
        >
          관리
        </span>
      </Link>

      <Link
        href={`/dashboard/scans${q}`}
        className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1"
        aria-current={isScans ? "page" : undefined}
      >
        <div className={cn("p-2 transition-all active:scale-90", activeWrap(isScans))}>
          <History className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
        </div>
        <span
          className={cn(
            "text-[8px] font-black uppercase tracking-wider min-[400px]:text-[9px]",
            isScans ? "text-teal-300" : "text-slate-500 group-hover:text-slate-300"
          )}
        >
          스캔
        </span>
      </Link>

      <Link
        href={`/dashboard/geofences${q}`}
        className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1"
        aria-current={isGeofences ? "page" : undefined}
      >
        <div className={cn("p-2 transition-all active:scale-90", activeWrap(isGeofences))}>
          <MapPin className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
        </div>
        <span
          className={cn(
            "text-[8px] font-black uppercase tracking-wider min-[400px]:text-[9px]",
            isGeofences ? "text-teal-300" : "text-slate-500 group-hover:text-slate-300"
          )}
        >
          안심
        </span>
      </Link>

      <Link href="/logout" className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1">
        <div className="p-2 transition-all active:scale-90 rounded-2xl text-slate-400 group-hover:text-rose-400">
          <LogOut className="h-5 w-5 min-[400px]:h-6 min-[400px]:w-6" aria-hidden />
        </div>
        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 group-hover:text-rose-300 min-[400px]:text-[9px]">
          나가기
        </span>
      </Link>
    </nav>
  );
}
