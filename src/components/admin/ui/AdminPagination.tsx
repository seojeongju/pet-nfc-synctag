import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

function visiblePageItems(
  current: number,
  totalPages: number,
  /** 이 개수 이하면 1…N 전부 표시(줄임 없음) */
  maxAllVisible = 9
): (number | "gap")[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= maxAllVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const out: (number | "gap")[] = [];
  const addPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    const last = out[out.length - 1];
    if (typeof last === "number" && p - last > 1) out.push("gap");
    if (out[out.length - 1] !== p) out.push(p);
  };
  addPage(1);
  for (let p = current - 1; p <= current + 1; p++) addPage(p);
  addPage(totalPages);
  return out;
}

const navBtn = cn(
  "inline-flex min-h-10 min-w-10 items-center justify-center gap-0.5 rounded-2xl border border-slate-200 bg-white px-2 text-xs font-black text-slate-800 touch-manipulation transition hover:bg-slate-50",
  "aria-disabled:opacity-40 aria-disabled:pointer-events-none"
);

type AdminPaginationProps = {
  "aria-label": string;
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
};

/**
 * URL 기반 페이지 이동(서버 RSC). totalPages=1이어도 1/1 요약에 사용 가능.
 */
export function AdminPagination({
  "aria-label": ariaLabel,
  currentPage,
  totalPages,
  buildHref,
  className,
}: AdminPaginationProps) {
  const last = Math.max(1, totalPages);
  const current = Math.min(last, Math.max(1, currentPage));
  const items = visiblePageItems(current, last);

  return (
    <nav
      className={cn("flex flex-wrap items-center justify-center gap-1.5 sm:gap-2", className)}
      aria-label={ariaLabel}
    >
      <Link
        href={buildHref(1)}
        className={navBtn}
        aria-disabled={current <= 1}
        scroll={false}
        prefetch={false}
        title="첫 페이지"
      >
        <ChevronsLeft className="h-4 w-4" aria-hidden />
        <span className="sr-only sm:not-sr-only sm:inline">처음</span>
      </Link>
      <Link
        href={buildHref(current - 1)}
        className={navBtn}
        aria-disabled={current <= 1}
        scroll={false}
        prefetch={false}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        <span className="sr-only sm:not-sr-only sm:inline">이전</span>
      </Link>

      {items.map((it, i) =>
        it === "gap" ? (
          <span
            key={`g-${i}`}
            className="px-1 text-xs font-bold text-slate-400"
            aria-hidden
          >
            ···
          </span>
        ) : (
          <Link
            key={it}
            href={buildHref(it)}
            scroll={false}
            prefetch={false}
            className={cn(
              "min-h-10 min-w-10 items-center justify-center rounded-2xl border text-xs font-black tabular-nums",
              "inline-flex touch-manipulation",
              it === current
                ? "border-teal-300 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
            aria-current={it === current ? "page" : undefined}
          >
            {it}
          </Link>
        )
      )}

      <Link
        href={buildHref(current + 1)}
        className={navBtn}
        aria-disabled={current >= last}
        scroll={false}
        prefetch={false}
      >
        <span className="sr-only sm:not-sr-only sm:inline">다음</span>
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
      <Link
        href={buildHref(last)}
        className={navBtn}
        aria-disabled={current >= last}
        scroll={false}
        prefetch={false}
        title="마지막 페이지"
      >
        <span className="sr-only sm:not-sr-only sm:inline">끝</span>
        <ChevronsRight className="h-4 w-4" aria-hidden />
      </Link>
    </nav>
  );
}
