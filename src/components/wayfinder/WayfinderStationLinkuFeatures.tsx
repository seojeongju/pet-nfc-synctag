"use client";

import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  ChevronRight,
  Filter,
  MapPinned,
  Nfc,
  Volume2,
} from "lucide-react";
import {
  STATION_LINKU_FEATURES,
  type StationLinkuFeatureId,
} from "@/lib/wayfinder/station-linku-features";
import { cn } from "@/lib/utils";

const FEATURE_ICONS: Record<StationLinkuFeatureId, LucideIcon> = {
  map: MapPinned,
  facilities: Accessibility,
  filter: Filter,
  speech: Volume2,
  nfc: Nfc,
};

type Props = {
  stationName: string;
  facilityCount: number;
  className?: string;
};

function scrollToAnchor(anchorId: string) {
  const el = document.getElementById(anchorId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function WayfinderStationLinkuFeatures({
  stationName,
  facilityCount,
  className,
}: Props) {
  const hasFacilities = facilityCount > 0;

  return (
    <section
      className={cn("space-y-3", className)}
      aria-label={`${stationName} 링크유-동행 역 안내 기능`}
    >
      <header className="flex items-start gap-3 px-0.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
          <Accessibility className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-black text-slate-900 sm:text-base">링크유-동행 · 역 안내</h2>
          <p className="text-[11px] font-semibold leading-relaxed text-slate-600">
            <strong className="text-indigo-800">{stationName}</strong>의 교통약자 편의시설을 지도·목록·음성으로
            확인하세요. 아래 기능을 누르면 해당 화면으로 이동합니다.
          </p>
        </div>
      </header>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {STATION_LINKU_FEATURES.map((feature) => {
          const Icon = FEATURE_ICONS[feature.id];
          const disabled = !hasFacilities && feature.id !== "nfc";
          const badge =
            feature.id === "facilities" && hasFacilities
              ? String(facilityCount)
              : feature.id === "filter" && hasFacilities
                ? "필터"
                : null;

          return (
            <li key={feature.id} className={feature.id === "nfc" ? "sm:col-span-1" : undefined}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => scrollToAnchor(feature.anchor)}
                className={cn(
                  "flex h-full min-h-[88px] w-full flex-col items-start gap-2 rounded-2xl border p-3 text-left shadow-sm transition",
                  disabled
                    ? "cursor-not-allowed border-slate-100 bg-slate-50/80 opacity-60"
                    : "border-indigo-100 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 active:scale-[0.99]"
                )}
              >
                <span className="flex w-full items-center justify-between gap-1">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      disabled ? "bg-slate-200 text-slate-500" : "bg-indigo-100 text-indigo-700"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  {badge ? (
                    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-black text-white">
                      {badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0",
                        disabled ? "text-slate-300" : "text-indigo-400"
                      )}
                      aria-hidden
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-black text-slate-900">{feature.title}</span>
                  <span className="mt-0.5 block text-[10px] font-semibold leading-snug text-slate-500">
                    {disabled && feature.id !== "nfc"
                      ? "시설 데이터 준비 중"
                      : feature.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {!hasFacilities ? (
        <p className="rounded-xl border border-amber-100 bg-amber-50/90 px-3 py-2 text-[11px] font-semibold text-amber-950">
          이 역의 편의시설 데이터가 아직 없습니다. 공공데이터 동기화 후 지도·목록·필터가 활성화됩니다.
        </p>
      ) : null}
    </section>
  );
}
