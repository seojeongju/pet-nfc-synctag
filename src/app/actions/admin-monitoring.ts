"use server";

import { getDB } from "@/lib/db";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { revalidatePath } from "next/cache";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { getMapTelemetryThresholds } from "@/lib/admin-monitoring-data";

function normalizeUid(uid: string) {
  return uid.trim().toUpperCase();
}

async function assertAdmin() {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error("인증이 필요합니다.");
  const row = await getDB()
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(userId)
    .first<{ role?: string | null }>();
  if (!isPlatformAdminRole(row?.role)) throw new Error("플랫폼 관리자만 접근할 수 있습니다.");
  return {
    userId,
    userEmail: session?.user?.email ?? "unknown",
  };
}

export type TagDiagnosticResult =
  | { ok: false; reason: "not_found" }
  | {
      ok: true;
      tagId: string;
      bleMac: string | null;
      status: string | null;
      petId: string | null;
      petName: string | null;
      lastNfcScan: { at: string; lat: number | null; lng: number | null } | null;
      nfcScans7d: number;
      lastBleEvent: { at: string; type: string; rawPreview: string | null } | null;
      bleLost7d: number;
      firmwareHint: string | null;
    };

export async function getTagDiagnosticsForAdmin(rawUid: string): Promise<TagDiagnosticResult> {
  await assertAdmin();
  const tagId = normalizeUid(rawUid);
  if (!tagId) {
    return { ok: false, reason: "not_found" };
  }
  const db = getDB();
  type TagRow = {
    id: string;
    ble_mac: string | null;
    status: string | null;
    pet_id: string | null;
    pet_name: string | null;
  };

  let tag: TagRow | null = await db
    .prepare(
      "SELECT t.id, t.ble_mac, t.status, t.pet_id, p.name AS pet_name " +
        "FROM tags t LEFT JOIN pets p ON p.id = t.pet_id WHERE t.id = ?"
    )
    .bind(tagId)
    .first<TagRow>()
    .catch(() => null);

  if (!tag) {
    const fb = await db
      .prepare(
        "SELECT t.id, t.status, t.pet_id, p.name AS pet_name " +
          "FROM tags t LEFT JOIN pets p ON p.id = t.pet_id WHERE t.id = ?"
      )
      .bind(tagId)
      .first<{
        id: string;
        status: string | null;
        pet_id: string | null;
        pet_name: string | null;
      }>()
      .catch(() => null);
    if (fb) tag = { ...fb, ble_mac: null };
  }

  if (!tag) {
    return { ok: false, reason: "not_found" };
  }

  const lastScan = await db
    .prepare(
      "SELECT scanned_at, latitude, longitude FROM scan_logs WHERE tag_id = ? " +
        "ORDER BY datetime(scanned_at) DESC LIMIT 1"
    )
    .bind(tagId)
    .first<{ scanned_at: string; latitude: number | null; longitude: number | null }>();

  const scan7d = await db
    .prepare(
      "SELECT COUNT(*) AS c FROM scan_logs WHERE tag_id = ? AND scanned_at >= datetime('now', '-7 days')"
    )
    .bind(tagId)
    .first<{ c: number }>();

  let lastBle: { at: string; type: string; raw: string | null } | null = null;
  let bleLost7d = 0;
  let firmwareHint: string | null = null;

  if (tag.pet_id) {
    const bleRow = await db
      .prepare(
        "SELECT created_at, event_type, raw_payload FROM ble_location_events " +
          "WHERE pet_id = ? ORDER BY datetime(created_at) DESC LIMIT 1"
      )
      .bind(tag.pet_id)
      .first<{ created_at: string; event_type: string; raw_payload: string | null }>();

    if (bleRow) {
      lastBle = {
        at: bleRow.created_at,
        type: bleRow.event_type,
        raw: bleRow.raw_payload,
      };
    }

    const lostRow = await db
      .prepare(
        "SELECT COUNT(*) AS c FROM ble_location_events WHERE pet_id = ? " +
          "AND created_at >= datetime('now', '-7 days') " +
          "AND (event_type = 'ble_lost' OR event_type LIKE '%lost%')"
      )
      .bind(tag.pet_id)
      .first<{ c: number }>();
    bleLost7d = lostRow?.c ?? 0;

    if (lastBle?.raw) {
      try {
        const j = JSON.parse(lastBle.raw) as Record<string, unknown>;
        const fw =
          (typeof j.fw === "string" && j.fw) ||
          (typeof j.firmware === "string" && j.firmware) ||
          (typeof j.version === "string" && j.version);
        firmwareHint = typeof fw === "string" ? fw : null;
      } catch {
        firmwareHint = null;
      }
    }
  }

  return {
    ok: true,
    tagId: tag.id,
    bleMac: tag.ble_mac,
    status: tag.status,
    petId: tag.pet_id,
    petName: tag.pet_name,
    lastNfcScan: lastScan
      ? {
          at: lastScan.scanned_at,
          lat: lastScan.latitude,
          lng: lastScan.longitude,
        }
      : null,
    nfcScans7d: scan7d?.c ?? 0,
    lastBleEvent: lastBle
      ? {
          at: lastBle.at,
          type: lastBle.type,
          rawPreview:
            lastBle.raw && lastBle.raw.length > 120
              ? lastBle.raw.slice(0, 120) + "…"
              : lastBle.raw,
        }
      : null,
    bleLost7d,
    firmwareHint,
  };
}

