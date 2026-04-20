"use client";

import { useId, useState } from "react";
import { CircleHelp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  /** 짧은 트리거 레이블(숨김 가능). 기본 아이콘만일 때 aria-label용 */
  triggerLabel?: string;
  /** true면 텍스트 없이 아이콘만 */
  iconOnly?: boolean;
  children: React.ReactNode;
  triggerClassName?: string;
};

export function AdminHelpDialog({
  title,
  triggerLabel = "도움말",
  iconOnly = false,
  children,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const labelId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide text-slate-500 shadow-sm transition-colors",
          "hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800",
          iconOnly && "px-2 py-2",
          triggerClassName
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={labelId}
      >
        <CircleHelp className={cn("h-4 w-4 shrink-0 text-teal-600", iconOnly && "h-5 w-5")} aria-hidden />
        {!iconOnly ? <span>{triggerLabel}</span> : <span className="sr-only">{triggerLabel}</span>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="max-h-[min(85vh,560px)] w-[min(100vw-2rem,28rem)] max-w-none overflow-y-auto rounded-2xl border-slate-100 p-0 sm:max-w-lg"
        >
          <DialogHeader className="border-b border-slate-100 px-5 py-4 text-left">
            <DialogTitle className="font-heading text-base font-black tracking-tight text-slate-900">{title}</DialogTitle>
          </DialogHeader>
          <div id={labelId} className="space-y-4 px-5 py-4 text-[13px] leading-relaxed text-slate-600 [&_strong]:font-black [&_strong]:text-slate-800">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
