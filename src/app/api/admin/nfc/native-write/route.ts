import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { isValidTagUidFormat, normalizeTagUid } from "@/lib/tag-uid-format";
import { verifyNativeHandoffToken, verifyWithSecret } from "@/lib/nfc-native-security";

export const runtime = "edge";

type NativeWriteBody = {
  tagId?: unknown;
  url?: unknown;
  deviceId?: unknown;
  platform?: unknown;
  mode?: unknown;
  appVersion?: unknown;
  success?: unknown;
  clientError?: unknown;
  writtenAt?: unknown;
  handoffToken?: unknown;
};

async function maybeSendNativeRejectAlert(
  db: ReturnType<typeof getDB>,
  reason: string,
  payload: Record<string, unknown>
) {
  const webhook = process.env.NATIVE_SECURITY_WEBHOOK_URL?.trim();
  if (!webhook) return;

  await db.prepare(
    "CREATE TABLE IF NOT EXISTS native_security_alert_state (" +
      "id INTEGER PRIMARY KEY CHECK (id = 1), " +
      "last_sent_at TEXT" +
      ")"
  ).run();

  const state = await db
    .prepare("SELECT last_sent_at FROM native_security_alert_state WHERE id = 1")
    .first<{ last_sent_at: string | null }>()
    .catch(() => ({ last_sent_at: null }));

  const nowTs = Date.now();
  const lastTs = state?.last_sent_at ? Date.parse(state.last_sent_at) : 0;
  const cooldownMs = 10 * 60 * 1000;
  if (lastTs && !Number.isNaN(lastTs) && nowTs - lastTs < cooldownMs) return;

  const summary = await db
    .prepare(
      "SELECT COUNT(*) AS c FROM admin_action_logs " +
        "WHERE action = 'nfc_native_write_rejected' AND created_at >= datetime('now', '-1 hour')"
    )
    .first<{ c: number }>()
    .catch(() => ({ c: 0 }));

  const top = await db
    .prepare(
      "SELECT COALESCE(json_extract(payload, '$.reason'), 'unknown') AS reason, COUNT(*) AS c " +
        "FROM admin_action_logs " +
        "WHERE action = 'nfc_native_write_rejected' AND created_at >= datetime('now', '-24 hours') " +
        "GROUP BY COALESCE(json_extract(payload, '$.reason'), 'unknown') " +
        "ORDER BY c DESC LIMIT 3"
    )
    .all<{ reason: string; c: number }>()
    .catch(() => ({ results: [] as { reason: string; c: number }[] }));

  const topLine = (top.results ?? []).map((r) => `${r.reason}:${r.c}`).join(", ");
  const text =
    "[NativeSecurity Reject Alert]\n" +
    `reason=${reason}\n` +
    `last_1h=${summary?.c ?? 0}\n` +
    `top_24h=${topLine || "none"}\n` +
    `payload=${JSON.stringify(payload).slice(0, 400)}`;

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).catch(() => {
    // webhook 장애는 요청 처리 흐름에 영향 주지 않음
  });

  await db.prepare(
    "INSERT INTO native_security_alert_state (id, last_sent_at) VALUES (1, datetime('now')) " +
      "ON CONFLICT(id) DO UPDATE SET last_sent_at = excluded.last_sent_at"
  ).run();
}

async function logNativeReject(reason: string, payload: Record<string, unknown>) {
  const db = getDB();
  await db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_action_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        actor_email TEXT,
        success BOOLEAN NOT NULL DEFAULT 1,
        payload TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  await db
    .prepare("INSERT INTO admin_action_logs (action, actor_email, success, payload) VALUES (?, ?, 0, ?)")
    .bind(
      "nfc_native_write_rejected",
      "native-callback",
      JSON.stringify({
        reason,
        ...payload,
      })
    )
    .run();
  await maybeSendNativeRejectAlert(db, reason, payload);
}

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

function getStringOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePlatform(v: unknown): "android" | "ios" | "unknown" {
  const raw = getStringOrNull(v)?.toLowerCase();
  if (raw === "android" || raw === "ios") return raw;
  return "unknown";
}

function normalizeMode(v: unknown): "linku" | "tools" | "unknown" {
  const raw = getStringOrNull(v)?.toLowerCase();
  if (raw === "linku" || raw === "tools") return raw;
  return "unknown";
}

async function verifyNativeSignature(request: Request, rawBody: string): Promise<boolean> {
  const keyId = request.headers.get("x-native-key-id")?.trim() || "current";
  const legacy = process.env.NFC_NATIVE_APP_HMAC_SECRET?.trim();
  const current = process.env.NFC_NATIVE_APP_HMAC_SECRET_CURRENT?.trim();
  const next = process.env.NFC_NATIVE_APP_HMAC_SECRET_NEXT?.trim();
  const hmacSecret = keyId === "next" ? (next || "") : (current || legacy || "");

  // Rolling migration: if no HMAC secret configured, keep bearer-only mode.
  if (!hmacSecret) return true;

  const ts = request.headers.get("x-native-timestamp")?.trim() || "";
  const signature = request.headers.get("x-native-signature")?.trim() || "";
  if (!ts || !signature) return false;

  const timestampMs = Number(ts);
  if (!Number.isFinite(timestampMs)) return false;
  const maxSkewMs = 5 * 60 * 1000;
  if (Math.abs(Date.now() - timestampMs) > maxSkewMs) return false;

  return verifyWithSecret(hmacSecret, `${ts}.${rawBody}`, signature);
}

