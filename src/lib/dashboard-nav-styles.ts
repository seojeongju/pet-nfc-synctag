import { cn } from "@/lib/utils";

export const dashboardTopNavLinkBase =
  "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700 md:text-sm";

export const dashboardTopNavLinkActive =
  "bg-teal-50 text-teal-800 ring-1 ring-teal-100/90 shadow-sm";

export function dashboardTopNavLinkClass(active: boolean) {
  return cn(dashboardTopNavLinkBase, active && dashboardTopNavLinkActive);
}

export function dashboardBottomIconWrap(active: boolean) {
  return cn(
    "p-2 transition-all active:scale-90 rounded-2xl",
    active ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25" : "text-slate-400 group-hover:text-white"
  );
}

export function dashboardBottomLabelClass(active: boolean) {
  return cn(
    "text-[8px] font-black tracking-wide min-[400px]:text-[9px]",
    active ? "text-teal-300" : "text-slate-500 group-hover:text-slate-300"
  );
}
