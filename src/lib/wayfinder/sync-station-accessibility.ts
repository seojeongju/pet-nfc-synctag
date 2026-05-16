import type { D1Database } from "@cloudflare/workers-types";
import type { WayfinderStationRow } from "@/lib/wayfinder-stations-db";
import { SEOUL_METRO_STATIONS } from "@/lib/wayfinder/seoul-metro-stations";
import {
  buildUpsertFromDraft,
  replaceWayfinderStationFacilities,
  type FacilityUpsertInput,
} from "@/lib/wayfinder-station-facilities-db";
import {
  fetchAllWksnForStation,
  mapWksnItemToDraft,
  normalizeStationNameForWksn,
  WKSN_FACILITY_OPERATIONS,
  WksnApiError,
} from "@/lib/wayfinder/seoul-metro-wksn-client";

export type SyncAccessibilityResult = {
  stationId: string;
  stationName: string;
  upserted: number;
  operations: { operation: string; itemCount: number; skipped?: string }[];
  errors: string[];
};

export type SyncAccessibilityBatchMeta = {
  scope: "pilot" | "metro";
  total: number;
  offset: number;
  batchSize: number;
  nextOffset: number | null;
  done: boolean;
};

/** Edge 타임아웃·공공 API 일일 한도 고려 (한 요청당 역 수) */
export const METRO_SYNC_DEFAULT_BATCH_SIZE = 8;
export const METRO_SYNC_MAX_BATCH_SIZE = 15;

let dedupedMetroStationsCache: Pick<WayfinderStationRow, "id" | "name">[] | null = null;

/** 수도권 역 목록(CC0) — 역명 중복 제거(환승·복수 노선) */
export function getDedupedMetroStationsForSync(): Pick<WayfinderStationRow, "id" | "name">[] {
  if (dedupedMetroStationsCache) return dedupedMetroStationsCache;
  const seen = new Set<string>();
  const out: Pick<WayfinderStationRow, "id" | "name">[] = [];
  for (const r of SEOUL_METRO_STATIONS) {
    const key = r.name.replace(/\s/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ id: r.id, name: r.name });
  }
  dedupedMetroStationsCache = out;
  return out;
}

export async function syncWayfinderStationAccessibility(
  db: D1Database,
  station: Pick<WayfinderStationRow, "id" | "name">,
  apiKey: string
): Promise<SyncAccessibilityResult> {
  const stnNm = normalizeStationNameForWksn(station.name);
  const operations: SyncAccessibilityResult["operations"] = [];
  const errors: string[] = [];
  const upserts: FacilityUpsertInput[] = [];
  const seenRef = new Set<string>();

  for (const spec of WKSN_FACILITY_OPERATIONS) {
    try {
      const items = await fetchAllWksnForStation(apiKey, spec.operation, stnNm);
      operations.push({ operation: spec.operation, itemCount: items.length });
      for (const item of items) {
        const draft = mapWksnItemToDraft(item, spec, station.id);
        if (!draft.externalRef || seenRef.has(draft.externalRef)) continue;
        seenRef.add(draft.externalRef);
        upserts.push(buildUpsertFromDraft(draft, "seoul_metro_wksn"));
      }
    } catch (e) {
      if (e instanceof WksnApiError && e.code === "NOT_FOUND") {
        operations.push({ operation: spec.operation, itemCount: 0, skipped: "not_found" });
        continue;
      }
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${spec.operation}: ${msg}`);
      operations.push({ operation: spec.operation, itemCount: 0, skipped: msg });
    }
  }

  const count = await replaceWayfinderStationFacilities(db, station.id, upserts, "seoul_metro_wksn");

  try {
    await db
      .prepare(
        `UPDATE wayfinder_stations SET external_ref = COALESCE(external_ref, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      )
      .bind(`wksn:stn:${stnNm}`, station.id)
      .run();
  } catch {
    /* optional */
  }

  return {
    stationId: station.id,
    stationName: station.name,
    upserted: count,
    operations,
    errors,
  };
}

async function listPilotStationsFromD1(db: D1Database): Promise<Pick<WayfinderStationRow, "id" | "name">[]> {
  try {
    const { results } = await db
      .prepare(`SELECT id, name FROM wayfinder_stations WHERE is_active = 1 ORDER BY name ASC`)
      .all<{ id: string; name: string }>();
    return results ?? [];
  } catch {
    return [];
  }
}

/** D1 wayfinder_stations 시드(파일럿 4역)만 동기화 */
export async function syncPilotWayfinderStationsAccessibility(
  db: D1Database,
  apiKey: string,
  options?: { stationIds?: string[]; limit?: number }
): Promise<{ results: SyncAccessibilityResult[]; meta: SyncAccessibilityBatchMeta }> {
  let stations = await listPilotStationsFromD1(db);

  if (options?.stationIds?.length) {
    const idSet = new Set(options.stationIds);
    stations = stations.filter((s) => idSet.has(s.id));
  }

  const limit = options?.limit ?? stations.length;
  const slice = stations.slice(0, limit);
  const results: SyncAccessibilityResult[] = [];
  for (const s of slice) {
    results.push(await syncWayfinderStationAccessibility(db, s, apiKey));
  }

  return {
    results,
    meta: {
      scope: "pilot",
      total: stations.length,
      offset: 0,
      batchSize: slice.length,
      nextOffset: null,
      done: true,
    },
  };
}

/** 수도권 전체 역(CC0 목록) — offset·batchSize로 나눠 동기화 */
export async function syncMetroStationsAccessibilityBatch(
  db: D1Database,
  apiKey: string,
  options?: { offset?: number; batchSize?: number }
): Promise<{ results: SyncAccessibilityResult[]; meta: SyncAccessibilityBatchMeta }> {
  const all = getDedupedMetroStationsForSync();
  const total = all.length;
  const offset = Math.max(0, Math.floor(options?.offset ?? 0));
  const batchSize = Math.min(
    METRO_SYNC_MAX_BATCH_SIZE,
    Math.max(1, Math.floor(options?.batchSize ?? METRO_SYNC_DEFAULT_BATCH_SIZE))
  );
  const slice = all.slice(offset, offset + batchSize);
  const results: SyncAccessibilityResult[] = [];

  for (const s of slice) {
    results.push(await syncWayfinderStationAccessibility(db, s, apiKey));
  }

  const nextOffset = offset + slice.length;
  const done = nextOffset >= total;

  return {
    results,
    meta: {
      scope: "metro",
      total,
      offset,
      batchSize: slice.length,
      nextOffset: done ? null : nextOffset,
      done,
    },
  };
}

/** @deprecated pilot 전용 — syncPilotWayfinderStationsAccessibility 사용 */
export async function syncAllActiveWayfinderStationsAccessibility(
  db: D1Database,
  apiKey: string,
  options?: { stationIds?: string[]; limit?: number }
): Promise<SyncAccessibilityResult[]> {
  const { results } = await syncPilotWayfinderStationsAccessibility(db, apiKey, options);
  return results;
}
