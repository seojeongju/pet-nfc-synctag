"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  Home,
  LayoutDashboard,
  Menu,
  Nfc,
  PenTool,
  ShieldCheck,
  X,
} from "lucide-react";
import { PLATFORM_PRIMARY_NAV, platformServiceNavItems } from "@/lib/platform/nav";
import { LINKU_HOME_PATH, platformServiceStatusLabel } from "@/lib/platform/services";
import { cn } from "@/lib/utils";

/**
 * 플랫폼 상단 네비 — SEO/AEO/GEO:
 * - 인덱싱 가능한 실제 경로(`/services/*`, `/studio`, `/linku`, `/manual`)를 HTML에 노출
 * - 라벨은 기능·엔티티명(NFC 태그 제작, Link-U 안심 등)
 * - SiteNavigationElement JSON-LD는 `buildWebSiteJsonLd`와 동일 소스(`lib/platform/nav`)
 */
export function PlatformTopNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const accountHref = isLoggedIn ? "/hub" : `/login?callbackUrl=${encodeURIComponent("/hub")}`;
  const services = platformServiceNavItems();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesWrapRef = useRef<HTMLDivElement>(null);
  const servicesMenuId = useId();

  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!servicesOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!servicesWrapRef.current?.contains(e.target as Node)) setServicesOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setServicesOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [servicesOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      {/* 휴대폰 바 */}
      <div className="mx-auto flex min-h-12 w-full max-w-screen-sm items-center justify-between gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 min-[430px]:px-5 lg:hidden">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-100 bg-teal-50/80 px-2.5 py-1 font-black text-teal-700 hover:bg-teal-100"
          aria-label="링크유 홈"
        >
          <Home className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Link-U
        </Link>
        <nav className="flex items-center gap-x-1" aria-label="주요 이동">
          <Link
            href="/studio"
            title="NFC 태그 제작 스튜디오"
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 font-black hover:bg-slate-100",
              isActive("/studio") ? "bg-teal-50 text-teal-800" : "text-slate-700"
            )}
          >
            <PenTool className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden />
            태그 제작
          </Link>
          <Link
            href={LINKU_HOME_PATH}
            title="Link-U 안심 보호자 연결"
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 font-black hover:bg-slate-100",
              isActive(LINKU_HOME_PATH) ? "bg-teal-50 text-teal-800" : "text-slate-700"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden />
            안심
          </Link>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            aria-expanded={mobileOpen}
            aria-controls="platform-mobile-nav"
            aria-label={mobileOpen ? "메뉴 닫기" : "전체 메뉴 열기"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
          </button>
        </nav>
      </div>

      {/* 휴대폰 전체 메뉴 — 링크는 항상 DOM에 두어 크롤·접근성 확보 */}
      <div
        id="platform-mobile-nav"
        hidden={!mobileOpen}
        className={cn("border-t border-slate-100 bg-white lg:hidden", mobileOpen ? "block" : "hidden")}
      >
        <nav className="mx-auto max-h-[min(70vh,520px)] max-w-screen-sm overflow-y-auto px-4 py-3 min-[430px]:px-5" aria-label="플랫폼 전체 메뉴">
          <p className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-teal-600">NFC 서비스</p>
          <ul className="mt-2 space-y-1">
            {services.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  title={s.description}
                  className="flex items-start justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 hover:border-teal-200 hover:bg-teal-50/50"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-black text-slate-900">{s.label}</span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-slate-500 break-keep [word-break:keep-all]">
                      {s.tagline}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-slate-500 ring-1 ring-slate-200">
                    {platformServiceStatusLabel[s.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 px-1 text-[10px] font-black uppercase tracking-[0.16em] text-teal-600">바로가기</p>
          <ul className="mt-2 space-y-1">
            {PLATFORM_PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={item.description}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[13px] font-black hover:bg-slate-50",
                    isActive(item.href) ? "bg-teal-50 text-teal-800" : "text-slate-800"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <NavIcon href={item.href} />
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={accountHref}
                prefetch={false}
                className="mt-1 flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-3 text-[13px] font-black text-white"
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4 text-teal-300" aria-hidden />
                {isLoggedIn ? "내 허브" : "로그인"}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* PC */}
      <div className="mx-auto hidden h-[72px] w-full max-w-6xl items-center justify-between gap-6 px-8 lg:flex">
        <Link href="/" className="flex items-center gap-2.5" aria-label="링크유 Link-U 홈 — NFC 통합 플랫폼">
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-teal-500 shadow-lg shadow-teal-500/20">
            <Nfc className="h-5 w-5 text-white" aria-hidden />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-xl font-black italic tracking-tighter text-slate-900">Link-U</span>
            <span className="mt-0.5 text-[10px] font-bold tracking-wide text-slate-400">NFC 통합 플랫폼</span>
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 text-sm font-black text-slate-600" aria-label="주요 메뉴">
          <div ref={servicesWrapRef} className="relative">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-4 py-2 hover:bg-slate-100 hover:text-slate-900",
                (servicesOpen || pathname.startsWith("/services/")) && "bg-teal-50 text-teal-800"
              )}
              aria-expanded={servicesOpen}
              aria-controls={servicesMenuId}
              aria-haspopup="true"
              onClick={() => setServicesOpen((v) => !v)}
            >
              NFC 서비스
              <ChevronDown className={cn("h-4 w-4 transition", servicesOpen && "rotate-180")} aria-hidden />
            </button>
            <div
              id={servicesMenuId}
              hidden={!servicesOpen}
              className={cn(
                "absolute left-0 top-full z-50 mt-2 w-[360px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.12)]",
                servicesOpen ? "block" : "hidden"
              )}
              role="menu"
              aria-label="NFC 서비스 목록"
            >
              <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-teal-600">서비스별 안내</p>
              <ul className="max-h-[420px] space-y-0.5 overflow-y-auto">
                {services.map((s) => (
                  <li key={s.href} role="none">
                    <Link
                      href={s.href}
                      role="menuitem"
                      title={s.description}
                      className="flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 hover:bg-teal-50"
                      onClick={() => setServicesOpen(false)}
                    >
                      <span className="min-w-0">
                        <span className="block text-[13px] font-black text-slate-900">{s.label}</span>
                        <span className="mt-0.5 block text-[11px] font-semibold text-slate-500 break-keep [word-break:keep-all]">
                          {s.tagline}
                        </span>
                      </span>
                      <span className="shrink-0 text-[9px] font-black text-slate-400">{platformServiceStatusLabel[s.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/#services"
                className="mt-1 flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[12px] font-black text-teal-700 hover:bg-teal-50"
                onClick={() => setServicesOpen(false)}
              >
                서비스 한눈에 보기
              </Link>
            </div>
          </div>

          {PLATFORM_PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.description}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 hover:bg-slate-100 hover:text-slate-900",
                isActive(item.href) && "bg-teal-50 text-teal-800",
                item.href === LINKU_HOME_PATH && "hover:bg-teal-50 hover:text-teal-800"
              )}
            >
              <NavIcon href={item.href} className="h-4 w-4 text-teal-600" />
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={accountHref}
          prefetch={false}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-teal-600 px-6 text-sm font-black text-white shadow-sm transition hover:bg-teal-700"
        >
          <LayoutDashboard className="h-4 w-4" aria-hidden />
          {isLoggedIn ? "내 허브" : "로그인"}
        </Link>
      </div>

    </header>
  );
}

function NavIcon({ href, className }: { href: string; className?: string }) {
  const cls = cn("h-3.5 w-3.5 shrink-0 text-teal-600", className);
  if (href.startsWith("/studio")) return <PenTool className={cls} aria-hidden />;
  if (href.includes("linku") || href === LINKU_HOME_PATH) return <ShieldCheck className={cls} aria-hidden />;
  if (href.startsWith("/manual")) return <BookOpen className={cls} aria-hidden />;
  if (href.includes("faq")) return <CircleHelp className={cls} aria-hidden />;
  return <Nfc className={cls} aria-hidden />;
}
