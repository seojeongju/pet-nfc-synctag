"use client";

import { useState } from "react";
import { Building2, Layers, MapPin, Nfc, Phone, Sparkles, TrainFront } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createWayfinderSpotForm } from "@/app/actions/wayfinder-spots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { WfIconBadge } from "@/components/wayfinder/wayfinder-dashboard-ui";

const PRESETS: { icon: LucideIcon; label: string }[] = [
  { icon: Building2, label: "안내 데스크" },
  { icon: Layers, label: "엘리베이터 앞" },
  { icon: TrainFront, label: "역무실·개찰구" },
  { icon: MapPin, label: "출구·광장" },
];

type Props = {
  tenantId: string | null;
  /** 등록 전용 화면(register=1) — 더 크고 단순한 레이아웃 */
  focused?: boolean;
  className?: string;
};

export function WayfinderSpotQuickRegister({ tenantId, focused = false, className }: Props) {
  const [title, setTitle] = useState("");

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px] border shadow-lg",
        focused ? "border-indigo-200 bg-gradient-to-b from-indigo-50/90 to-white" : "border-indigo-100 bg-white",
        className
      )}
      aria-labelledby="wf-quick-register-heading"
    >
      <div className={cn("flex items-center gap-3 px-4 py-4", focused && "border-b border-indigo-100/80")}>
        <WfIconBadge icon={Nfc} tone="violet" size={focused ? "lg" : "md"} soft />
        <div className="min-w-0 flex-1">
          <h2 id="wf-quick-register-heading" className="text-base font-black text-slate-900 sm:text-lg">
            {focused ? "NFC·QR 안내 지점 만들기" : "지점 추가"}
          </h2>
          <p className="text-xs font-semibold text-slate-600">
            {focused ? "이름만 넣으면 바로 사용할 수 있어요" : "이름만 입력해도 됩니다"}
          </p>
        </div>
      </div>

      <form action={createWayfinderSpotForm} className="space-y-4 px-4 pb-5 pt-1 sm:px-5">
        {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
        <input type="hidden" name="is_published" value="1" />

        <div className="space-y-2">
          <Label htmlFor="wf-quick-title" className="sr-only">
            지점 이름
          </Label>
          <div className="relative">
            <Building2
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400"
              aria-hidden
            />
            <Input
              id="wf-quick-title"
              name="title"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 본관 1층 안내 데스크"
              className={cn(
                "rounded-2xl border-indigo-100 bg-white pl-12 font-semibold shadow-sm",
                focused ? "h-14 text-base" : "h-12 text-sm"
              )}
              autoFocus={focused}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="자주 쓰는 이름">
          {PRESETS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setTitle(label)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-black transition active:scale-[0.98]",
                title === label
                  ? "border-indigo-300 bg-indigo-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <details className="rounded-2xl border border-slate-100 bg-slate-50/80">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-center text-[11px] font-bold text-slate-500 [&::-webkit-details-marker]:hidden">
            연락처·한 줄 안내 (선택)
          </summary>
          <div className="space-y-3 border-t border-slate-100 p-3">
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-500" aria-hidden />
              <Input
                name="contact_phone"
                type="tel"
                inputMode="tel"
                maxLength={40}
                placeholder="전화번호 (선택)"
                className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm"
              />
            </div>
            <Input
              name="summary"
              maxLength={2000}
              placeholder="한 줄 안내 (선택)"
              className="h-11 rounded-xl border-slate-200 bg-white text-sm"
            />
          </div>
        </details>

        <Button
          type="submit"
          className={cn(
            "w-full gap-2 rounded-2xl bg-indigo-600 font-black text-white shadow-md hover:bg-indigo-700",
            focused ? "h-14 text-base" : "h-12 text-sm"
          )}
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          만들고 바로 쓰기
        </Button>

        <p className="text-center text-[10px] font-semibold leading-snug text-slate-400">
          주소·위치는 자동 설정 · 만든 뒤 NFC에 연결하세요
        </p>
      </form>
    </section>
  );
}
