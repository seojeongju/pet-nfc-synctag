"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation2 } from "lucide-react";
import {
  buildDestinationPresets,
  buildFacilitiesSpeechText,
  type DestinationPreset,
  type FacilityMapPoint,
} from "@/lib/wayfinder/facility-map-layout";
import type { WayfinderFacilityPublic } from "@/lib/wayfinder/facility-types";
import {
  filterFacilitiesByType,
  type FacilityFilterId,
} from "@/lib/wayfinder/facility-filter";
import { buildKakaoMapRouteHref } from "@/lib/wayfinder/kakao-map-links";
import { WayfinderSpeechAnnouncer } from "@/components/wayfinder/WayfinderSpeechAnnouncer";
import { WayfinderStationAccessibility } from "@/components/wayfinder/WayfinderStationAccessibility";
import { WayfinderStationFacilitiesEmpty } from "@/components/wayfinder/WayfinderStationFacilitiesEmpty";
import { WayfinderStationMap } from "@/components/wayfinder/WayfinderStationMap";
import { cn } from "@/lib/utils";

type Props = {
  stationName: string;
  latitude: number;
  longitude: number;
  routeHref: string;
  facilities: WayfinderFacilityPublic[];
  mapPoints: FacilityMapPoint[];
  facilitiesSource: "d1" | "pilot_seed";
  facilitiesSyncedAt: string | null;
  initialSelectedFacilityId?: string | null;
  /** 서울 역: 시설·카카오 안내 문구에서 서울동행맵 우선 안내 */
  seoulCompanionRecommended?: boolean;
};

function routeHrefForPreset(p: DestinationPreset): string {
  return buildKakaoMapRouteHref(p.routeLabel, p.latitude, p.longitude);
}

export function WayfinderStationExperience({
  stationName,
  latitude,
  longitude,
  routeHref,
  facilities,
  mapPoints,
  facilitiesSource,
  facilitiesSyncedAt,
  initialSelectedFacilityId = null,
  seoulCompanionRecommended = false,
}: Props) {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    initialSelectedFacilityId
  );
  const [facilityFilter, setFacilityFilter] = useState<FacilityFilterId>("all");

  const filteredFacilities = useMemo(
    () => filterFacilitiesByType(facilities, facilityFilter),
    [facilities, facilityFilter]
  );

  const filteredMapPoints = useMemo(() => {
    const ids = new Set(filteredFacilities.map((f) => f.id));
    return mapPoints.filter((p) => ids.has(p.id));
  }, [filteredFacilities, mapPoints]);

  useEffect(() => {
    if (selectedFacilityId && !filteredFacilities.some((f) => f.id === selectedFacilityId)) {
      setSelectedFacilityId(null);
    }
  }, [filteredFacilities, selectedFacilityId]);

  const presets = useMemo(
    () => buildDestinationPresets(stationName, latitude, longitude, filteredMapPoints),
    [filteredMapPoints, latitude, longitude, stationName]
  );

  const speechText = useMemo(
    () => buildFacilitiesSpeechText(stationName, filteredMapPoints),
    [filteredMapPoints, stationName]
  );

  const selectedPoint = filteredMapPoints.find((p) => p.id === selectedFacilityId) ?? null;
  const hasFacilities = facilities.length > 0;

  return (
    <div className="space-y-4">
      {!hasFacilities ? (
        <WayfinderStationFacilitiesEmpty
          stationName={stationName}
          routeHref={routeHref}
          dataSource={facilitiesSource}
        />
      ) : null}

      {hasFacilities && filteredMapPoints.length > 0 ? (
        <div className="space-y-2">
          <WayfinderSpeechAnnouncer text={speechText} />
          <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
            {seoulCompanionRecommended ? (
              <>
                역까지·역 간 <strong className="text-sky-800">맞춤 경로</strong>는 위 서울동행맵을 이용하고, 아래
                카카오맵은 <strong className="text-slate-700">참고 경로</strong>입니다.
              </>
            ) : (
              <>
                카카오맵 길찾기는 <strong className="text-slate-700">참고 경로</strong>입니다. 휠체어·시각장애
                동반 시 역무원·안내 데스크에 도움을 요청하세요.
              </>
            )}
          </p>
        </div>
      ) : null}

      {hasFacilities && presets.length > 1 ? (
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
        facilities={hasFacilities ? filteredMapPoints : mapPoints}
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
          선택: {selectedPoint.label} — 카카오맵 (참고)
        </a>
      ) : null}

      {hasFacilities ? (
        <WayfinderStationAccessibility
          allFacilities={facilities}
          facilities={filteredFacilities}
          mapPoints={filteredMapPoints}
          dataSource={facilitiesSource}
          syncedAt={facilitiesSyncedAt}
          selectedFacilityId={selectedFacilityId}
          onSelectFacility={setSelectedFacilityId}
          stationName={stationName}
          facilityFilter={facilityFilter}
          onFacilityFilterChange={setFacilityFilter}
        />
      ) : null}
    </div>
  );
}
