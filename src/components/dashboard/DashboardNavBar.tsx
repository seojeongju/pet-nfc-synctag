"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PawPrint, LayoutGrid, MapPin } from "lucide-react";
import { parseSubjectKind } from "@/lib/subject-kind";
import { FlowTopNavContent, type FlowTopNavSession } from "@/components/layout/FlowTopNav";

type DashboardNavBarProps = {
  session: FlowTopNavSession;
  isAdmin: boolean;
};

export function DashboardNavBar({ session, isAdmin }: DashboardNavBarProps) {
  const searchParams = useSearchParams();
  const kind = parseSubjectKind(searchParams.get("kind"));
  const tenantRaw = searchParams.get("tenant");
  const tenant = typeof tenantRaw === "string" && tenantRaw.trim() ? tenantRaw.trim() : null;
  const qs = new URLSearchParams({ kind });
  if (tenant) qs.set("tenant", tenant);
  const q = `?${qs.toString()}`;

  const linkClass =
    "whitespace-nowrap text-xs font-bold hover:text-primary md:text-sm md:font-medium";

  const dashLinks = (
    <>
      <Link href={`/dashboard${q}`} className={linkClass}>
        대시보드
      </Link>
      <Link href={`/dashboard/pets${q}`} className={linkClass}>
        관리 대상
      </Link>
      <Link href={`/dashboard/scans${q}`} className={linkClass}>
        스캔 기록
      </Link>
      <Link href={`/dashboard/geofences${q}`} className={`inline-flex items-center gap-1 ${linkClass}`}>
        <MapPin className="w-3.5 h-3.5 shrink-0 md:w-4 md:h-4" />
        안심 구역
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
      <FlowTopNavContent variant="dashboard" session={session} isAdmin={isAdmin} />
      <div className="border-t border-slate-100">
        <div className="container flex max-w-5xl flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center md:justify-between md:py-2">
          <div className="flex min-w-0 items-center justify-between gap-3 md:justify-start">
            <Link href="/hub" className="flex min-w-0 items-center gap-2 font-bold text-xl text-primary hover:opacity-90">
              <PawPrint className="h-6 w-6 shrink-0" />
              <span className="truncate">링크유 Link-U</span>
            </Link>
            {session?.user?.name ? (
              <span className="truncate text-xs font-bold text-slate-400 md:hidden">{session.user.name}</span>
            ) : null}
          </div>

          <nav className="hidden md:flex md:flex-wrap md:items-center md:gap-6" aria-label="대시보드 메뉴">
            <Link
              href={`/hub`}
              className="text-sm font-medium text-slate-500 hover:text-primary inline-flex items-center gap-1"
            >
              <LayoutGrid className="w-4 h-4" />
              모드
            </Link>
            {dashLinks}
          </nav>

          <nav
            className="-mx-1 flex gap-3 overflow-x-auto pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="대시보드 메뉴"
          >
            <Link href="/hub" className="shrink-0 text-xs font-bold text-slate-500">
              모드
            </Link>
            <div className="flex gap-3 text-slate-700">{dashLinks}</div>
          </nav>
        </div>
      </div>
    </header>
  );
}
