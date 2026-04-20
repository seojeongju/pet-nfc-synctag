import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { isValidTagUidFormat, normalizeTagUid } from "@/lib/tag-uid-format";
import { verifyNativeHandoffToken, verifyWithSecret } from "@/lib/nfc-native-security";

export const runtime = "edge";

type NativeWriteBody = {
  tagId?: unknown;
  url?: unknown;
  deviceId?: unknown;
  success?: unknown;
  clientError?: unknown;
  writtenAt?: unknown;
  handoffToken?: unknown;
};

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  const signatureOk = await verifyNativeSignature(request, rawBody);
  if (!signatureOk) {
    return NextResponse.json({ error: "Invalid native signature" }, { status: 401 });
  }

  let body: NativeWriteBody;
  try {
    body = JSON.parse(rawBody) as NativeWriteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tagIdRaw = getStringOrNull(body.tagId);
  const url = getStringOrNull(body.url);
  const deviceId = getStringOrNull(body.deviceId) ?? "unknown-device";
  const success = typeof body.success === "boolean" ? body.success : null;
  const clientError = getStringOrNull(body.clientError);
  const writtenAt = getStringOrNull(body.writtenAt);
  const handoffToken = getStringOrNull(body.handoffToken);

  if (!tagIdRaw || !url || success === null || !handoffToken) {
    return NextResponse.json({ error: "tagId, url, success, handoffToken are required" }, { status: 400 });
  }

  const tagId = normalizeTagUid(tagIdRaw);
  if (!isValidTagUidFormat(tagId)) {
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
    return NextResponse.json({ error: `Invalid handoff token: ${handoffVerified.error}` }, { status: 401 });
  }

  const db = getDB();
  const tag = await db.prepare("SELECT id FROM tags WHERE id = ?").bind(tagId).first<{ id: string }>();
  if (!tag) {
    return NextResponse.json({ error: "Unknown tagId" }, { status: 404 });
  }

  const payload = JSON.stringify({
    tagId,
    url,
    deviceId,
    source: "native_app",
    keyId: request.headers.get("x-native-key-id")?.trim() || "current",
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
