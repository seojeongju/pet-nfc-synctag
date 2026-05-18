import type { D1Database } from "@cloudflare/workers-types";
import { getDedupedMetroStationsForSync } from "@/lib/wayfinder/sync-station-accessibility";
import { getMetroSyncOffset } from "@/lib/wayfinder/sync-meta-db";

export type WayfinderSyncReport = {
  metroStationTotal: number;
  metroCronOffset: number;
  stationsWithFacilities: number;
  facilityRowCount: number;
  lastSyncedAt: string | null;
  stationsEmptyCount: number;
  pilotStationCount: number;
};

export async function buildWayfinderSyncReport(db: D1Database): Promise<WayfinderSyncReport> {
  const metroStationTotal = getDedupedMetroStationsForSync().length;
  let metroCronOffset = 0;
  try {
    metroCronOffset = await getMetroSyncOffset(db);
  } catch {
    /* meta 테이블 미적용 */
  }

  let pilotStationCount = 4;
  let stationsWithFacilities = 0;
  let facilityRowCount = 0;
  let lastSyncedAt: string | null = null;
  let stationsEmptyCount = metroStationTotal;

  try {
    const pilot = await db
      .prepare(`SELECT COUNT(*) AS c FROM wayfinder_stations WHERE is_active = 1`)
      .first<{ c: number }>();
    pilotStationCount = pilot?.c ?? 4;

    const agg = await db
      .prepare(
        `SELECT COUNT(*) AS facility_count,
                COUNT(DISTINCT station_id) AS station_count,
                MAX(synced_at) AS last_sync
         FROM wayfinder_station_facilities`
      )
      .first<{ facility_count: number; station_count: number; last_sync: string | null }>();

    facilityRowCount = agg?.facility_count ?? 0;
    stationsWithFacilities = agg?.station_count ?? 0;
    lastSyncedAt = agg?.last_sync ?? null;
    stationsEmptyCount = Math.max(0, metroStationTotal - stationsWithFacilities);
  } catch {
    /* facilities 테이블 미적용 */
  }

  return {
    metroStationTotal,
    metroCronOffset,
    stationsWithFacilities,
    facilityRowCount,
    lastSyncedAt,
    stationsEmptyCount,
    pilotStationCount,
  };
}
