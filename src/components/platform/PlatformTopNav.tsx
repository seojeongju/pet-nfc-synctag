import Link from "next/link";
import { BookOpen, Home, LayoutDashboard, Nfc, PenTool, ShieldCheck } from "lucide-react";
import { LINKU_HOME_PATH } from "@/lib/platform/services";

/**
 * 플랫폼 영역(/, /services, /studio) 상단 바.
 * 휴대폰은 Link-U `FlowTopNav`와 같은 앱형 바, PC(lg 이상)는 로고 + 가로 메뉴.
 */
export function PlatformTopNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const accountHref = isLoggedIn ? "/hub" : `/login?callbackUrl=${encodeURIComponent("/hub")}`;
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
      {/* 휴대폰 */}
      <div className="mx-auto flex min-h-12 w-full max-w-screen-sm items-center justify-between gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 min-[430px]:px-5 lg:hidden">
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
            href={accountHref}
            prefetch={false}
            className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 font-black text-white hover:bg-slate-800"
          >
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-teal-300" aria-hidden />
            {isLoggedIn ? "허브" : "로그인"}
          </Link>
        </nav>
      </div>

      {/* PC */}
      <div className="mx-auto hidden h-[72px] w-full max-w-6xl items-center justify-between gap-6 px-8 lg:flex">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Link-U 홈">
          <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-teal-500 shadow-lg shadow-teal-500/20">
            <Nfc className="h-5 w-5 text-white" aria-hidden />
          </span>
          <span className="text-xl font-black italic leading-none tracking-tighter text-slate-900">Link-U</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-black text-slate-600" aria-label="주요 메뉴">
          <Link href="/#services" className="rounded-full px-4 py-2 hover:bg-slate-100 hover:text-slate-900">
            서비스
          </Link>
          <Link href="/studio" className="rounded-full px-4 py-2 hover:bg-slate-100 hover:text-slate-900">
            태그 제작
          </Link>
          <Link
            href={LINKU_HOME_PATH}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 hover:bg-teal-50 hover:text-teal-800"
          >
            <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden />
            Link-U 안심
          </Link>
          <Link href="/manual" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 hover:bg-slate-100 hover:text-slate-900">
            <BookOpen className="h-4 w-4 text-teal-600" aria-hidden />
            사용 설명서
          </Link>
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
