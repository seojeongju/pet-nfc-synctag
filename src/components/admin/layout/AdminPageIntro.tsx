import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminCrumb = { label: string; href?: string };

export function AdminPageIntro({
  title,
  subtitle,
  crumbs,
  className,
  aside,
}: {
  title: string;
  subtitle?: string;
  crumbs?: AdminCrumb[];
  className?: string;
  /** 제목 옆 도움말·버튼 등 */
  aside?: ReactNode;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {crumbs && crumbs.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400" aria-label="breadcrumb">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" aria-hidden />}
              {c.href ? (
                <Link href={c.href} prefetch={false} className="max-w-[12rem] truncate text-teal-600 hover:text-teal-800 sm:max-w-none">
                  {c.label}
                </Link>
              ) : (
                <span className="max-w-[14rem] truncate text-slate-500 sm:max-w-none">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">{title}</h1>
          {subtitle ? <p className="max-w-3xl text-sm font-bold leading-relaxed text-slate-500">{subtitle}</p> : null}
        </div>
        {aside ? <div className="shrink-0 pt-0.5">{aside}</div> : null}
      </div>
    </div>
  );
}
