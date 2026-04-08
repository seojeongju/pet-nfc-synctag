import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { haversineDistanceMeters } from "@/lib/geo";
import { isPetOwnedBy, insertBleLocationEvent } from "@/lib/ble-location-events-db";
import { listGeofencesForPet } from "@/lib/geofences-db";

export const runtime = "edge";

type FenceResult = {
  id: string;
  name: string;
  inside: boolean;
  distance_meters: number;
  radius_meters: number;
};

/**
 * POST /api/geofence/check
 * Body: { pet_id, latitude, longitude, record_breach?: boolean }
 * Returns whether the point lies inside any active circular fence; optional BLE event on exit.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pet_id = typeof body.pet_id === "string" ? body.pet_id.trim() : "";
  const lat = typeof body.latitude === "number" ? body.latitude : Number(body.latitude);
  const lon = typeof body.longitude === "number" ? body.longitude : Number(body.longitude);
  const recordBreach = body.record_breach === true;

  if (!pet_id || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: "Invalid pet_id or latitude" }, { status: 400 });
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Invalid longitude" }, { status: 400 });
  }

  const context = getRequestContext();
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

  let fences: FenceResult[] = [];
  try {
    const rows = await listGeofencesForPet(db, pet_id, userId);
    const active = rows.filter((g) => g.is_active);
    fences = active.map((g) => {
      const d = haversineDistanceMeters(lat, lon, g.latitude, g.longitude);
      return {
        id: g.id,
        name: g.name,
        inside: d <= g.radius_meters,
        distance_meters: Math.round(d * 10) / 10,
        radius_meters: g.radius_meters,
      };
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: msg }, { status: 500 });
  }

  const insideAny = fences.some((f) => f.inside);
  let breachEventId: string | null = null;

  if (recordBreach && fences.length > 0 && !insideAny) {
    const id = nanoid();
    try {
      await insertBleLocationEvent(db, {
        id,
        owner_id: userId,
        pet_id,
        event_type: "geofence_exit",
        latitude: lat,
        longitude: lon,
        rssi: null,
        raw_payload: JSON.stringify({ fences: fences.map((f) => ({ id: f.id, name: f.name, distance_meters: f.distance_meters })) }),
      });
      breachEventId = id;
    } catch {
      /* table missing or write fail — still return geometry result */
    }
  }

  return NextResponse.json({
    pet_id,
    inside_any: insideAny,
    fences,
    breach_recorded_id: breachEventId,
  });
}
