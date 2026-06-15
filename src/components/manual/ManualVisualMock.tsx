import type { ReactNode } from "react";
import { CheckCircle2, Nfc, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MANUAL_APP_MENUS,
  MANUAL_CATEGORIES,
  type ManualInfographicStep,
} from "@/lib/manual/content";

function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[220px] overflow-hidden rounded-[22px] border-[3px] border-slate-800 bg-slate-900 p-1.5 shadow-lg",
        className
      )}
    >
      <div className="overflow-hidden rounded-[16px] bg-white">{children}</div>
    </div>
  );
}

export function ManualStepVisual({ visual }: { visual: ManualInfographicStep["visual"] }) {
  if (visual === "prep") {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/60 p-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">📦</span>
          <p className="text-[10px] font-black text-teal-900">Link-U 태그</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/60 p-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <Nfc className="h-6 w-6 text-teal-600" aria-hidden />
          </span>
          <p className="text-[10px] font-black text-teal-900">NFC 태그</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/60 p-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <Smartphone className="h-6 w-6 text-teal-600" aria-hidden />
          </span>
          <p className="text-[10px] font-black text-teal-900">NFC ON</p>
        </div>
      </div>
    );
  }

  if (visual === "app-home") {
    return (
      <PhoneFrame>
        <div className="bg-gradient-to-b from-teal-600 to-teal-700 px-3 py-2.5 text-center">
          <p className="text-[10px] font-black text-white">Link-U 홈</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-2.5">
          {MANUAL_APP_MENUS.map((menu) => (
            <div
              key={menu.label}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-lg border text-center",
                menu.highlight
                  ? "border-teal-300 bg-teal-50 text-teal-800"
                  : "border-slate-100 bg-slate-50 text-slate-600"
              )}
            >
              <span className="text-[8px] font-black leading-tight">{menu.label}</span>
            </div>
          ))}
        </div>
      </PhoneFrame>
    );
  }

  if (visual === "register") {
    return (
      <div className="space-y-3">
        <PhoneFrame>
          <div className="space-y-2 p-3">
            <div className="mx-auto h-10 w-10 rounded-full bg-amber-100 text-center text-lg leading-10">🐱</div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[9px] font-bold text-slate-500">
              이름 · 콩이
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[9px] font-bold text-slate-500">
              연락처 · 010-1234-5678
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[9px] font-bold text-slate-500">
              안내 · 알레르기 있음
            </div>
          </div>
        </PhoneFrame>
        <div className="flex flex-wrap justify-center gap-2">
          {MANUAL_CATEGORIES.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-white px-2.5 py-1 text-[10px] font-black text-teal-800 shadow-sm"
            >
              <span aria-hidden>{cat.emoji}</span>
              {cat.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PhoneFrame>
      <div className="flex flex-col items-center gap-2 bg-gradient-to-b from-teal-50 to-white px-4 py-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden />
        </span>
        <p className="text-sm font-black text-slate-900">등록 완료</p>
        <p className="text-[10px] font-semibold text-slate-500">태그 스캔 → 관리대상 연결</p>
      </div>
    </PhoneFrame>
  );
}
