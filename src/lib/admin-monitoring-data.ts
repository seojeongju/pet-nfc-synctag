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
    nativeWriteFail24h,
    nativeWriteFail7d,
    nativeHandoff7d,
    nativeRejected24h,
    nativeRejected7d,
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
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM admin_action_logs " +
          "WHERE action = 'nfc_native_write' AND success = 0 AND created_at >= datetime('now', '-1 day')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM admin_action_logs " +
          "WHERE action = 'nfc_native_write' AND success = 0 AND created_at >= datetime('now', '-7 days')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM admin_action_logs " +
          "WHERE action = 'nfc_native_handoff' AND created_at >= datetime('now', '-7 days')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM admin_action_logs " +
          "WHERE action = 'nfc_native_write_rejected' AND created_at >= datetime('now', '-1 day')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM admin_action_logs " +
          "WHERE action = 'nfc_native_write_rejected' AND created_at >= datetime('now', '-7 days')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
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
    nativeWriteFail24h: nativeWriteFail24h?.c ?? 0,
    nativeWriteFail7d: nativeWriteFail7d?.c ?? 0,
    nativeHandoff7d: nativeHandoff7d?.c ?? 0,
    nativeRejected24h: nativeRejected24h?.c ?? 0,
    nativeRejected7d: nativeRejected7d?.c ?? 0,
    tagsTotal: ops?.total ?? 0,
    tagsActive: ops?.active ?? 0,
    tagsUnsold: ops?.unsold ?? 0,
  };
}

export type MapTelemetryHealthSummary = {
  windowLabel: string;
  samples24h: number;
  avgRefreshMs24h: number;
  errorRatePercent24h: number;
  timeoutRatePercent24h: number;
  offlineRatePercent24h: number;
  autoRefreshOnRatePercent24h: number;
  errorSamples: number;
  timeoutSamples: number;
  offlineSamples: number;
  topFailureReason: "timeout" | "offline" | "error" | "none";
  lastReceivedAt: string | null;
};

export type MapTelemetryTrendPoint = {
  bucket: string;
  avgRefreshMs: number;
  errorRatePercent: number;
  timeoutRatePercent: number;
};

export type MapTelemetryThresholds = {
  warningErrorRate: number;
  warningTimeoutRate: number;
  warningOfflineRate: number;
  dangerErrorRate: number;
  dangerTimeoutRate: number;
  dangerOfflineRate: number;
};

export const DEFAULT_MAP_TELEMETRY_THRESHOLDS: MapTelemetryThresholds = {
  warningErrorRate: 8,
  warningTimeoutRate: 5,
  warningOfflineRate: 8,
  dangerErrorRate: 20,
  dangerTimeoutRate: 15,
  dangerOfflineRate: 20,
};

export type MapTelemetryAlertState = {
  acknowledgedUntil: string | null;
};

export type MapTelemetryThresholdAuditRow = {
  id: number;
  actorEmail: string | null;
  payload: string | null;
  createdAt: string;
};

