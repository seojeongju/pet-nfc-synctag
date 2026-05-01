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
    finderCall24h,
    finderSms24h,
    finderLocationClick24h,
    finderLocationSuccess24h,
    finderLocationClick7d,
    finderLocationSuccess7d,
    guardianAlerts24h,
    guardianAlerts7d,
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
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM finder_action_logs " +
          "WHERE action = 'call_click' AND created_at >= datetime('now', '-1 day')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM finder_action_logs " +
          "WHERE action = 'sms_click' AND created_at >= datetime('now', '-1 day')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM finder_action_logs " +
          "WHERE action = 'location_share_click' AND created_at >= datetime('now', '-1 day')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM finder_action_logs " +
          "WHERE action = 'location_share_success' AND created_at >= datetime('now', '-1 day')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM finder_action_logs " +
          "WHERE action = 'location_share_click' AND created_at >= datetime('now', '-7 days')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM finder_action_logs " +
          "WHERE action = 'location_share_success' AND created_at >= datetime('now', '-7 days')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM guardian_alert_state " +
          "WHERE last_sent_at >= datetime('now', '-1 day')"
      )
      .first<{ c: number }>()
      .catch(() => ({ c: 0 })),
    db
      .prepare(
        "SELECT COUNT(*) AS c FROM guardian_alert_state " +
          "WHERE last_sent_at >= datetime('now', '-7 days')"
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
    finderCall24h: finderCall24h?.c ?? 0,
    finderSms24h: finderSms24h?.c ?? 0,
    finderLocationClick24h: finderLocationClick24h?.c ?? 0,
    finderLocationSuccess24h: finderLocationSuccess24h?.c ?? 0,
    finderLocationClick7d: finderLocationClick7d?.c ?? 0,
    finderLocationSuccess7d: finderLocationSuccess7d?.c ?? 0,
    guardianAlerts24h: guardianAlerts24h?.c ?? 0,
    guardianAlerts7d: guardianAlerts7d?.c ?? 0,
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
  /** tags → pets 연결 시 */
  pet_id: string | null;
  pet_name: string | null;
  subject_kind: string | null;
  owner_name: string | null;
  owner_email: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_slug: string | null;
  /** tenant_members + user, 이름 없으면 이메일 — 구분자 · */
  tenant_members_summary: string | null;
};

export type MonitoringPageResult<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
};

function normalizePage(page?: number): number {
  const p = Number(page) || 1;
  if (!Number.isFinite(p) || p < 1) return 1;
  return Math.floor(p);
}

function normalizePageSize(size?: number, defaults = 10, min = 5, max = 100): number {
  let v = Number(size) || defaults;
  if (!Number.isFinite(v)) v = defaults;
  return Math.min(max, Math.max(min, Math.floor(v)));
}

const recentNfcScanSelect =
  "SELECT sl.id, sl.tag_id, sl.scanned_at, sl.latitude, sl.longitude, " +
  "CASE WHEN sl.latitude IS NOT NULL AND sl.longitude IS NOT NULL THEN 1 ELSE 0 END AS has_location, " +
  "p.id AS pet_id, p.name AS pet_name, p.subject_kind AS subject_kind, " +
  "u.name AS owner_name, u.email AS owner_email, " +
  "p.tenant_id AS tenant_id, tn.name AS tenant_name, tn.slug AS tenant_slug, " +
  "(SELECT GROUP_CONCAT(COALESCE(NULLIF(TRIM(u_m.name), ''), u_m.email), ' · ') " +
  "FROM tenant_members tm " +
  "INNER JOIN user u_m ON u_m.id = tm.user_id " +
  "WHERE tm.tenant_id = p.tenant_id) AS tenant_members_summary " +
  "FROM scan_logs sl " +
  "LEFT JOIN tags t ON sl.tag_id = t.id " +
  "LEFT JOIN pets p ON t.pet_id = p.id " +
  "LEFT JOIN user u ON p.owner_id = u.id " +
  "LEFT JOIN tenants tn ON p.tenant_id = tn.id ";

export async function getRecentNfcScans(limit = 40) {
  const db = getDB();
  const safe = Math.max(1, Math.min(limit, 100));
  const { results } = await db
    .prepare(recentNfcScanSelect + "ORDER BY datetime(sl.scanned_at) DESC LIMIT ?")
    .bind(safe)
    .all<RecentNfcScanRow>();
  return results ?? [];
}

export async function getRecentNfcScansPage(params: {
  page?: number;
  pageSize?: number;
} = {}): Promise<MonitoringPageResult<RecentNfcScanRow>> {
  const db = getDB();
  const pageSize = normalizePageSize(params.pageSize, 10, 5, 50);
  const pageRaw = normalizePage(params.page);
  const totalRow = await db
    .prepare("SELECT COUNT(*) AS c FROM scan_logs")
    .first<{ c: number }>()
    .catch(() => ({ c: 0 }));
  const total = Number(totalRow?.c ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pageRaw, totalPages);
  const offset = (page - 1) * pageSize;
  const { results } = await db
    .prepare(
      recentNfcScanSelect + "ORDER BY datetime(sl.scanned_at) DESC LIMIT ? OFFSET ?"
    )
    .bind(pageSize, offset)
    .all<RecentNfcScanRow>()
    .catch(() => ({ results: [] as RecentNfcScanRow[] }));
  return { rows: results ?? [], total, page, pageSize };
}

