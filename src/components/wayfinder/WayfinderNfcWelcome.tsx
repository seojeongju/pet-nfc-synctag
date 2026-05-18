import { MapPin, Nfc, Navigation2, TrainFront } from "lucide-react";
import { linkuCompanionMenuTitle } from "@/lib/wayfinder/copy";

const STEPS = [
  { icon: Nfc, label: "태그 인식", color: "bg-emerald-600" },
  { icon: MapPin, label: "근처 역 찾기", color: "bg-teal-600" },
  { icon: Navigation2, label: "길찾기 안내", color: "bg-indigo-600" },
] as const;

export function WayfinderNfcWelcome() {
  return (
    <section
      className="relative overflow-hidden rounded-[24px] border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-indigo-50/80 shadow-lg shadow-emerald-100/40"
      aria-label="NFC 태그 인식"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/15 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-indigo-400/10 blur-2xl"
        aria-hidden
      />

      <div className="relative px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
        <div className="mb-4 flex justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-white/90 px-3 py-1 text-[10px] font-black tracking-wider text-emerald-800 shadow-sm">
            <TrainFront className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            {linkuCompanionMenuTitle}
          </span>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="relative shrink-0">
            <span
              className="absolute inset-0 scale-110 rounded-[28px] bg-emerald-400/25 animate-pulse motion-reduce:animate-none"
              aria-hidden
            />
            <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/35 ring-4 ring-white">
              <Nfc className="h-9 w-9" strokeWidth={2.25} aria-hidden />
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <h2 className="text-xl font-black leading-tight tracking-tight text-slate-900 sm:text-2xl">
              태그가 인식되었습니다
            </h2>
            <p className="text-sm font-semibold leading-relaxed text-slate-600">
              지금 위치에서 <strong className="text-slate-800">가장 가까운 지하철역</strong>을 찾아 드립니다.
              아래에서 역을 고른 뒤 카카오맵으로 이동하세요.
            </p>
          </div>
        </div>

        <ol
          className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-emerald-100/90 bg-white/80 p-2.5 shadow-inner sm:gap-3 sm:p-3"
          aria-label="이용 순서"
        >
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.label} className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm ${step.color}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-[10px] font-black leading-tight text-slate-700 sm:text-[11px]">
                  <span className="sr-only">{index + 1}단계 </span>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