export async function getMapTelemetryHealthSummary(period: "1h" | "24h" | "7d" = "24h"): Promise<MapTelemetryHealthSummary> {
  const db = getDB();
  const rangeExpr = period === "1h" ? "-1 hour" : period === "7d" ? "-7 days" : "-1 day";
  const windowLabel = period === "1h" ? "최근 1시간" : period === "7d" ? "최근 7일" : "최근 24시간";
  try {
    const row = await db
      .prepare(
        "SELECT " +
          "COUNT(*) AS samples, " +
          "AVG(COALESCE(avg_refresh_ms, 0)) AS avg_refresh_ms, " +
          "AVG(CASE WHEN COALESCE(refresh_error_count, 0) > 0 THEN 1.0 ELSE 0.0 END) * 100 AS error_rate, " +
          "AVG(CASE WHEN COALESCE(refresh_timeout_count, 0) > 0 THEN 1.0 ELSE 0.0 END) * 100 AS timeout_rate, " +
          "AVG(CASE WHEN connection_status = 'offline' THEN 1.0 ELSE 0.0 END) * 100 AS offline_rate, " +
          "AVG(CASE WHEN auto_refresh_enabled = 1 THEN 1.0 ELSE 0.0 END) * 100 AS auto_on_rate, " +
          "SUM(CASE WHEN COALESCE(refresh_error_count, 0) > 0 THEN 1 ELSE 0 END) AS error_samples, " +
          "SUM(CASE WHEN COALESCE(refresh_timeout_count, 0) > 0 THEN 1 ELSE 0 END) AS timeout_samples, " +
          "SUM(CASE WHEN connection_status = 'offline' THEN 1 ELSE 0 END) AS offline_samples, " +
          "MAX(created_at) AS last_received_at " +
          "FROM map_telemetry_logs WHERE created_at >= datetime('now', ?)"
      )
      .bind(rangeExpr)
      .first<{
        samples: number | null;
        avg_refresh_ms: number | null;
        error_rate: number | null;
        timeout_rate: number | null;
        offline_rate: number | null;
        auto_on_rate: number | null;
        error_samples: number | null;
        timeout_samples: number | null;
        offline_samples: number | null;
        last_received_at: string | null;
      }>();

    const errorSamples = Math.max(0, Number(row?.error_samples ?? 0));
    const timeoutSamples = Math.max(0, Number(row?.timeout_samples ?? 0));
    const offlineSamples = Math.max(0, Number(row?.offline_samples ?? 0));
    const topFailureReason =
      timeoutSamples >= offlineSamples && timeoutSamples >= errorSamples && timeoutSamples > 0
        ? "timeout"
        : offlineSamples >= errorSamples && offlineSamples > 0
          ? "offline"
          : errorSamples > 0
            ? "error"
            : "none";

    return {
      windowLabel,
      samples24h: Math.max(0, Number(row?.samples ?? 0)),
      avgRefreshMs24h: Math.round(Number(row?.avg_refresh_ms ?? 0)),
      errorRatePercent24h: Number((Number(row?.error_rate ?? 0)).toFixed(1)),
      timeoutRatePercent24h: Number((Number(row?.timeout_rate ?? 0)).toFixed(1)),
      offlineRatePercent24h: Number((Number(row?.offline_rate ?? 0)).toFixed(1)),
      autoRefreshOnRatePercent24h: Number((Number(row?.auto_on_rate ?? 0)).toFixed(1)),
      errorSamples,
      timeoutSamples,
      offlineSamples,
      topFailureReason,
      lastReceivedAt: row?.last_received_at ?? null,
    };
  } catch {
    return {
      windowLabel,
      samples24h: 0,
      avgRefreshMs24h: 0,
      errorRatePercent24h: 0,
      timeoutRatePercent24h: 0,
      offlineRatePercent24h: 0,
      autoRefreshOnRatePercent24h: 0,
      errorSamples: 0,
      timeoutSamples: 0,
      offlineSamples: 0,
      topFailureReason: "none",
      lastReceivedAt: null,
    };
  }
}

export async function getMapTelemetryTrend(period: "1h" | "24h" | "7d" = "24h"): Promise<MapTelemetryTrendPoint[]> {
  const db = getDB();
  const rangeExpr = period === "1h" ? "-1 hour" : period === "7d" ? "-7 days" : "-1 day";
  const bucketExpr =
    period === "1h"
      ? "strftime('%Y-%m-%d %H:%M', created_at)"
      : period === "7d"
        ? "strftime('%Y-%m-%d', created_at)"
        : "strftime('%Y-%m-%d %H:00', created_at)";
  try {
    const { results } = await db
      .prepare(
        "SELECT " +
          `${bucketExpr} AS bucket, ` +
          "AVG(COALESCE(avg_refresh_ms, 0)) AS avg_refresh_ms, " +
          "AVG(CASE WHEN COALESCE(refresh_error_count, 0) > 0 THEN 1.0 ELSE 0.0 END) * 100 AS error_rate, " +
          "AVG(CASE WHEN COALESCE(refresh_timeout_count, 0) > 0 THEN 1.0 ELSE 0.0 END) * 100 AS timeout_rate " +
          "FROM map_telemetry_logs " +
          "WHERE created_at >= datetime('now', ?) " +
          `GROUP BY ${bucketExpr} ` +
          "ORDER BY bucket ASC LIMIT 120"
      )
      .bind(rangeExpr)
      .all<{
        bucket: string;
        avg_refresh_ms: number | null;
        error_rate: number | null;
        timeout_rate: number | null;
      }>();

    return (results ?? []).map((r) => ({
      bucket: r.bucket,
      avgRefreshMs: Math.round(Number(r.avg_refresh_ms ?? 0)),
      errorRatePercent: Number((Number(r.error_rate ?? 0)).toFixed(1)),
      timeoutRatePercent: Number((Number(r.timeout_rate ?? 0)).toFixed(1)),
    }));
  } catch {
    return [];
  }
}