export type UnknownAccessRow = {
  id: number;
  tag_uid: string;
  ip_address: string | null;
  created_at: string;
  /** 스캔 이후 등록됐다면 tags.id (당시엔 미등록이었을 수 있음) */
  matched_tag_id: string | null;
  pet_id: string | null;
  pet_name: string | null;
  subject_kind: string | null;
  owner_name: string | null;
  owner_email: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_slug: string | null;
  tenant_members_summary: string | null;
};

export type LandingAutoRouteRow = {
  id: number;
  source: string;
  resolved_kind: string;
  authenticated: number;
  ip_address: string | null;
  created_at: string;
};

export type GuardianNfcAppEventRow = {
  id: number;
  event: string;
  subject_kind: string | null;
  pet_id: string | null;
  tenant_id: string | null;
  user_id: string | null;
  created_at: string;
  pet_name: string | null;
  pet_subject_kind: string | null;
  owner_name: string | null;
  owner_email: string | null;
  actor_name: string | null;
  actor_email: string | null;
  tenant_name: string | null;
  tenant_slug: string | null;
  tenant_members_summary: string | null;
};

const unknownAccessSelect =
  "SELECT uta.id, uta.tag_uid, uta.ip_address, uta.created_at, " +
  "t.id AS matched_tag_id, p.id AS pet_id, p.name AS pet_name, p.subject_kind AS subject_kind, " +
  "ow.name AS owner_name, ow.email AS owner_email, " +
  "p.tenant_id AS tenant_id, tn.name AS tenant_name, tn.slug AS tenant_slug, " +
  "(SELECT GROUP_CONCAT(COALESCE(NULLIF(TRIM(u_m.name), ''), u_m.email), ' · ') " +
  "FROM tenant_members tm INNER JOIN user u_m ON u_m.id = tm.user_id WHERE tm.tenant_id = p.tenant_id) " +
  "AS tenant_members_summary " +
  "FROM unknown_tag_accesses uta " +
  "LEFT JOIN tags t ON t.id = uta.tag_uid " +
  "LEFT JOIN pets p ON p.id = t.pet_id " +
  "LEFT JOIN user ow ON ow.id = p.owner_id " +
  "LEFT JOIN tenants tn ON tn.id = p.tenant_id ";

export async function getUnknownTagAccesses(limit = 30) {
  const db = getDB();
  const safe = Math.max(1, Math.min(limit, 100));
  const { results } = await db
    .prepare(unknownAccessSelect + "ORDER BY datetime(uta.created_at) DESC LIMIT ?")
    .bind(safe)
    .all<UnknownAccessRow>()
    .catch(() => ({ results: [] as UnknownAccessRow[] }));
  return results ?? [];
}

