import { getCfRequestContext } from "@/lib/cf-request-context";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { parseSubjectKind } from "@/lib/subject-kind";
import { isPetOwnedBy } from "@/lib/ble-location-events-db";
import { listGeofencesForOwnerKind } from "@/lib/geofences-db";

export const runtime = "edge";

export async function GET(request: Request) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const kind = parseSubjectKind(url.searchParams.get("kind"));

  try {
    const geofences = await listGeofencesForOwnerKind(getDB(), userId, kind);
    return NextResponse.json({ geofences });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pet_id = typeof body.pet_id === "string" ? body.pet_id.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const lat = typeof body.latitude === "number" ? body.latitude : Number(body.latitude);
  const lon = typeof body.longitude === "number" ? body.longitude : Number(body.longitude);
  const radius =
    typeof body.radius_meters === "number" ? body.radius_meters : Number(body.radius_meters);

  if (!pet_id || !name || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: "Invalid latitude or pet_id or name" }, { status: 400 });
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Invalid longitude" }, { status: 400 });
  }
  if (!Number.isFinite(radius) || radius < 10 || radius > 100000) {
    return NextResponse.json({ error: "Invalid radius_meters (10–100000)" }, { status: 400 });
  }

  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDB();
  const owned = await isPetOwnedBy(db, pet_id, userId);
  if (!owned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = nanoid();
  try {
    await db
      .prepare(
        `INSERT INTO geofences (id, owner_id, pet_id, name, latitude, longitude, radius_meters, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
      )
      .bind(id, userId, pet_id, name, lat, lon, radius)
      .run();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}