export async function getMapTelemetryThresholds(): Promise<MapTelemetryThresholds> {
  const db = getDB();
  try {
    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS map_telemetry_thresholds (" +
          "id INTEGER PRIMARY KEY CHECK (id = 1), " +
          "warning_error_rate REAL NOT NULL, " +
          "warning_timeout_rate REAL NOT NULL, " +
          "warning_offline_rate REAL NOT NULL, " +
          "danger_error_rate REAL NOT NULL, " +
          "danger_timeout_rate REAL NOT NULL, " +
          "danger_offline_rate REAL NOT NULL, " +
          "updated_at TEXT DEFAULT (datetime('now'))" +
          ")"
      )
      .run();

    const row = await db
      .prepare(
        "SELECT warning_error_rate, warning_timeout_rate, warning_offline_rate, " +
          "danger_error_rate, danger_timeout_rate, danger_offline_rate " +
          "FROM map_telemetry_thresholds WHERE id = 1"
      )
      .first<{
        warning_error_rate: number;
        warning_timeout_rate: number;
        warning_offline_rate: number;
        danger_error_rate: number;
        danger_timeout_rate: number;
        danger_offline_rate: number;
      }>();

    if (!row) {
      await db
        .prepare(
          "INSERT INTO map_telemetry_thresholds (" +
            "id, warning_error_rate, warning_timeout_rate, warning_offline_rate, " +
            "danger_error_rate, danger_timeout_rate, danger_offline_rate" +
            ") VALUES (1, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          DEFAULT_MAP_TELEMETRY_THRESHOLDS.warningErrorRate,
          DEFAULT_MAP_TELEMETRY_THRESHOLDS.warningTimeoutRate,
          DEFAULT_MAP_TELEMETRY_THRESHOLDS.warningOfflineRate,
          DEFAULT_MAP_TELEMETRY_THRESHOLDS.dangerErrorRate,
          DEFAULT_MAP_TELEMETRY_THRESHOLDS.dangerTimeoutRate,
          DEFAULT_MAP_TELEMETRY_THRESHOLDS.dangerOfflineRate
        )
        .run();
      return DEFAULT_MAP_TELEMETRY_THRESHOLDS;
    }

    return {
      warningErrorRate: row.warning_error_rate,
      warningTimeoutRate: row.warning_timeout_rate,
      warningOfflineRate: row.warning_offline_rate,
      dangerErrorRate: row.danger_error_rate,
      dangerTimeoutRate: row.danger_timeout_rate,
      dangerOfflineRate: row.danger_offline_rate,
    };
  } catch {
    return DEFAULT_MAP_TELEMETRY_THRESHOLDS;
  }
}

export async function getMapTelemetryAlertState(): Promise<MapTelemetryAlertState> {
  const db = getDB();
  try {
    await db
      .prepare(
        "CREATE TABLE IF NOT EXISTS map_telemetry_alert_state (" +
          "id INTEGER PRIMARY KEY CHECK (id = 1), " +
          "last_sent_at TEXT, " +
          "acknowledged_until TEXT" +
          ")"
      )
      .run();
    try {
      await db.prepare("SELECT acknowledged_until FROM map_telemetry_alert_state WHERE id = 1").first();
    } catch {
      await db.prepare("ALTER TABLE map_telemetry_alert_state ADD COLUMN acknowledged_until TEXT").run().catch(() => {});
    }
    const row = await db
      .prepare("SELECT acknowledged_until FROM map_telemetry_alert_state WHERE id = 1")
      .first<{ acknowledged_until: string | null }>();
    return {
      acknowledgedUntil: row?.acknowledged_until ?? null,
    };
  } catch {
    return { acknowledgedUntil: null };
  }
}

export async function getMapTelemetryThresholdAudits(limit = 10): Promise<MapTelemetryThresholdAuditRow[]> {
  const db = getDB();
  const safe = Math.max(1, Math.min(limit, 50));
  try {
    const { results } = await db
      .prepare(
        "SELECT id, actor_email AS actorEmail, payload, created_at AS createdAt " +
          "FROM map_telemetry_threshold_audit " +
          "ORDER BY datetime(created_at) DESC LIMIT ?"
      )
      .bind(safe)
      .all<MapTelemetryThresholdAuditRow>();
    return results ?? [];
  } catch {
    return [];
  }
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

export type NativeRejectReasonRow = {
  reason: string;
  count: number;
};

export async function getNativeRejectTopReasons(limit = 5): Promise<NativeRejectReasonRow[]> {
  const db = getDB();
  const safe = Math.max(1, Math.min(limit, 20));
  const { results } = await db
    .prepare(
      "SELECT COALESCE(json_extract(payload, '$.reason'), 'unknown') AS reason, COUNT(*) AS count " +
        "FROM admin_action_logs " +
        "WHERE action = 'nfc_native_write_rejected' AND created_at >= datetime('now', '-7 days') " +
        "GROUP BY COALESCE(json_extract(payload, '$.reason'), 'unknown') " +
        "ORDER BY count DESC " +
        "LIMIT ?"
    )
    .bind(safe)
    .all<{ reason: string; count: number }>()
    .catch(() => ({ results: [] as { reason: string; count: number }[] }));
  return (results ?? []).map((r) => ({
    reason: String(r.reason ?? "unknown"),
    count: Number(r.count ?? 0),
  }));
}
