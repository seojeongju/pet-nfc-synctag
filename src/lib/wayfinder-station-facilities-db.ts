import type { D1Database } from "@cloudflare/workers-types";
import type { WayfinderFacilityRow, WayfinderFacilityType } from "@/lib/wayfinder/facility-types";
import { getPilotAccessibilityFacilities } from "@/lib/wayfinder/pilot-accessibility-seed";
import { draftToFacilityId } from "@/lib/wayfinder/seoul-metro-wksn-client";

const FACILITY_SELECT = `id, station_id, facility_type, label, description, line_name, floor_text, entrance_no,
  operation_status, latitude, longitude, external_source, external_ref, synced_at`;

export type FacilityUpsertInput = {
  id: string;
  stationId: string;
  facilityType: WayfinderFacilityType;
  label: string;
  description: string | null;
  lineName: string | null;
  floorText: string | null;
  entranceNo: string | null;
  operationStatus: string | null;
  latitude: number | null;
  longitude: number | null;
  externalSource: string;
  externalRef: string | null;
};

export async function listWayfinderStationFacilities(
  db: D1Database,
  stationId: string,
  stationName: string
): Promise<{ facilities: WayfinderFacilityRow[]; source: "d1" | "pilot_seed" }> {
  const trimmedId = stationId.trim();
  try {
    const { results } = await db
      .prepare(
        `SELECT ${FACILITY_SELECT}
         FROM wayfinder_station_facilities
         WHERE station_id = ?
         ORDER BY facility_type ASC, label ASC`
      )
      .bind(trimmedId)
      .all<WayfinderFacilityRow>();
    if (results && results.length > 0) {
      return { facilities: results, source: "d1" };
    }
  } catch {
    /* 테이블 미적용 */
  }

  const seed = getPilotAccessibilityFacilities(trimmedId, stationName);
  return { facilities: seed, source: "pilot_seed" };
}

export async function replaceWayfinderStationFacilities(
  db: D1Database,
  stationId: string,
  rows: FacilityUpsertInput[],
  externalSource: string
): Promise<number> {
  const now = new Date().toISOString();
  await db.prepare(`DELETE FROM wayfinder_station_facilities WHERE station_id = ?`).bind(stationId).run();

  if (rows.length === 0) return 0;

  const stmt = db.prepare(
    `INSERT INTO wayfinder_station_facilities (
      id, station_id, facility_type, label, description, line_name, floor_text, entrance_no,
      operation_status, latitude, longitude, external_source, external_ref, synced_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const batch = rows.map((r) =>
    stmt.bind(
      r.id,
      r.stationId,
      r.facilityType,
      r.label,
      r.description,
      r.lineName,
      r.floorText,
      r.entranceNo,
      r.operationStatus,
      r.latitude,
      r.longitude,
      externalSource,
      r.externalRef,
      now,
      now
    )
  );
  await db.batch(batch);
  return rows.length;
}

export function buildUpsertFromDraft(
  draft: {
    stationId: string;
    facilityType: WayfinderFacilityType;
    label: string;
    description: string | null;
    lineName: string | null;
    floorText: string | null;
    entranceNo: string | null;
    operationStatus: string | null;
    latitude: number | null;
    longitude: number | null;
    externalRef: string | null;
  },
  externalSource: string
): FacilityUpsertInput {
  const ref = draft.externalRef ?? draft.label;
  return {
    id: draftToFacilityId(draft.stationId, ref),
    stationId: draft.stationId,
    facilityType: draft.facilityType,
    label: draft.label,
    description: draft.description,
    lineName: draft.lineName,
    floorText: draft.floorText,
    entranceNo: draft.entranceNo,
    operationStatus: draft.operationStatus,
    latitude: draft.latitude,
    longitude: draft.longitude,
    externalSource,
    externalRef: draft.externalRef,
  };
}
