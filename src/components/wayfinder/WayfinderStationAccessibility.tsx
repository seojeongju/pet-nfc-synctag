"use client";

import {
  Accessibility,
  ArrowRight,
  ArrowUpFromLine,
  Bath,
  CircleHelp,
  MapPin,
  Phone,
  Zap,
} from "lucide-react";
import type { FacilityMapPoint } from "@/lib/wayfinder/facility-map-layout";
import type { WayfinderFacilityPublic, WayfinderFacilityType } from "@/lib/wayfinder/facility-types";
import { buildKakaoMapRouteHref } from "@/lib/wayfinder/kakao-map-links";
import { cn } from "@/lib/utils";

type Props = {
  facilities: WayfinderFacilityPublic[];
  mapPoints: FacilityMapPoint[];
  dataSource: "d1" | "pilot_seed";
  syncedAt: string | null;
  stationName: string;
  selectedFacilityId: string | null;
  onSelectFacility: (id: string | null) => void;
};

const TYPE_ICONS: Partial<Record<WayfinderFacilityType, typeof Accessibility>> = {
  elevator: ArrowUpFromLine,
  wheelchair_lift: Accessibility,
  accessible_toilet: Bath,
  sign_language_phone: Phone,
  wheelchair_charger: Zap,
};

function FacilityIcon({ type }: { type: WayfinderFacilityType }) {
  const Icon = TYPE_ICONS[type] ?? CircleHelp;
  return <Icon className="h-4 w-4 shrink-0 text-teal-700" aria-hidden />;
}

function formatSyncedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function WayfinderStationAccessibility({
  facilities,
  mapPoints,
  dataSource,
  syncedAt,
  stationName,
  selectedFacilityId,
  onSelectFacility,
}: Props) {
  const hasFacilities = facilities.length > 0;
  const pointById = new Map(mapPoints.map((p) => [p.id, p]));

  return (
    <section
      className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4"
      aria-label="교통약자 편의시설"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-teal-800">
          <Accessibility className="h-4 w-4" aria-hidden />
          교통약자 편의시설
        </p>
        {dataSource === "pilot_seed" ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
            예시 데이터
          </span>
        ) : (
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-900">
            공공데이터 연동
          </span>
        )}
      </div>

      {!hasFacilities ? (
        <p className="text-xs font-semibold leading-relaxed text-teal-950/90">
          이 역의 편의시설 정보를 불러오지 못했습니다. 역무원·안내 데스크에 문의하거나 위 목적지·길찾기를
          이용해 주세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {facilities.map((f) => {
            const point = pointById.get(f.id);
            const selected = f.id === selectedFacilityId;
            const routeHref = point
              ? buildKakaoMapRouteHref(`${stationName} ${f.label}`, point.latitude, point.longitude)
              : null;

            const meta: string[] = [];
            if (f.entrance) meta.push(`${f.entrance}번 출입구`);
            if (f.floor) meta.push(f.floor);
            if (f.lineName) meta.push(f.lineName);
            if (point?.mapApproximate) meta.push("대략 위치");

            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onSelectFacility(selected ? null : f.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-left shadow-sm transition",
                    selected
                      ? "border-indigo-400 bg-indigo-50/90 ring-2 ring-indigo-300"
                      : "border-teal-100/80 bg-white/90 hover:border-teal-200"
                  )}
                  aria-pressed={selected}
                >
                  <div className="flex gap-2.5">
                    <FacilityIcon type={f.type} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900">{f.label}</p>
                      {meta.length > 0 ? (
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-600">{meta.join(" · ")}</p>
                      ) : null}
                      {f.operationLabel ? (
                        <p className="mt-1 inline-flex rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                          {f.operationLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
                {routeHref ? (
                  <a
                    href={routeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-black text-teal-900 hover:bg-teal-50"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    이 시설까지 길찾기
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <ul className="mt-3 space-y-1 border-t border-teal-100/80 pt-3 text-xs font-semibold leading-relaxed text-teal-950/85">
        <li>· 목록을 누르면 지도에서 해당 시설이 강조됩니다.</li>
        <li>· 승강기·리프트 이용이 어려우면 역 직원에게 도움을 요청하세요.</li>
        <li>· 긴급 시 119 또는 역 안내 데스크에 연락하세요.</li>
        {dataSource === "pilot_seed" ? (
          <li>· 운영 환경에서는 공공데이터 동기화 후 실제 시설 목록이 표시됩니다.</li>
        ) : syncedAt ? (
          <li>· 데이터 기준: {formatSyncedAt(syncedAt)}</li>
        ) : null}
      </ul>
    </section>
  );
}
