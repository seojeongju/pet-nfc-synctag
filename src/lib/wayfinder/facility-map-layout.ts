import type { WayfinderFacilityPublic, WayfinderFacilityRow } from "@/lib/wayfinder/facility-types";
import { toPublicFacility } from "@/lib/wayfinder/facility-types";

export type FacilityMapPoint = WayfinderFacilityPublic & {
  latitude: number;
  longitude: number;
  mapApproximate: boolean;
};

const DEG_LAT_PER_M = 1 / 111_320;

/** 좌표 없는 시설 — 역 중심 기준 소형 오프셋(겹침 완화) */
function approximateLngOffsetMeters(meters: number, atLat: number): number {
  const cosLat = Math.cos((atLat * Math.PI) / 180);
  return meters * (cosLat > 0.01 ? DEG_LAT_PER_M / cosLat : DEG_LAT_PER_M);
}

export function buildFacilityMapPoints(
  stationLat: number,
  stationLng: number,
  rows: WayfinderFacilityRow[]
): FacilityMapPoint[] {
  let approxIndex = 0;
  const out: FacilityMapPoint[] = [];

  for (const row of rows) {
    const pub = toPublicFacility(row);
    const hasLat = row.latitude != null && Number.isFinite(row.latitude);
    const hasLng = row.longitude != null && Number.isFinite(row.longitude);

    if (hasLat && hasLng) {
      out.push({
        ...pub,
        latitude: row.latitude!,
        longitude: row.longitude!,
        mapApproximate: false,
      });
      continue;
    }

    const angle = (approxIndex * 137.5 * Math.PI) / 180;
    const ring = Math.floor(approxIndex / 8) + 1;
    const meters = 12 + ring * 8;
    const dLat = meters * DEG_LAT_PER_M * Math.cos(angle);
    const dLng = approximateLngOffsetMeters(meters, stationLat) * Math.sin(angle);
    approxIndex += 1;

    out.push({
      ...pub,
      latitude: stationLat + dLat,
      longitude: stationLng + dLng,
      mapApproximate: true,
    });
  }

  return out;
}

export type DestinationPreset = {
  id: string;
  label: string;
  facilityId: string | null;
  latitude: number;
  longitude: number;
  routeLabel: string;
};

export function buildDestinationPresets(
  stationName: string,
  stationLat: number,
  stationLng: number,
  mapPoints: FacilityMapPoint[]
): DestinationPreset[] {
  const presets: DestinationPreset[] = [
    {
      id: "station-center",
      label: "역 중심",
      facilityId: null,
      latitude: stationLat,
      longitude: stationLng,
      routeLabel: stationName,
    },
  ];

  const elevator = mapPoints.find((p) => p.type === "elevator");
  if (elevator) {
    presets.push({
      id: "preset-elevator",
      label: "엘리베이터",
      facilityId: elevator.id,
      latitude: elevator.latitude,
      longitude: elevator.longitude,
      routeLabel: `${stationName} ${elevator.label}`,
    });
  }

  const toilet = mapPoints.find((p) => p.type === "accessible_toilet");
  if (toilet) {
    presets.push({
      id: "preset-toilet",
      label: "장애인 화장실",
      facilityId: toilet.id,
      latitude: toilet.latitude,
      longitude: toilet.longitude,
      routeLabel: `${stationName} ${toilet.label}`,
    });
  }

  const entrances = new Set<string>();
  for (const p of mapPoints) {
    if (p.entrance) entrances.add(p.entrance);
  }
  for (const ent of [...entrances].sort((a, b) => a.localeCompare(b, "ko")).slice(0, 4)) {
    const atEntrance = mapPoints.find((p) => p.entrance === ent);
    if (atEntrance) {
      presets.push({
        id: `preset-exit-${ent}`,
        label: `${ent}번 출입구`,
        facilityId: atEntrance.id,
        latitude: atEntrance.latitude,
        longitude: atEntrance.longitude,
        routeLabel: `${stationName} ${ent}번 출입구`,
      });
    }
  }

  return presets;
}

export function buildFacilitiesSpeechText(stationName: string, mapPoints: FacilityMapPoint[]): string {
  if (mapPoints.length === 0) {
    return `${stationName}. 교통약자 편의시설 정보가 없습니다. 역 직원에게 문의하세요.`;
  }
  const lines = mapPoints.slice(0, 8).map((p, i) => {
    const approx = p.mapApproximate ? " 대략 위치" : "";
    return `${i + 1}번, ${p.label}${approx}.`;
  });
  return `${stationName} 교통약자 편의시설 ${mapPoints.length}곳. ${lines.join(" ")}`;
}