export async function updateTagBleMac(tagId: string, bleMac: string | null) {
  await assertAdmin();
  const id = normalizeUid(tagId);
  const raw = bleMac?.trim() || null;
  const mac = raw ? raw.toUpperCase() : null;
  await getDB()
    .prepare("UPDATE tags SET ble_mac = ? WHERE id = ?")
    .bind(mac, id)
    .run()
    .catch((e) => {
      throw new Error(
        e instanceof Error && e.message.includes("no such column")
          ? "DB 마이그레이션(ble_mac 컬럼)을 먼저 적용해 주세요."
          : String(e)
      );
    });
  revalidatePath("/admin/monitoring");
}

export async function updateMapTelemetryThresholds(input: {
  warningErrorRate: number;
  warningTimeoutRate: number;
  warningOfflineRate: number;
  dangerErrorRate: number;
  dangerTimeoutRate: number;
  dangerOfflineRate: number;
}) {
  const admin = await assertAdmin();
  const db = getDB();

  const clamp = (n: number) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
  const warningErrorRate = clamp(input.warningErrorRate);
  const warningTimeoutRate = clamp(input.warningTimeoutRate);
  const warningOfflineRate = clamp(input.warningOfflineRate);
  const dangerErrorRate = clamp(input.dangerErrorRate);
  const dangerTimeoutRate = clamp(input.dangerTimeoutRate);
  const dangerOfflineRate = clamp(input.dangerOfflineRate);

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

  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS map_telemetry_threshold_audit (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "actor_email TEXT, " +
        "payload TEXT, " +
        "created_at TEXT DEFAULT (datetime('now'))" +
        ")"
    )
    .run();

  await db
    .prepare("INSERT INTO map_telemetry_threshold_audit (actor_email, payload) VALUES (?, ?)")
    .bind(
      admin.userEmail,
      JSON.stringify({
        warningErrorRate,
        warningTimeoutRate,
        warningOfflineRate,
        dangerErrorRate,
        dangerTimeoutRate,
        dangerOfflineRate,
      })
    )
    .run();

  await db
    .prepare(
      "INSERT INTO map_telemetry_thresholds (" +
        "id, warning_error_rate, warning_timeout_rate, warning_offline_rate, " +
        "danger_error_rate, danger_timeout_rate, danger_offline_rate, updated_at" +
        ") VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now')) " +
        "ON CONFLICT(id) DO UPDATE SET " +
        "warning_error_rate = excluded.warning_error_rate, " +
        "warning_timeout_rate = excluded.warning_timeout_rate, " +
        "warning_offline_rate = excluded.warning_offline_rate, " +
        "danger_error_rate = excluded.danger_error_rate, " +
        "danger_timeout_rate = excluded.danger_timeout_rate, " +
        "danger_offline_rate = excluded.danger_offline_rate, " +
        "updated_at = datetime('now')"
    )
    .bind(
      warningErrorRate,
      warningTimeoutRate,
      warningOfflineRate,
      dangerErrorRate,
      dangerTimeoutRate,
      dangerOfflineRate
    )
    .run();

  revalidatePath("/admin/monitoring");
  return await getMapTelemetryThresholds();
}

export async function acknowledgeMapTelemetryAlert(minutes = 60) {
  await assertAdmin();
  const safeMinutes = Math.max(5, Math.min(minutes, 24 * 60));
  const db = getDB();
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS map_telemetry_alert_state (" +
        "id INTEGER PRIMARY KEY CHECK (id = 1), " +
        "last_sent_at TEXT, " +
        "acknowledged_until TEXT" +
        ")"
    )
    .run();
  await db.prepare("ALTER TABLE map_telemetry_alert_state ADD COLUMN acknowledged_until TEXT").run().catch(() => {});
  await db
    .prepare(
      "INSERT INTO map_telemetry_alert_state (id, acknowledged_until) VALUES (1, datetime('now', ?)) " +
        "ON CONFLICT(id) DO UPDATE SET acknowledged_until = excluded.acknowledged_until"
    )
    .bind(`+${safeMinutes} minutes`)
    .run();
  revalidatePath("/admin/monitoring");
}
