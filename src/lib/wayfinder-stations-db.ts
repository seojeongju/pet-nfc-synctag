import type { D1Database } from "@cloudflare/workers-types";
import { distanceMeters } from "@/lib/wayfinder/geo";
import { SEOUL_METRO_STATIONS, type SeoulMetroStationRecord } from "@/lib/wayfinder/seoul-metro-stations";

export type WayfinderStationRow = {
  id: string;
  name: string;
  lines: string | null;
  latitude: number;
  longitude: number;
  is_active: number;
  external_ref: string | null;
  created_at: string;
  updated_at: string;
};

export type NearbyWayfinderStation = WayfinderStationRow & { distanceM: number };

const STATION_SELECT = `id, name, lines, latitude, longitude, is_active, external_ref, created_at, updated_at`;

/** D1 파일럿 시드 ID → CC0 데이터셋 ID (역 상세 URL 호환) */
const LEGACY_PILOT_STATION_IDS: Record<string, string> = {
  "seoul-station": "stn--107",
  "gangnam-station": "stn--288",
  "jamsil-station": "stn--85",
  "hongdae-station": "stn--295",
};

/** 검색 반경(약 25km) — 그 밖 역은 Haversine 전에 제외 */
const NEARBY_SEARCH_RADIUS_M = 25_000;
const DEG_LAT_PER_M = 1 / 111_320;
const DEG_LNG_PER_M_AT_EQUATOR = 1 / 111_320;

function recordToRow(r: SeoulMetroStationRecord): WayfinderStationRow {
  return {
    id: r.id,
    name: r.name,
    lines: r.lines || null,
    latitude: r.latitude,
    longitude: r.longitude,
    is_active: 1,
    external_ref: null,
    created_at: "",
    updated_at: "",
  };
}

function allBundledStations(): WayfinderStationRow[] {
  return SEOUL_METRO_STATIONS.map(recordToRow);
}

function candidatesInBoundingBox(
  lat: number,
  lng: number,
  radiusM: number,
  rows: WayfinderStationRow[]
): WayfinderStationRow[] {
  const dLat = radiusM * DEG_LAT_PER_M;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const dLng = radiusM * (cosLat > 0.01 ? DEG_LNG_PER_M_AT_EQUATOR / cosLat : DEG_LNG_PER_M_AT_EQUATOR);
  const minLat = lat - dLat;
  const maxLat = lat + dLat;
  const minLng = lng - dLng;
  const maxLng = lng + dLng;
  return rows.filter(
    (r) =>
      r.latitude >= minLat &&
      r.latitude <= maxLat &&
      r.longitude >= minLng &&
      r.longitude <= maxLng
  );
}

export async function listActiveWayfinderStations(db: D1Database): Promise<WayfinderStationRow[]> {
  try {
    const { results } = await db
      .prepare(
        `SELECT ${STATION_SELECT}
       FROM wayfinder_stations
       WHERE is_active = 1
       ORDER BY name ASC`
      )
      .all<WayfinderStationRow>();
    if (results && results.length >= 50) {
      return results;
    }
  } catch {
    /* D1 미적용·파일럿 시드만 있을 때 */
  }
  return allBundledStations();
}

export async function getWayfinderStationById(
  db: D1Database,
  id: string
): Promise<WayfinderStationRow | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const resolvedId = LEGACY_PILOT_STATION_IDS[trimmed] ?? trimmed;
  const bundled = SEOUL_METRO_STATIONS.find((s) => s.id === resolvedId);
  if (bundled) return recordToRow(bundled);

  try {
    const row = await db
      .prepare(`SELECT ${STATION_SELECT} FROM wayfinder_stations WHERE id = ? AND is_active = 1`)
      .bind(trimmed)
      .first<WayfinderStationRow>();
    if (row) return row;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * GPS 좌표 기준 가까운 역 (거리 오름차순).
 * 수도권 역 정적 데이터(CC0) + D1 파일럿/확장 데이터 병합.
 */
export async function findNearbyWayfinderStations(
  db: D1Database,
  lat: number,
  lng: number,
  limit = 5
): Promise<NearbyWayfinderStation[]> {
  const safeLimit = Math.min(20, Math.max(1, Math.floor(limit)));

  let dbRows: WayfinderStationRow[] = [];
  try {
    const { results } = await db
      .prepare(
        `SELECT ${STATION_SELECT} FROM wayfinder_stations WHERE is_active = 1`
      )
      .all<WayfinderStationRow>();
    dbRows = results ?? [];
  } catch {
    dbRows = [];
  }

  const byId = new Map<string, WayfinderStationRow>();
  for (const r of allBundledStations()) {
    byId.set(r.id, r);
  }
  for (const r of dbRows) {
    byId.set(r.id, r);
  }
  const merged = [...byId.values()];

  const inBox = candidatesInBoundingBox(lat, lng, NEARBY_SEARCH_RADIUS_M, merged);
  const pool = inBox.length > 0 ? inBox : merged;

  const withDistance = pool.map((row) => ({
    ...row,
    distanceM: distanceMeters(lat, lng, row.latitude, row.longitude),
  }));
  withDistance.sort((a, b) => a.distanceM - b.distanceM);

  const deduped: NearbyWayfinderStation[] = [];
  const seenNames = new Set<string>();
  for (const row of withDistance) {
    const nameKey = row.name.replace(/\s/g, "");
    if (seenNames.has(nameKey)) continue;
    seenNames.add(nameKey);
    deduped.push(row);
    if (deduped.length >= safeLimit) break;
  }
  return deduped;
}
