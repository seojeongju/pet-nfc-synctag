"use client";

import { useCallback, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  Bus,
  Check,
  ChevronDown,
  Copy,
  Download,
  MapPin,
  Navigation2,
  Nfc,
  Route,
  Search,
  Sparkles,
  TrainFront,
} from "lucide-react";
import { WayfinderSeoulCompanionLaunchButton } from "@/components/wayfinder/WayfinderSeoulCompanionLaunchButton";
import { useWayfinderServiceNav } from "@/components/wayfinder/WayfinderServiceNavContext";
import {
  SEOUL_COMPANION_APP,
  SEOUL_COMPANION_FEATURES,
  SEOUL_COMPANION_ROLE_LEGEND,
  SEOUL_COMPANION_STEPS_MAIN,
  WAYFINDER_SERVICE_SECTION_IDS,
  type SeoulCompanionFeatureIcon,
  type SeoulCompanionStepIcon,
  seoulCompanionStepsForStation,
} from "@/lib/wayfinder/accessible-routing-links";
import { cn } from "@/lib/utils";

const FEATURE_ICONS: Record<SeoulCompanionFeatureIcon, LucideIcon> = {
  accessibility: Accessibility,
  train: TrainFront,
  bus: Bus,
};

const STEP_ICONS: Record<SeoulCompanionStepIcon, LucideIcon> = {
  download: Download,
  search: Search,
  route: Route,
};

const ROLE_ICONS = {
  linku: Nfc,
  seoul: MapPin,
  kakao: Navigation2,
} as const;

type Props = {
  variant?: "main" | "station";
  stationName?: string;
  className?: string;
};