export async function POST(request: Request) {
  const expectedToken = process.env.NFC_NATIVE_APP_API_KEY?.trim();
  if (!expectedToken) {
    return NextResponse.json({ error: "NFC_NATIVE_APP_API_KEY not configured" }, { status: 503 });
  }
  const token = getBearerToken(request);
  if (!token || token !== expectedToken) {
    await logNativeReject("unauthorized_bearer", {});
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  const signatureOk = await verifyNativeSignature(request, rawBody);
  if (!signatureOk) {
    await logNativeReject("invalid_signature", {
      keyId: request.headers.get("x-native-key-id")?.trim() || "current",
    });
    return NextResponse.json({ error: "Invalid native signature" }, { status: 401 });
  }

  let body: NativeWriteBody;
  try {
    body = JSON.parse(rawBody) as NativeWriteBody;
  } catch {
    await logNativeReject("invalid_json", {});
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tagIdRaw = getStringOrNull(body.tagId);
  const url = getStringOrNull(body.url);
  const deviceId = getStringOrNull(body.deviceId) ?? "unknown-device";
  const platform = normalizePlatform(body.platform);
  const mode = normalizeMode(body.mode);
  const appVersion = getStringOrNull(body.appVersion) ?? "unknown";
  const success = typeof body.success === "boolean" ? body.success : null;
  const clientError = getStringOrNull(body.clientError);
  const writtenAt = getStringOrNull(body.writtenAt);
  const handoffToken = getStringOrNull(body.handoffToken);

  if (!tagIdRaw || !url || success === null || !handoffToken) {
    await logNativeReject("missing_required_fields", {
      hasTagId: Boolean(tagIdRaw),
      hasUrl: Boolean(url),
      hasSuccess: success !== null,
      hasHandoffToken: Boolean(handoffToken),
    });
    return NextResponse.json({ error: "tagId, url, success, handoffToken are required" }, { status: 400 });
  }

  const tagId = normalizeTagUid(tagIdRaw);
  if (!isValidTagUidFormat(tagId)) {
    await logNativeReject("invalid_tag_id_format", { tagIdRaw });
    return NextResponse.json({ error: "Invalid tagId format" }, { status: 400 });
  }

  const handoffSecret = process.env.NFC_NATIVE_HANDOFF_SECRET?.trim();
  if (!handoffSecret) {
    return NextResponse.json({ error: "NFC_NATIVE_HANDOFF_SECRET not configured" }, { status: 503 });
  }
  const handoffVerified = await verifyNativeHandoffToken({
    token: handoffToken,
    uid: tagId,
    url,
    secret: handoffSecret,
  });
  if (!handoffVerified.ok) {
    await logNativeReject("invalid_handoff_token", { tagId, tokenError: handoffVerified.error });
    return NextResponse.json({ error: `Invalid handoff token: ${handoffVerified.error}` }, { status: 401 });
  }

  const db = getDB();
  const tag = await db.prepare("SELECT id FROM tags WHERE id = ?").bind(tagId).first<{ id: string }>();
  if (!tag) {
    await logNativeReject("unknown_tag_id", { tagId });
    return NextResponse.json({ error: "Unknown tagId" }, { status: 404 });
  }

  await db.prepare(`
      CREATE TABLE IF NOT EXISTS nfc_native_handoff_tokens (
        jti TEXT PRIMARY KEY,
        tag_id TEXT NOT NULL,
        url TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        issued_by TEXT,
        consumed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  const consumeResult = await db
    .prepare(
      `UPDATE nfc_native_handoff_tokens
       SET consumed_at = CURRENT_TIMESTAMP
       WHERE jti = ?
         AND consumed_at IS NULL
         AND datetime(expires_at) >= CURRENT_TIMESTAMP`
    )
    .bind(handoffVerified.payload.jti)
    .run();
  const consumedChanges = Number((consumeResult as { meta?: { changes?: number } }).meta?.changes ?? 0);
  if (consumedChanges !== 1) {
    await logNativeReject("handoff_token_replay_or_expired", {
      tagId,
      handoffJti: handoffVerified.payload.jti,
    });
    return NextResponse.json({ error: "Handoff token already used or expired" }, { status: 409 });
  }

  const payload = JSON.stringify({
    tagId,
    url,
    deviceId,
    platform,
    mode,
    appVersion,
    source: "native_app",
    keyId: request.headers.get("x-native-key-id")?.trim() || "current",
    handoffJti: handoffVerified.payload.jti,
    handoffExp: handoffVerified.payload.exp,
    ...(clientError ? { clientError } : {}),
    ...(writtenAt ? { writtenAt } : {}),
  });

  await db.prepare(`
      CREATE TABLE IF NOT EXISTS admin_action_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        actor_email TEXT,
        success BOOLEAN NOT NULL DEFAULT 1,
        payload TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

  await db
    .prepare("INSERT INTO admin_action_logs (action, actor_email, success, payload) VALUES (?, ?, ?, ?)")
    .bind("nfc_native_write", `native-app:${deviceId}`, success ? 1 : 0, payload)
    .run();

  return NextResponse.json({
    ok: true,
    action: "nfc_native_write",
    tagId,
    success,
  });
}
