"use client";

import { useEffect, useMemo, useState } from "react";
import { List, MapPin, MapPinned, Volume2 } from "lucide-react";
import { buildFacilitiesSpeechText, type FacilityMapPoint } from "@/lib/wayfinder/facility-map-layout";
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
};

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
        <div id="wf-station-speech" className="scroll-mt-20 space-y-2">
          <p className="flex items-center gap-2 text-xs font-black text-indigo-900">
            <Volume2 className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
            음성 안내
          </p>
          <WayfinderSpeechAnnouncer text={speechText} />
          <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
            시설을 누르면 지도에서 강조됩니다. 외부 길찾기는 페이지 하단 「참고 · 카카오맵」을 이용하세요.
          </p>
        </div>
      ) : null}

      <div id="wf-station-map" className="scroll-mt-20 space-y-2">
        <p className="flex items-center gap-2 text-xs font-black text-indigo-900">
          <MapPinned className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
          역 시설 지도
        </p>
        <WayfinderStationMap
          latitude={latitude}
          longitude={longitude}
          label={stationName}
          facilities={hasFacilities ? filteredMapPoints : mapPoints}
          selectedFacilityId={selectedFacilityId}
          onSelectFacility={setSelectedFacilityId}
        />
      </div>

      {selectedPoint ? (
        <a
          href={buildKakaoMapRouteHref(
            `${stationName} ${selectedPoint.label}`,
            selectedPoint.latitude,
            selectedPoint.longitude
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
        >
          <MapPin className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          선택 시설 — 카카오맵 (참고)
        </a>
      ) : null}

      {hasFacilities ? (
        <div id="wf-station-facilities" className="scroll-mt-20 space-y-2">
          <p className="flex items-center gap-2 text-xs font-black text-teal-900">
            <List className="h-4 w-4 shrink-0 text-teal-700" aria-hidden />
            편의시설 목록
          </p>
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
        </div>
      ) : null}
    </div>
  );
}