function IconBadge({
  icon: Icon,
  label,
  className,
  iconClassName,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm",
        className
      )}
      aria-hidden
    >
      <Icon className={cn("h-5 w-5", iconClassName)} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function WayfinderSeoulCompanionPromo({
  variant = "main",
  stationName,
  className,
}: Props) {
  const { openSection, isSectionOpen } = useWayfinderServiceNav();
  const seoulOpen = isSectionOpen("seoul");
  const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "err">("idle");

  const steps =
    variant === "station" && stationName?.trim()
      ? seoulCompanionStepsForStation(stationName.trim())
      : SEOUL_COMPANION_STEPS_MAIN;

  const copyStationName = useCallback(async () => {
    const text = stationName?.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("ok");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("err");
      window.setTimeout(() => setCopyStatus("idle"), 2500);
    }
  }, [stationName]);

  const copyLabel =
    copyStatus === "ok" ? "역 이름 복사됨" : copyStatus === "err" ? "복사 실패" : "역 이름 복사";

  return (
    <section className={cn("space-y-4", className)} aria-label="맞춤서비스 이동">
      <header className="flex items-start gap-3 px-0.5">
        <IconBadge
          icon={MapPin}
          label="맞춤서비스 이동"
          className="bg-gradient-to-br from-sky-500 to-indigo-600 text-white"
        />
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-black text-slate-900 sm:text-base">
            {variant === "main" ? "맞춤서비스 이동" : "맞춤서비스 · 보행·지하철"}
          </h2>
          <p className="text-[11px] font-semibold leading-relaxed text-slate-600">
            지하철·역 시설은 링크유, <strong className="text-sky-800">맞춤 경로</strong>는 서울동행맵,
            카카오맵은 <strong className="text-slate-700">참고</strong>입니다.
          </p>
        </div>
      </header>

      <ul className="grid grid-cols-3 gap-1.5 sm:gap-2" role="list" aria-label="맞춤서비스 바로가기">
        {SEOUL_COMPANION_ROLE_LEGEND.map((role) => {
          const RoleIcon = ROLE_ICONS[role.id];
          const active = isSectionOpen(role.id);
          const tone =
            role.tone === "sky"
              ? "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-300 hover:bg-sky-100/80 focus-visible:outline-sky-500"
              : role.tone === "amber"
                ? "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 hover:bg-amber-100/80 focus-visible:outline-amber-500"
                : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100/80 focus-visible:outline-slate-500";
          const iconTone =
            role.tone === "sky"
              ? "bg-sky-600 text-white"
              : role.tone === "amber"
                ? "bg-amber-500 text-white"
                : "bg-slate-600 text-white";
          return (
            <li key={role.id} className="min-w-0">
              <button
                type="button"
                onClick={() => openSection(role.id)}
                aria-pressed={active}
                className={cn(
                  "flex h-full min-h-[4.5rem] w-full flex-col items-center justify-center gap-1 rounded-xl border p-1.5 text-center shadow-sm transition active:scale-[0.98] sm:min-h-0 sm:gap-1.5 sm:p-2",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  tone,
                  active && "ring-2 ring-offset-1",
                  active && role.tone === "sky" && "ring-sky-400",
                  active && role.tone === "slate" && "ring-slate-400",
                  active && role.tone === "amber" && "ring-amber-400"
                )}
                aria-label={`${role.label} — ${role.hint} ${active ? "접기" : "펼치기"}`}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8",
                    iconTone
                  )}
                >
                  <RoleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </span>
                <span className="text-[9px] font-black leading-tight sm:text-[10px]">{role.label}</span>
                <span className="text-[8px] font-semibold opacity-80 sm:text-[9px]">{role.hint}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div id={WAYFINDER_SERVICE_SECTION_IDS.seoul} className="scroll-mt-4">
        {!seoulOpen ? (
          <button
            type="button"
            onClick={() => openSection("seoul")}
            className="flex w-full items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50/90 p-3.5 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50 active:scale-[0.99] sm:p-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
              <MapPin className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-sky-900">{SEOUL_COMPANION_APP.name}</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-sky-800/90">
                맞춤 보행·지하철 · 탭하여 펼치기
              </span>
            </span>
            <ChevronDown className="h-5 w-5 shrink-0 text-sky-600" aria-hidden />
          </button>
        ) : null}

        {seoulOpen ? (
          <>
            <div className="overflow-hidden rounded-2xl border border-sky-300/90 bg-gradient-to-br from-sky-600 via-sky-600 to-indigo-700 p-4 text-white shadow-lg shadow-sky-200/60 sm:p-5">
              <div className="flex gap-3">
                <div className="relative shrink-0">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <MapPin className="h-7 w-7 text-white" aria-hidden />
                  </span>
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-white text-sky-700 shadow">
                    <TrainFront className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black tracking-wide backdrop-blur-sm">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    서울 이동 · 추천
                  </span>
                  <h3 className="mt-2 text-lg font-black leading-snug sm:text-xl">
                    {SEOUL_COMPANION_APP.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-sky-50/95">
                    {SEOUL_COMPANION_APP.description}
                  </p>
                </div>
              </div>

              {variant === "station" && stationName ? (
                <p className="mt-3 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm">
                  <TrainFront className="h-4 w-4 shrink-0" aria-hidden />
                  목적지: {stationName}
                </p>
              ) : null}

              <ul className="mt-3 grid gap-2 sm:grid-cols-3" aria-label="주요 기능">
                {SEOUL_COMPANION_FEATURES.map((feature) => {
                  const FeatureIcon = FEATURE_ICONS[feature.icon];
                  return (
                    <li
                      key={feature.id}
                      className="flex items-center gap-2 rounded-xl bg-white/15 px-2.5 py-2 backdrop-blur-sm"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/25">
                        <FeatureIcon className="h-4 w-4 text-white" aria-hidden />
                      </span>
                      <span className="text-[10px] font-black leading-snug text-white">
                        {feature.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <WayfinderSeoulCompanionLaunchButton className="mt-4" />
            </div>

            <ol className="mt-4 space-y-2" aria-label="서울동행맵 이용 순서">
              {steps.map((step, i) => {
                const StepIcon = STEP_ICONS[step.icon];
                return (
                  <li
                    key={step.title}
                    className="flex gap-3 rounded-2xl border border-sky-100 bg-white p-3 shadow-sm"
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                      <StepIcon className="h-4 w-4" aria-hidden />
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[9px] font-black text-white">
                        {i + 1}
                      </span>
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-black text-slate-900">{step.title}</p>
                      <p className="mt-0.5 text-xs font-semibold leading-relaxed text-slate-600">
                        {step.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {variant === "station" && stationName?.trim() ? (
              <div className="mt-4 rounded-2xl border border-dashed border-sky-200 bg-sky-50/80 p-3">
                <p className="flex items-center gap-2 text-xs font-black text-sky-900">
                  <Search className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
                  앱에서 바로 검색
                </p>
                <p className="mt-1 pl-6 text-[11px] font-semibold text-sky-800/90">
                  역 이름을 복사한 뒤 서울동행맵 검색창에 붙여 넣으세요.
                </p>
                <button
                  type="button"
                  onClick={copyStationName}
                  className={cn(
                    "mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black transition",
                    copyStatus === "ok"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : copyStatus === "err"
                        ? "border-rose-300 bg-rose-50 text-rose-900"
                        : "border-sky-300 bg-white text-sky-900 hover:bg-sky-50"
                  )}
                >
                  {copyStatus === "ok" ? (
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  {copyLabel}: {stationName.trim()}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
