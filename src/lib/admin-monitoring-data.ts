import { getDB } from "@/lib/db";

/** Admin RSC only */
export async function getMonitoringSummary() {
  const db = getDB();

  const [
    nfc24h,
    nfc7d,
    nfcWithLoc24h,
    unknown7d,
    autoRoute7d,
    ble24h,
    ble7d,
    bleLost7d,
    batteryLow30d,
  ] = await Promise.all([
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM scan_logs WHERE scanned_at >= datetime('now', '-1 day')"
      )
      .first<{ c: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM scan_logs WHERE scanned_at >= datetime('now', '-7 days')"
      )
      .first<{ c: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM scan_logs WHERE scanned_at >= datetime('now', '-1 day') " +
          "AND latitude IS NOT NULL AND longitude IS NOT NULL"
      )
      .first<{ c: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM unknown_tag_accesses WHERE created_at >= datetime('now', '-7 days')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM landing_auto_route_events WHERE created_at >= datetime('now', '-7 days')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM ble_location_events WHERE created_at >= datetime('now', '-1 day')"
      )
      .first<{ c: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM ble_location_events WHERE created_at >= datetime('now', '-7 days')"
      )
      .first<{ c: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM ble_location_events " +
          "WHERE created_at >= datetime('now', '-7 days') " +
          "AND (event_type = 'ble_lost' OR event_type LIKE '%lost%')"
      )
      .first<{ c: number }>(),
    db
      .prepare(
        "SELECT COUNT(DISTINCT pet_id) AS c FROM ble_location_events " +
          "WHERE created_at >= datetime('now', '-30 days') " +
          "AND (event_type = 'battery_low' OR event_type LIKE '%battery%low%')"
      )
      .first<{ c: number }>(),
  ]);

  const ops = await db
    .prepare(
      "SELECT COUNT(*) AS total, " +
        "SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active, " +
        "SUM(CASE WHEN status = 'unsold' THEN 1 ELSE 0 END) AS unsold FROM tags"
    )
    .first<{ total: number; active: number; unsold: number }>()
    .catch(() => ({ total: 0, active: 0, unsold: 0 }));

  return {
    nfcScans24h: nfc24h?.c ?? 0,
    nfcScans7d: nfc7d?.c ?? 0,
    nfcWithLocation24h: nfcWithLoc24h?.c ?? 0,
    unknownUidAccess7d: unknown7d?.c ?? 0,
    landingAutoRoutes7d: autoRoute7d?.c ?? 0,
    bleEvents24h: ble24h?.c ?? 0,
    bleEvents7d: ble7d?.c ?? 0,
    bleLostEvents7d: bleLost7d?.c ?? 0,
    distinctPetsBatteryLow30d: batteryLow30d?.c ?? 0,
    tagsTotal: ops?.total ?? 0,
    tagsActive: ops?.active ?? 0,
    tagsUnsold: ops?.unsold ?? 0,
  };
}

export type RecentNfcScanRow = {
  id: number;
  tag_id: string;
  scanned_at: string;
  latitude: number | null;
  longitude: number | null;
  has_location: number;
};

export async function getRecentNfcScans(limit = 40) {
  const db = getDB();
  const safe = Math.max(1, Math.min(limit, 100));
  const { results } = await db
    .prepare(
      "SELECT id, tag_id, scanned_at, latitude, longitude, " +
        "CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 ELSE 0 END AS has_location " +
        "FROM scan_logs ORDER BY datetime(scanned_at) DESC LIMIT ?"
    )
    .bind(safe)
    .all<RecentNfcScanRow>();
  return results ?? [];
}

export type UnknownAccessRow = {
  id: number;
  tag_uid: string;
  ip_address: string | null;
  created_at: string;
};

export type LandingAutoRouteRow = {
  id: number;
  source: string;
  resolved_kind: string;
  authenticated: number;
  ip_address: string | null;
  created_at: string;
};

export async function getUnknownTagAccesses(limit = 30) {
  const db = getDB();
  const safe = Math.max(1, Math.min(limit, 100));
  const { results } = await db
    .prepare(
      "SELECT id, tag_uid, ip_address, created_at FROM unknown_tag_accesses " +
        "ORDER BY datetime(created_at) DESC LIMIT ?"
    )
    .bind(safe)
    .all<UnknownAccessRow>()
    .catch(() => ({ results: [] as UnknownAccessRow[] }));
  return results ?? [];
}

export async function getLandingAutoRouteEvents(limit = 30) {
  const db = getDB();
  const safe = Math.max(1, Math.min(limit, 100));
  const { results } = await db
    .prepare(
      "SELECT id, source, resolved_kind, authenticated, ip_address, created_at FROM landing_auto_route_events " +
        "ORDER BY datetime(created_at) DESC LIMIT ?"
    )
    .bind(safe)
    .all<LandingAutoRouteRow>()
    .catch(() => ({ results: [] as LandingAutoRouteRow[] }));
  return results ?? [];
}

export type RecentBleRow = {
  id: string;
  pet_id: string;
  event_type: string;
  created_at: string;
  raw_payload: string | null;
  pet_name: string | null;
};

export async function getRecentBleEvents(limit = 40) {
  const db = getDB();
  const safe = Math.max(1, Math.min(limit, 100));
  const { results } = await db
    .prepare(
      "SELECT e.id, e.pet_id, e.event_type, e.created_at, e.raw_payload, p.name AS pet_name " +
        "FROM ble_location_events e LEFT JOIN pets p ON p.id = e.pet_id " +
        "ORDER BY datetime(e.created_at) DESC LIMIT ?"
    )
    .bind(safe)
    .all<RecentBleRow>();
  return results ?? [];
}

export type LowBatteryRow = {
  pet_id: string;
  pet_name: string | null;
  last_at: string;
};

export async function getLowBatteryCandidates(limit = 30) {
  const db = getDB();
  const safe = Math.max(1, Math.min(limit, 100));
  const { results } = await db
    .prepare(
      "SELECT x.pet_id, p.name AS pet_name, x.last_at FROM (" +
        "SELECT pet_id, MAX(created_at) AS last_at FROM ble_location_events " +
        "WHERE created_at >= datetime('now', '-30 days') " +
        "AND (event_type = 'battery_low' OR event_type LIKE '%battery%low%') " +
        "GROUP BY pet_id" +
        ") x LEFT JOIN pets p ON p.id = x.pet_id " +
        "ORDER BY datetime(x.last_at) DESC LIMIT ?"
    )
    .bind(safe)
    .all<LowBatteryRow>();
  return results ?? [];
}
