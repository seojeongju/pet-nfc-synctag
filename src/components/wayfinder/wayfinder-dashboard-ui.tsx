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

export function WfFeatureRow({
  icon: Icon,
  tone = "indigo",
  label,
  title,
  className,
}: {
  icon: LucideIcon;
  tone?: WfTone;
  label: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <WfIconBadge icon={Icon} tone={tone} size="md" />
      <div className="min-w-0 pt-0.5">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-bold leading-snug text-slate-800">{title}</p>
      </div>
    </div>
  );
}

export function WfAlertBanner({
  variant = "info",
  icon: Icon,
  title,
  children,
  className,
}: {
  variant?: "info" | "warning" | "error" | "success";
  icon: LucideIcon;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-indigo-100 bg-indigo-50/90 text-indigo-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    error: "border-rose-100 bg-rose-50 text-rose-900",
    success: "border-emerald-100 bg-emerald-50 text-emerald-950",
  } as const;
  const iconTone: WfTone =
    variant === "warning" ? "amber" : variant === "error" ? "rose" : variant === "success" ? "emerald" : "indigo";
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
    <div className={cn("flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2.5 shadow-sm", toneSoftStyles[tone])}>
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide opacity-80">{label}</p>
        <p className="truncate text-sm font-black">{value}</p>
      </div>
    </div>
  );
}
