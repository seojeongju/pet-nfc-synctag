import { getCfRequestContext } from "@/lib/cf-request-context";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";

export const runtime = "edge";

export async function POST(request: Request) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const endpoint = typeof b.endpoint === "string" ? b.endpoint.trim() : "";
  const keys = b.keys as Record<string, unknown> | undefined;
  const p256dh = typeof keys?.p256dh === "string" ? keys.p256dh : "";
  const authSecret = typeof keys?.auth === "string" ? keys.auth : "";
  if (!endpoint || !p256dh || !authSecret) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const db = getDB();
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS guardian_push_subscriptions (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "user_id TEXT NOT NULL, " +
        "endpoint TEXT NOT NULL UNIQUE, " +
        "p256dh TEXT NOT NULL, " +
        "auth TEXT NOT NULL, " +
        "created_at DATETIME DEFAULT CURRENT_TIMESTAMP, " +
        "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
        ")"
    )
    .run()
    .catch(() => {});

  try {
    await db
      .prepare(
        `INSERT INTO guardian_push_subscriptions (user_id, endpoint, p256dh, auth)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET
           user_id = excluded.user_id,
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           updated_at = datetime('now')`
      )
      .bind(userId, endpoint, p256dh, authSecret)
      .run();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}

export async function DELETE(request: Request) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const endpoint = typeof (body as { endpoint?: string }).endpoint === "string"
    ? (body as { endpoint: string }).endpoint.trim()
    : "";
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  const db = getDB();
  try {
    await db
      .prepare(
        "DELETE FROM guardian_push_subscriptions WHERE user_id = ? AND endpoint = ?"
      )
      .bind(userId, endpoint)
      .run();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
