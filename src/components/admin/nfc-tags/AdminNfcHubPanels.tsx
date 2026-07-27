import Link from "next/link";
import {
  ListPlus,
  Smartphone,
  Database,
  History,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: "1", label: "등록", href: "/admin/nfc-tags/register" },
  { n: "2", label: "기록", href: "/admin/nfc-tags/write-url" },
  { n: "3", label: "인벤토리", href: "/admin/nfc-tags/inventory" },
  { n: "4", label: "감사", href: "/admin/nfc-tags/history" },
] as const;

const ACTIONS = [
  {
    href: "/admin/nfc-tags/register",
    title: "태그 등록",
    icon: ListPlus,
    step: "1",
    tone: {
      border: "border-teal-200/80 hover:border-teal-400",
      bg: "bg-gradient-to-br from-teal-50 to-white",
      icon: "bg-teal-600 text-white",
      step: "bg-teal-600",
    },
  },
  {
    href: "/admin/nfc-tags/write-url",
    title: "URL 기록",
    icon: Smartphone,
    step: "2",
    tone: {
      border: "border-indigo-200/80 hover:border-indigo-400",
      bg: "bg-gradient-to-br from-indigo-50 to-white",
      icon: "bg-indigo-600 text-white",
      step: "bg-indigo-600",
    },
  },
  {
    href: "/admin/nfc-tags/inventory",
    title: "인벤토리",
    icon: Database,
    step: "3",
    tone: {
      border: "border-amber-200/80 hover:border-amber-400",
      bg: "bg-gradient-to-br from-amber-50 to-white",
      icon: "bg-amber-600 text-white",
      step: "bg-amber-600",
    },
  },
  {
    href: "/admin/nfc-tags/history",
    title: "연결·감사",
    icon: History,
    step: "4",
    tone: {
      border: "border-slate-200 hover:border-slate-400",
      bg: "bg-gradient-to-br from-slate-50 to-white",
      icon: "bg-slate-800 text-white",
      step: "bg-slate-800",
    },
  },
] as const;

/** 상단 수평 스텝 (클릭 가능) */
export function AdminNfcStepBar() {
  return (
    <nav
      aria-label="태그 운영 단계"
      className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm sm:gap-2 sm:px-4"
    >
      {STEPS.map((s, i) => (
        <span key={s.href} className="flex items-center gap-1.5 sm:gap-2">
          {i > 0 ? (
            <ChevronRight className="hidden h-3.5 w-3.5 text-slate-300 sm:block" aria-hidden />
          ) : null}
          <Link
            href={s.href}
            prefetch={false}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-700 transition hover:bg-teal-50 hover:text-teal-900"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-[10px] text-white">
              {s.n}
            </span>
            {s.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

/** 큰 액션 타일 4개 — 제목·아이콘·단계만 */
export function AdminNfcQuickLinkGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {ACTIONS.map(({ href, title, icon: Icon, step, tone }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          className={cn(
            "group relative flex min-h-[7.5rem] flex-col justify-between overflow-hidden rounded-3xl border p-4 shadow-sm transition-all active:scale-[0.98] sm:min-h-[8.5rem] sm:p-5",
            "hover:-translate-y-0.5 hover:shadow-lg",
            tone.border,
            tone.bg
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm sm:h-12 sm:w-12",
                tone.icon
              )}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            </span>
            <span
              className={cn(
                "flex h-6 min-w-[1.5rem] items-center justify-center rounded-lg px-1.5 text-[11px] font-black text-white",
                tone.step
              )}
            >
              {step}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-black leading-tight text-slate-900 sm:text-lg">{title}</h2>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600"
              aria-hidden
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

/** @deprecated 허브에서 스텝바·타일로 대체. 호환용 export 유지 */
export function AdminNfcWorkflowColumn() {
  return null;
}

/** @deprecated 설명 콜아웃 제거 — 도움말 다이얼로그 사용 */
export function AdminNfcHelpCallout() {
  return null;
}