export async function getUnknownTagAccessesPage(params: {
  page?: number;
  pageSize?: number;
} = {}): Promise<MonitoringPageResult<UnknownAccessRow>> {
  const db = getDB();
  const pageSize = normalizePageSize(params.pageSize, 10, 5, 50);
  const pageRaw = normalizePage(params.page);
  const totalRow = await db
    .prepare("SELECT COUNT(*) AS c FROM unknown_tag_accesses")
    .first<{ c: number }>()
    .catch(() => ({ c: 0 }));
  const total = Number(totalRow?.c ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pageRaw, totalPages);
  const offset = (page - 1) * pageSize;
  const { results } = await db
    .prepare(
      unknownAccessSelect + "ORDER BY datetime(uta.created_at) DESC LIMIT ? OFFSET ?"
    )
    .bind(pageSize, offset)
    .all<UnknownAccessRow>()
    .catch(() => ({ results: [] as UnknownAccessRow[] }));
  return { rows: results ?? [], total, page, pageSize };
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

export async function getLandingAutoRouteEventsPage(params: {
  page?: number;
  pageSize?: number;
} = {}): Promise<MonitoringPageResult<LandingAutoRouteRow>> {
  const db = getDB();
  const pageSize = normalizePageSize(params.pageSize, 10, 5, 50);
  const pageRaw = normalizePage(params.page);
  const totalRow = await db
    .prepare("SELECT COUNT(*) AS c FROM landing_auto_route_events")
    .first<{ c: number }>()
    .catch(() => ({ c: 0 }));
  const total = Number(totalRow?.c ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pageRaw, totalPages);
  const offset = (page - 1) * pageSize;
  const { results } = await db
    .prepare(
      "SELECT id, source, resolved_kind, authenticated, ip_address, created_at FROM landing_auto_route_events " +
        "ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?"
    )
    .bind(pageSize, offset)
    .all<LandingAutoRouteRow>()
    .catch(() => ({ results: [] as LandingAutoRouteRow[] }));
  return { rows: results ?? [], total, page, pageSize };
}

export async function getGuardianNfcAppEventsPage(params: {
  page?: number;
  pageSize?: number;
} = {}): Promise<MonitoringPageResult<GuardianNfcAppEventRow>> {
  const db = getDB();
  const pageSize = normalizePageSize(params.pageSize, 10, 5, 50);
  const pageRaw = normalizePage(params.page);
  const totalRow = await db
    .prepare(
      "SELECT COUNT(*) AS c FROM admin_action_logs WHERE action = 'guardian_nfc_app_event'"
    )
    .first<{ c: number }>()
    .catch(() => ({ c: 0 }));
  const total = Number(totalRow?.c ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pageRaw, totalPages);
  const offset = (page - 1) * pageSize;
  const { results } = await db
    .prepare(
      "SELECT l.id, " +
        "json_extract(l.payload, '$.event') AS event, " +
        "json_extract(l.payload, '$.subjectKind') AS subject_kind, " +
        "json_extract(l.payload, '$.petId') AS pet_id, " +
        "json_extract(l.payload, '$.tenantId') AS tenant_id, " +
        "json_extract(l.payload, '$.userId') AS user_id, " +
        "l.created_at, " +
        "p.name AS pet_name, p.subject_kind AS pet_subject_kind, " +
        "ow.name AS owner_name, ow.email AS owner_email, " +
        "act.name AS actor_name, act.email AS actor_email, " +
        "tn.name AS tenant_name, tn.slug AS tenant_slug, " +
        "(SELECT GROUP_CONCAT(COALESCE(NULLIF(TRIM(u_m.name), ''), u_m.email), ' · ') " +
        "FROM tenant_members tm INNER JOIN user u_m ON u_m.id = tm.user_id " +
        "WHERE tm.tenant_id = json_extract(l.payload, '$.tenantId')) AS tenant_members_summary " +
        "FROM admin_action_logs l " +
        "LEFT JOIN pets p ON p.id = json_extract(l.payload, '$.petId') " +
        "LEFT JOIN user ow ON ow.id = p.owner_id " +
        "LEFT JOIN user act ON act.id = json_extract(l.payload, '$.userId') " +
        "LEFT JOIN tenants tn ON tn.id = json_extract(l.payload, '$.tenantId') " +
        "WHERE l.action = 'guardian_nfc_app_event' " +
        "ORDER BY datetime(l.created_at) DESC LIMIT ? OFFSET ?"
    )
    .bind(pageSize, offset)
    .all<GuardianNfcAppEventRow>()
    .catch(() => ({ results: [] as GuardianNfcAppEventRow[] }));
  return { rows: results ?? [], total, page, pageSize };
}

export type RecentBleRow = {
  id: string;
  pet_id: string;
  event_type: string;
  created_at: string;
  raw_payload: string | null;
  pet_name: string | null;
  subject_kind: string | null;
  owner_name: string | null;
  owner_email: string | null;
  tenant_name: string | null;
};

export async function getRecentBleEvents(limit = 40) {
  const db = getDB();
  const safe = Math.max(1, Math.min(limit, 100));
  const { results } = await db
    .prepare(
      "SELECT e.id, e.pet_id, e.event_type, e.created_at, e.raw_payload, p.name AS pet_name, " +
        "p.subject_kind AS subject_kind, u.name AS owner_name, u.email AS owner_email, tn.name AS tenant_name " +
        "FROM ble_location_events e " +
        "LEFT JOIN pets p ON p.id = e.pet_id " +
        "LEFT JOIN user u ON u.id = p.owner_id " +
        "LEFT JOIN tenants tn ON tn.id = p.tenant_id " +
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
  subject_kind: string | null;
  owner_name: string | null;
  owner_email: string | null;
  tenant_name: string | null;
};

export async function getLowBatteryCandidates(limit = 30) {
  const db = getDB();
  const safe = Math.max(1, Math.min(limit, 100));
  const { results } = await db
    .prepare(
      "SELECT x.pet_id, p.name AS pet_name, x.last_at, p.subject_kind AS subject_kind, " +
        "u.name AS owner_name, u.email AS owner_email, tn.name AS tenant_name FROM (" +
        "SELECT pet_id, MAX(created_at) AS last_at FROM ble_location_events " +
        "WHERE created_at >= datetime('now', '-30 days') " +
        "AND (event_type = 'battery_low' OR event_type LIKE '%battery%low%') " +
        "GROUP BY pet_id" +
        ") x LEFT JOIN pets p ON p.id = x.pet_id " +
        "LEFT JOIN user u ON u.id = p.owner_id " +
        "LEFT JOIN tenants tn ON tn.id = p.tenant_id " +
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
