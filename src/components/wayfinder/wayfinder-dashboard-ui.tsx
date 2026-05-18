import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toneStyles = {
  indigo: "bg-indigo-600 text-white",
  violet: "bg-violet-600 text-white",
  teal: "bg-teal-600 text-white",
  slate: "bg-slate-700 text-white",
  amber: "bg-amber-500 text-white",
  rose: "bg-rose-500 text-white",
  emerald: "bg-emerald-600 text-white",
  sky: "bg-sky-600 text-white",
} as const;

const toneSoftStyles = {
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
  violet: "border-violet-100 bg-violet-50 text-violet-700",
  teal: "border-teal-100 bg-teal-50 text-teal-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  amber: "border-amber-100 bg-amber-50 text-amber-800",
  rose: "border-rose-100 bg-rose-50 text-rose-800",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
  sky: "border-sky-100 bg-sky-50 text-sky-800",
} as const;

export type WfTone = keyof typeof toneStyles;

export function WfIconBadge({
  icon: Icon,
  tone = "indigo",
  size = "md",
  soft = false,
  className,
}: {
  icon: LucideIcon;
  tone?: WfTone;
  size?: "sm" | "md" | "lg";
  soft?: boolean;
  className?: string;
}) {
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 rounded-xl [&_svg]:h-3.5 [&_svg]:w-3.5"
      : size === "lg"
        ? "h-12 w-12 rounded-2xl [&_svg]:h-6 [&_svg]:w-6"
        : "h-10 w-10 rounded-xl [&_svg]:h-5 [&_svg]:w-5";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border shadow-sm",
        sizeClass,
        soft ? toneSoftStyles[tone] : toneStyles[tone],
        className
      )}
      aria-hidden
    >
      <Icon />
    </span>
  );
}

export function WfAlertBanner({
  variant = "info",
  icon: Icon,
  title,
  children,
  className,
  compact,
}: {
  variant?: "info" | "warning" | "error" | "success";
  icon: LucideIcon;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** true면 아이콘 + 한 줄(또는 title만) */
  compact?: boolean;
}) {
  const styles = {
    info: "border-indigo-100 bg-indigo-50/90 text-indigo-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    error: "border-rose-100 bg-rose-50 text-rose-900",
    success: "border-emerald-100 bg-emerald-50 text-emerald-950",
  } as const;
  const iconTone: WfTone =
    variant === "warning" ? "amber" : variant === "error" ? "rose" : variant === "success" ? "emerald" : "indigo";
  if (compact) {
    return (
      <div
        className={cn("flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 shadow-sm", styles[variant], className)}
        role="alert"
      >
        <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        <p className="min-w-0 text-xs font-bold leading-snug">
          {title ? <span className="font-black">{title}. </span> : null}
          <span className="font-semibold opacity-95">{children}</span>
        </p>
      </div>
    );
  }
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4 shadow-sm", styles[variant], className)} role="alert">
      <WfIconBadge icon={Icon} tone={iconTone} size="md" soft />
      <div className="min-w-0 space-y-1">
        {title ? <p className="text-sm font-black leading-snug">{title}</p> : null}
        <div className="text-sm font-semibold leading-relaxed opacity-95">{children}</div>
      </div>
    </div>
  );
}

export function WfStatChip({
  icon: Icon,
  label,
  value,
  tone = "indigo",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: WfTone;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 shadow-sm",
        toneSoftStyles[tone]
      )}
      title={`${label}: ${value}`}
    >
      <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
      <p className="truncate text-sm font-black leading-none">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}

export function WfFlowTile({
  icon: Icon,
  caption,
  tone = "indigo",
  className,
}: {
  icon: LucideIcon;
  caption: string;
  tone?: WfTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center shadow-sm",
        toneSoftStyles[tone],
        className
      )}
    >
      <WfIconBadge icon={Icon} tone={tone} size="sm" soft />
      <span className="text-[10px] font-black leading-tight text-slate-800">{caption}</span>
    </div>
  );
}

export function WfIconNavButton({
  href,
  icon: Icon,
  label,
  tone = "slate",
  external,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  tone?: WfTone;
  external?: boolean;
}) {
  const cls = cn(
    "inline-flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm transition active:scale-[0.97]",
    toneSoftStyles[tone],
    "hover:brightness-95"
  );
  const child = <Icon className="h-5 w-5" aria-hidden />;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={label} title={label}>
        {child}
      </a>
    );
  }
  return (
    <a href={href} className={cls} aria-label={label} title={label}>
      {child}
    </a>
  );
}
