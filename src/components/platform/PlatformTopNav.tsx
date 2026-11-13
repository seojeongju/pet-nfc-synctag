import Link from "next/link";
import { Home, LayoutDashboard, PenTool, ShieldCheck } from "lucide-react";
import { LINKU_HOME_PATH } from "@/lib/platform/services";

/**
 * 플랫폼 영역(/, /services, /studio) 상단 바. Link-U `FlowTopNav`와 같은 스티키·블러 스타일.
 */
export function PlatformTopNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      <div className="mx-auto flex min-h-12 w-full max-w-screen-sm items-center justify-between gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 min-[430px]:px-5">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-100 bg-teal-50/80 px-2.5 py-1 font-black text-teal-700 hover:bg-teal-100"
        >
          <Home className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Link-U
        </Link>
        <nav className="flex items-center gap-x-1 min-[390px]:gap-x-2" aria-label="전역 이동">
          <Link
            href={LINKU_HOME_PATH}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-black text-slate-700 hover:bg-slate-100 min-[390px]:px-2.5"
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden />
            안심
          </Link>
          <Link
            href="/studio"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-black text-slate-700 hover:bg-slate-100 min-[390px]:px-2.5"
          >
            <PenTool className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden />
            태그 제작
          </Link>
          <Link
            href={isLoggedIn ? "/hub" : `/login?callbackUrl=${encodeURIComponent("/hub")}`}
            prefetch={false}
            className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 font-black text-white hover:bg-slate-800"
          >
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-teal-300" aria-hidden />
            {isLoggedIn ? "허브" : "로그인"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
