import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { isValidTagUidFormat, normalizeTagUid } from "@/lib/tag-uid-format";

export const runtime = "edge";

type NativeWriteBody = {
  tagId?: unknown;
  url?: unknown;
  deviceId?: unknown;
  success?: unknown;
  clientError?: unknown;
  writtenAt?: unknown;
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

export async function POST(request: Request) {
  const expectedToken = process.env.NFC_NATIVE_APP_API_KEY?.trim();
  if (!expectedToken) {
    return NextResponse.json({ error: "NFC_NATIVE_APP_API_KEY not configured" }, { status: 503 });
  }

  const token = getBearerToken(request);
  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: NativeWriteBody;
  try {
    body = (await request.json()) as NativeWriteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tagIdRaw = getStringOrNull(body.tagId);
  const url = getStringOrNull(body.url);
  const deviceId = getStringOrNull(body.deviceId) ?? "unknown-device";
  const success = typeof body.success === "boolean" ? body.success : null;
  const clientError = getStringOrNull(body.clientError);
  const writtenAt = getStringOrNull(body.writtenAt);

  if (!tagIdRaw || !url || success === null) {
    return NextResponse.json({ error: "tagId, url, success are required" }, { status: 400 });
  }

  const tagId = normalizeTagUid(tagIdRaw);
  if (!isValidTagUidFormat(tagId)) {
    return NextResponse.json({ error: "Invalid tagId format" }, { status: 400 });
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
