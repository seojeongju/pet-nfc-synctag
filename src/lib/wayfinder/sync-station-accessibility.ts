import type { D1Database } from "@cloudflare/workers-types";
import type { WayfinderStationRow } from "@/lib/wayfinder-stations-db";
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

export async function syncAllActiveWayfinderStationsAccessibility(
  db: D1Database,
  apiKey: string,
  options?: { stationIds?: string[]; limit?: number }
): Promise<SyncAccessibilityResult[]> {
  let stations: Pick<WayfinderStationRow, "id" | "name">[] = [];
  try {
    const { results } = await db
      .prepare(`SELECT id, name FROM wayfinder_stations WHERE is_active = 1 ORDER BY name ASC`)
      .all<{ id: string; name: string }>();
    stations = results ?? [];
  } catch {
    stations = [];
  }

  if (options?.stationIds?.length) {
    const idSet = new Set(options.stationIds);
    stations = stations.filter((s) => idSet.has(s.id));
  }

  const limit = options?.limit ?? stations.length;
  const slice = stations.slice(0, limit);
  const out: SyncAccessibilityResult[] = [];
  for (const s of slice) {
    out.push(await syncWayfinderStationAccessibility(db, s, apiKey));
  }
  return out;
}
