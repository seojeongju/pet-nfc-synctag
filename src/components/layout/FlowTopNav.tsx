"use client";

import Link from "next/link";
import { Home, LayoutGrid, LogOut, Shield, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type FlowTopNavSession = { user: { name?: string | null } } | null;

type FlowTopNavContentProps = {
  variant: "landing" | "gate" | "dashboard";
  session: FlowTopNavSession;
  isAdmin: boolean;
  currentModeLabel?: string;
  /** owner/admin 소속 조직이 있을 때만: 조직 관리(감사·멤버 등) */
  orgManageHref?: string | null;
  className?: string;
};

const maxWClass = (variant: FlowTopNavContentProps["variant"]) =>
  variant === "dashboard"
    ? "container max-w-5xl px-4"
    : "mx-auto w-full max-w-none lg:max-w-screen-sm px-4 min-[430px]:px-5";

/**
 * 상단 링크 행만 (스티키·테두리 없음). 대시보드 등에서 다른 헤더와 합칠 때 사용.
 * 대시보드 variant에서는 내부 이동이 세션을 잃지 않도록 주요 링크를 <a>로 전체 네비게이션합니다.
 */
export function FlowTopNavContent({
  variant,
  session,
  isAdmin,
  currentModeLabel,
  orgManageHref,
  className,
}: FlowTopNavContentProps) {
  const modeSelectHref =
    variant === "dashboard"
      ? "/hub"
      : variant === "landing"
        ? "/"
        : session
          ? "/hub"
          : "/";

  const useHardNav = variant === "dashboard";

  return (
    <div
      className={cn(
        "flex min-h-12 flex-wrap items-center justify-between gap-x-2.5 gap-y-2 py-2.5 text-xs font-bold text-slate-600",
        maxWClass(variant),
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {useHardNav ? (
          <a
            href={modeSelectHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-100 bg-teal-50/80 px-2 py-1 font-black text-teal-700 hover:bg-teal-100 min-[390px]:px-2.5"
          >
            <Home className="h-3.5 w-3.5 shrink-0" aria-hidden />
            모드 선택
          </a>
        ) : (
          <Link
            href={modeSelectHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-100 bg-teal-50/80 px-2 py-1 font-black text-teal-700 hover:bg-teal-100 min-[390px]:px-2.5"
          >
            <Home className="h-3.5 w-3.5 shrink-0" aria-hidden />
            모드 선택
          </Link>
        )}
        {currentModeLabel ? (
          <span className="truncate text-[10px] font-black uppercase tracking-wide text-slate-400 min-[390px]:text-[11px]">
            {currentModeLabel}
          </span>
        ) : null}
      </div>

      <nav
        className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 sm:gap-x-3"
        aria-label="전역 이동"
      >
        {session && !useHardNav ? (
          <Link
            href="/hub"
            prefetch={false}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-black text-slate-700 hover:bg-slate-100 min-[390px]:px-2.5"
          >
            <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
            허브
          </Link>
        ) : null}

        {session && orgManageHref ? (
          useHardNav ? (
            <a
              href={orgManageHref}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-black text-teal-700 hover:bg-teal-50 min-[390px]:px-2.5"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              조직 관리
            </a>
          ) : (
            <Link
              href={orgManageHref}
              prefetch={false}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-black text-teal-700 hover:bg-teal-50 min-[390px]:px-2.5"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              조직 관리
            </Link>
          )
        ) : null}

        {useHardNav ? (
          <a
            href={isAdmin ? "/admin" : "/admin/login"}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 font-black min-[390px]:px-2.5",
              isAdmin ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {isAdmin ? "관리자" : "관리자 로그인"}
          </a>
        ) : (
          <Link
            href={isAdmin ? "/admin" : "/admin/login"}
            prefetch={false}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 font-black min-[390px]:px-2.5",
              isAdmin ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {isAdmin ? "관리자" : "관리자 로그인"}
          </Link>
        )}

        {session ? (
          useHardNav ? (
            <a
              href="/logout"
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-black text-rose-600 hover:bg-rose-50 min-[390px]:px-2.5"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
              로그아웃
            </a>
          ) : (
            <Link
              href="/logout"
              prefetch={false}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-black text-rose-600 hover:bg-rose-50 min-[390px]:px-2.5"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
              로그아웃
            </Link>
          )
        ) : null}
      </nav>
    </div>
  );
}

type FlowTopNavProps = FlowTopNavContentProps & { className?: string };

/** 랜딩·모드 게이트 단독용 스티키 헤더 */
export function FlowTopNav(props: FlowTopNavProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-md",
        props.variant === "gate" && "shadow-sm",
        props.className
      )}
    >
      <FlowTopNavContent {...props} className={undefined} />
    </header>
  );
}
