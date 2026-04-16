import { getCfRequestContext } from "@/lib/cf-request-context";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getMigration0008Status } from "@/lib/db-migration-0008";

export const runtime = "edge";

type DiagEnv = CloudflareEnv & {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  KAKAO_CLIENT_ID?: string;
  MAP_TELEMETRY_WEBHOOK_URL?: string;
};

export async function GET() {
  const context = getCfRequestContext();
  const env = context.env as DiagEnv;

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      BETTER_AUTH_SECRET: !!env.BETTER_AUTH_SECRET ? "SET" : "MISSING",
      BETTER_AUTH_URL: !!env.BETTER_AUTH_URL ? "SET" : "MISSING",
      NEXT_PUBLIC_APP_URL: !!env.NEXT_PUBLIC_APP_URL ? "SET" : "MISSING",
      GOOGLE_CLIENT_ID: !!env.GOOGLE_CLIENT_ID ? "SET" : "MISSING",
      KAKAO_CLIENT_ID: !!env.KAKAO_CLIENT_ID ? "SET" : "MISSING",
    },
    database: {
      isBound: !!env.DB,
      connectionTest: "Pending",
      migration0008: "Pending" as string | object,
      /** mode_announcements.target_tenant_id (0010) — 없으면 공지 쿼리가 실패할 수 있음 */
      modeAnnouncementsTargetTenant: "Pending" as string | { ok: true } | { ok: false; message: string },
    },
    auth: {
      initialization: "Pending",
      error: null as string | null,
    },
  };

  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1").run();
      diagnostics.database.connectionTest = "Success";
      diagnostics.database.migration0008 = await getMigration0008Status(env.DB);
      try {
        await env.DB.prepare("SELECT target_tenant_id FROM mode_announcements LIMIT 1").first();
        diagnostics.database.modeAnnouncementsTargetTenant = { ok: true };
      } catch (colErr: unknown) {
        const msg = colErr instanceof Error ? colErr.message : String(colErr);
        diagnostics.database.modeAnnouncementsTargetTenant = { ok: false, message: msg };
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      diagnostics.database.connectionTest = `Failed: ${err.message}`;
      diagnostics.database.migration0008 = "Unavailable";
      diagnostics.database.modeAnnouncementsTargetTenant = "Unavailable";
    }
  }

  try {
    getAuth(env);
    diagnostics.auth.initialization = "Success";
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    diagnostics.auth.initialization = "Failed";
    diagnostics.auth.error = err.message || String(e);
  }

  return NextResponse.json(diagnostics);
}

type MapTelemetryPayload = {
  subjectKind?: string;
  refreshCount?: number;
  refreshErrorCount?: number;
  refreshTimeoutCount?: number;
  avgRefreshMs?: number | null;
  autoRefreshEnabled?: boolean;
  connectionStatus?: "online" | "offline" | "paused";
  followMyLocation?: boolean;
  compassMode?: boolean;
  useClustering?: boolean;
  playbackActive?: boolean;
  playbackSpeed?: 1 | 2;
  pageVisible?: boolean;
  at?: string;
};

function clampNumber(n: unknown, min: number, max: number) {
  if (typeof n !== "number" || Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, n));
}

