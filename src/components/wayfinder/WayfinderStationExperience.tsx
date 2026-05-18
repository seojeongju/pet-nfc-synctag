"use client";

import { useMemo, useState } from "react";
import { MapPin, Navigation2 } from "lucide-react";
import {
  buildDestinationPresets,
  buildFacilitiesSpeechText,
  type DestinationPreset,
  type FacilityMapPoint,
} from "@/lib/wayfinder/facility-map-layout";
import type { WayfinderFacilityPublic } from "@/lib/wayfinder/facility-types";
import { buildKakaoMapRouteHref } from "@/lib/wayfinder/kakao-map-links";
import { WayfinderSpeechAnnouncer } from "@/components/wayfinder/WayfinderSpeechAnnouncer";
import { WayfinderStationAccessibility } from "@/components/wayfinder/WayfinderStationAccessibility";
import { WayfinderStationMap } from "@/components/wayfinder/WayfinderStationMap";
import { cn } from "@/lib/utils";

type Props = {
  stationName: string;
  latitude: number;
  longitude: number;
  facilities: WayfinderFacilityPublic[];
  mapPoints: FacilityMapPoint[];
  facilitiesSource: "d1" | "pilot_seed";
  facilitiesSyncedAt: string | null;
  initialSelectedFacilityId?: string | null;
};

function routeHrefForPreset(p: DestinationPreset): string {
  return buildKakaoMapRouteHref(p.routeLabel, p.latitude, p.longitude);
}

export function WayfinderStationExperience({
  stationName,
  latitude,
  longitude,
  facilities,
  mapPoints,
  facilitiesSource,
  facilitiesSyncedAt,
  initialSelectedFacilityId = null,
}: Props) {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    initialSelectedFacilityId
  );

  const presets = useMemo(
    () => buildDestinationPresets(stationName, latitude, longitude, mapPoints),
    [mapPoints, latitude, longitude, stationName]
  );

  const speechText = useMemo(
    () => buildFacilitiesSpeechText(stationName, mapPoints),
    [mapPoints, stationName]
  );

  const selectedPoint = mapPoints.find((p) => p.id === selectedFacilityId) ?? null;

  return (
    <div className="space-y-4">
      {mapPoints.length > 0 ? (
        <div className="space-y-2">
          <WayfinderSpeechAnnouncer text={speechText} />
          <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
            카카오맵 길찾기는 <strong className="text-slate-700">참고 경로</strong>입니다. 휠체어·시각장애
            동반 시 역무원·안내 데스크에 도움을 요청하세요.
          </p>
        </div>
      ) : null}

      {presets.length > 1 ? (
        <section aria-label="목적지 빠른 길찾기" className="space-y-2">
          <p className="text-xs font-black text-slate-800">목적지 선택</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => {
              const active =
                p.facilityId != null
                  ? p.facilityId === selectedFacilityId
                  : selectedFacilityId == null && p.id === "station-center";
              return (
                <a
                  key={p.id}
                  href={routeHrefForPreset(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (p.facilityId) setSelectedFacilityId(p.facilityId);
                  }}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black transition",
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  )}
                >
                  <Navigation2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {p.label}
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      <WayfinderStationMap
        latitude={latitude}
        longitude={longitude}
        label={stationName}
        facilities={mapPoints}
        selectedFacilityId={selectedFacilityId}
        onSelectFacility={setSelectedFacilityId}
      />

      {selectedPoint ? (
        <a
          href={buildKakaoMapRouteHref(
            `${stationName} ${selectedPoint.label}`,
            selectedPoint.latitude,
            selectedPoint.longitude
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-900 hover:bg-indigo-100"
        >
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          선택: {selectedPoint.label} — 카카오맵 길찾기
        </a>
      ) : null}

      <WayfinderStationAccessibility
        facilities={facilities}
        mapPoints={mapPoints}
        dataSource={facilitiesSource}
        syncedAt={facilitiesSyncedAt}
        selectedFacilityId={selectedFacilityId}
        onSelectFacility={setSelectedFacilityId}
        stationName={stationName}
      />
    </div>
  );
}
