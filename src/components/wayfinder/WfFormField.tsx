"use client";

import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { WfIconBadge, type WfTone } from "@/components/wayfinder/wayfinder-dashboard-ui";

type Props = {
  id: string;
  label: string;
  icon: LucideIcon;
  tone?: WfTone;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

export function WfFormField({ id, label, icon, tone = "indigo", hint, children, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <WfIconBadge icon={icon} tone={tone} size="sm" soft />
        <Label htmlFor={id} className="text-sm font-black text-slate-800">
          {label}
        </Label>
      </div>
      {children}
      {hint ? <p className="pl-10 text-[10px] font-semibold leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}