export async function POST(req: Request) {
  const context = getCfRequestContext();
  const env = context.env as DiagEnv;
  let payload: MapTelemetryPayload | null = null;
  try {
    payload = (await req.json()) as MapTelemetryPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const sanitized = {
    source: "live-location-map",
    subjectKind: typeof payload.subjectKind === "string" ? payload.subjectKind.slice(0, 24) : "unknown",
    refreshCount: clampNumber(payload.refreshCount, 0, 100000),
    refreshErrorCount: clampNumber(payload.refreshErrorCount, 0, 100000),
    refreshTimeoutCount: clampNumber(payload.refreshTimeoutCount, 0, 100000),
    avgRefreshMs: payload.avgRefreshMs == null ? null : clampNumber(payload.avgRefreshMs, 0, 60000),
    autoRefreshEnabled: Boolean(payload.autoRefreshEnabled),
    connectionStatus:
      payload.connectionStatus === "online" || payload.connectionStatus === "offline" || payload.connectionStatus === "paused"
        ? payload.connectionStatus
        : "paused",
    followMyLocation: Boolean(payload.followMyLocation),
    compassMode: Boolean(payload.compassMode),
    useClustering: Boolean(payload.useClustering),
    playbackActive: Boolean(payload.playbackActive),
    playbackSpeed: payload.playbackSpeed === 2 ? 2 : 1,
    pageVisible: Boolean(payload.pageVisible),
    at: typeof payload.at === "string" ? payload.at : new Date().toISOString(),
    receivedAt: new Date().toISOString(),
  };

  console.info("[diag][map-telemetry]", JSON.stringify(sanitized));

  if (env.DB) {
    try {
      await env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS map_telemetry_logs (" +
          "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
          "source TEXT NOT NULL, " +
          "subject_kind TEXT, " +
          "refresh_count INTEGER, " +
          "refresh_error_count INTEGER, " +
          "refresh_timeout_count INTEGER, " +
          "avg_refresh_ms INTEGER, " +
          "auto_refresh_enabled INTEGER, " +
          "connection_status TEXT, " +
          "follow_my_location INTEGER, " +
          "compass_mode INTEGER, " +
          "use_clustering INTEGER, " +
          "playback_active INTEGER, " +
          "playback_speed INTEGER, " +
          "page_visible INTEGER, " +
          "event_at TEXT, " +
          "created_at TEXT DEFAULT (datetime('now'))" +
          ")"
      ).run();

      await env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS map_telemetry_alert_state (" +
          "id INTEGER PRIMARY KEY CHECK (id = 1), " +
          "last_sent_at TEXT, " +
          "acknowledged_until TEXT" +
          ")"
      ).run();
      await env.DB.prepare("ALTER TABLE map_telemetry_alert_state ADD COLUMN acknowledged_until TEXT").run().catch(() => {});

      await env.DB.prepare(
        "INSERT INTO map_telemetry_logs (" +
          "source, subject_kind, refresh_count, refresh_error_count, refresh_timeout_count, avg_refresh_ms, " +
          "auto_refresh_enabled, connection_status, follow_my_location, compass_mode, use_clustering, " +
          "playback_active, playback_speed, page_visible, event_at" +
          ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(
          sanitized.source,
          sanitized.subjectKind,
          sanitized.refreshCount,
          sanitized.refreshErrorCount,
          sanitized.refreshTimeoutCount,
          sanitized.avgRefreshMs,
          sanitized.autoRefreshEnabled ? 1 : 0,
          sanitized.connectionStatus,
          sanitized.followMyLocation ? 1 : 0,
          sanitized.compassMode ? 1 : 0,
          sanitized.useClustering ? 1 : 0,
          sanitized.playbackActive ? 1 : 0,
          sanitized.playbackSpeed,
          sanitized.pageVisible ? 1 : 0,
          sanitized.at
        )
        .run();

      const isBreach =
        (sanitized.refreshErrorCount ?? 0) >= 5 ||
        (sanitized.refreshTimeoutCount ?? 0) >= 3 ||
        sanitized.connectionStatus === "offline";
      if (isBreach && env.MAP_TELEMETRY_WEBHOOK_URL) {
        const state = await env.DB
          .prepare("SELECT last_sent_at, acknowledged_until FROM map_telemetry_alert_state WHERE id = 1")
          .first<{ last_sent_at: string | null; acknowledged_until: string | null }>()
          .catch(() => ({ last_sent_at: null, acknowledged_until: null }));
        const lastTs = state?.last_sent_at ? Date.parse(state.last_sent_at) : 0;
        const ackTs = state?.acknowledged_until ? Date.parse(state.acknowledged_until) : 0;
        const nowTs = Date.now();
        const cooldownMs = 15 * 60 * 1000;
        const acked = ackTs && !Number.isNaN(ackTs) && nowTs < ackTs;
        if (!acked && (!lastTs || Number.isNaN(lastTs) || nowTs - lastTs >= cooldownMs)) {
          const text =
            `[MapTelemetry Alert]\n` +
            `mode=${sanitized.subjectKind}\n` +
            `status=${sanitized.connectionStatus}\n` +
            `errors=${sanitized.refreshErrorCount ?? 0}, timeouts=${sanitized.refreshTimeoutCount ?? 0}\n` +
            `avg=${sanitized.avgRefreshMs ?? 0}ms`;
          const blocks = [
            {
              type: "header",
              text: { type: "plain_text", text: "Map Telemetry Alert" },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Mode*\n${sanitized.subjectKind}` },
                { type: "mrkdwn", text: `*Status*\n${sanitized.connectionStatus}` },
                { type: "mrkdwn", text: `*Errors*\n${sanitized.refreshErrorCount ?? 0}` },
                { type: "mrkdwn", text: `*Timeouts*\n${sanitized.refreshTimeoutCount ?? 0}` },
                { type: "mrkdwn", text: `*Avg Latency*\n${sanitized.avgRefreshMs ?? 0}ms` },
                { type: "mrkdwn", text: `*Playback*\n${sanitized.playbackActive ? "ON" : "OFF"}` },
              ],
            },
            {
              type: "context",
              elements: [
                { type: "mrkdwn", text: `event_at=${sanitized.at}` },
              ],
            },
          ];
          await fetch(env.MAP_TELEMETRY_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, blocks }),
          }).catch(() => {
            // webhook 장애는 서비스 흐름에 영향 주지 않음
          });

          await env.DB.prepare(
            "INSERT INTO map_telemetry_alert_state (id, last_sent_at) VALUES (1, datetime('now')) " +
              "ON CONFLICT(id) DO UPDATE SET last_sent_at = excluded.last_sent_at"
          ).run();
        }
      }
    } catch (dbError: unknown) {
      const msg = dbError instanceof Error ? dbError.message : String(dbError);
      console.warn("[diag][map-telemetry][db-error]", msg);
    }
  }

  return NextResponse.json({ ok: true });
}
