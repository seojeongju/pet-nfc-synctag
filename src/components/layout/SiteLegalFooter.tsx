"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 로그인·동의·OAuth 직후 등에서는 폼 내 링크로 충분하므로 전역 푸터를 숨깁니다.
 */
function shouldHideLegalFooter(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname === "/consent" || pathname.startsWith("/consent/")) return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return true;
  return false;
}

/**
 * 앱 전역 하단: 법률 문서 링크. 루트 레이아웃에서 사용합니다.
 */
export function SiteLegalFooter() {
  const pathname = usePathname() ?? "";
  if (shouldHideLegalFooter(pathname)) {
    return null;
  }

  return (
    <footer
      className="mt-auto border-t border-slate-200/90 bg-slate-50/90 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-3.5 sm:py-4">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-bold sm:text-xs"
          aria-label="법률 및 약관"
        >
          <Link
            href="/legal/privacy"
            className="text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-teal-700 hover:decoration-teal-400"
          >
            개인정보처리방침
          </Link>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <Link
            href="/legal/terms"
            className="text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-teal-700 hover:decoration-teal-400"
          >
            이용약관
          </Link>
        </nav>
      </div>
    </footer>
  );
}
