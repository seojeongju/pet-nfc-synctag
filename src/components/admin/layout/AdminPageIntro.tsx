import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminCrumb = { label: string; href?: string };

export function AdminPageIntro({
  title,
  subtitle,
  crumbs,
  className,
}: {
  title: string;
  subtitle?: string;
  crumbs?: AdminCrumb[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {crumbs && crumbs.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400" aria-label="breadcrumb">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" aria-hidden />}
              {c.href ? (
                <Link href={c.href} prefetch={false} className="text-teal-600 hover:text-teal-800 truncate max-w-[12rem] sm:max-w-none">
                  {c.label}
                </Link>
              ) : (
                <span className="text-slate-500 truncate max-w-[14rem] sm:max-w-none">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="space-y-1.5">
        <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">{title}</h1>
        {subtitle ? <p className="max-w-3xl text-sm font-bold leading-relaxed text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}
