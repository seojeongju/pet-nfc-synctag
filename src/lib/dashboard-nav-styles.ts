import { cn } from "@/lib/utils";

export const dashboardTopNavLinkBase =
  "inline-flex min-h-9 min-w-0 shrink-0 items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700 sm:px-3";

export const dashboardTopNavLinkActive =
  "bg-teal-50 text-teal-800 ring-1 ring-teal-100/90 shadow-sm";

export function dashboardTopNavLinkClass(active: boolean) {
  return cn(dashboardTopNavLinkBase, active && dashboardTopNavLinkActive);
}

export function dashboardBottomIconWrap(active: boolean) {
  return cn(
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl p-0 transition-all active:scale-90 min-[400px]:h-12 min-[400px]:w-12",
    active ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25" : "text-slate-400 group-hover:text-white"
  );
}

export function dashboardBottomLabelClass(active: boolean) {
  return cn(
    "text-[10px] font-black tracking-wide min-[400px]:text-xs",
    active ? "text-teal-300" : "text-slate-500 group-hover:text-slate-300"
  );
}
