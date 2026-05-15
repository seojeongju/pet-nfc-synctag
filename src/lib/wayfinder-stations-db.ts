import type { D1Database } from "@cloudflare/workers-types";
import { distanceMeters } from "@/lib/wayfinder/geo";

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

export async function listActiveWayfinderStations(db: D1Database): Promise<WayfinderStationRow[]> {
  const { results } = await db
    .prepare(
      `SELECT ${STATION_SELECT}
       FROM wayfinder_stations
       WHERE is_active = 1
       ORDER BY name ASC`
    )
    .all<WayfinderStationRow>();
  return results ?? [];
}

export async function getWayfinderStationById(
  db: D1Database,
  id: string
): Promise<WayfinderStationRow | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;
  return await db
    .prepare(`SELECT ${STATION_SELECT} FROM wayfinder_stations WHERE id = ? AND is_active = 1`)
    .bind(trimmed)
    .first<WayfinderStationRow>();
}

export async function findNearbyWayfinderStations(
  db: D1Database,
  lat: number,
  lng: number,
  limit = 5
): Promise<NearbyWayfinderStation[]> {
  const safeLimit = Math.min(20, Math.max(1, Math.floor(limit)));
  const rows = await listActiveWayfinderStations(db);
  const withDistance = rows.map((row) => ({
    ...row,
    distanceM: distanceMeters(lat, lng, row.latitude, row.longitude),
  }));
  withDistance.sort((a, b) => a.distanceM - b.distanceM);
  return withDistance.slice(0, safeLimit);
}
