import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { nanoid } from "nanoid";
import { insertBleLocationEvent, isPetOwnedBy, listBleLocationEventsForOwner } from "@/lib/ble-location-events-db";
import { parseBleEventBody } from "@/lib/ble-events-input";
import { parseSubjectKind } from "@/lib/subject-kind";

export const runtime = "edge";

/**
 * BLE·동행 앱에서 보호자 세션으로 위치/근접 이벤트를 기록합니다.
 * POST /api/ble/events
 * Body: { pet_id, event_type, latitude?, longitude?, rssi?, raw_payload? }
 * 성공 시 raw_meta(펌웨어·nonce·tag_id 추출) 포함
 *
 * GET /api/ble/events?pet_id=&kind=&limit=
 * — pet_id 생략 시: 해당 모드(kind)의 전체 관리 대상에 대한 최근 이벤트
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBleEventBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDB();
  const owned = await isPetOwnedBy(db, parsed.value.pet_id, userId);
  if (!owned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = nanoid();
  try {
    await insertBleLocationEvent(db, {
      id,
      owner_id: userId,
      pet_id: parsed.value.pet_id,
      event_type: parsed.value.event_type,
      latitude: parsed.value.latitude,
      longitude: parsed.value.longitude,
      rssi: parsed.value.rssi,
      raw_payload: parsed.value.raw_payload,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: msg }, { status: 500 });
  }

  const res = NextResponse.json({
    ok: true,
    id,
    event_type: parsed.value.event_type,
    raw_meta: parsed.value.raw_meta,
  });
  res.headers.set("X-Pet-ID-Ble-Contract", "2");
  return res;
}

export async function GET(request: Request) {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const kindParam = url.searchParams.get("kind") ?? "pet";
  const subjectKind = parseSubjectKind(kindParam);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 40));
  const petIdFilter = url.searchParams.get("pet_id")?.trim() || null;

  const db = getDB();
  try {
    if (petIdFilter) {
      const owned = await isPetOwnedBy(db, petIdFilter, userId);
      if (!owned) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const { results } = await db
        .prepare(
          `SELECT e.id, e.pet_id, e.event_type, e.latitude, e.longitude, e.rssi, e.raw_payload, e.created_at,
                  p.name AS pet_name, p.photo_url AS pet_photo
           FROM ble_location_events e
           INNER JOIN pets p ON p.id = e.pet_id
           WHERE e.owner_id = ? AND e.pet_id = ?
           ORDER BY datetime(e.created_at) DESC
           LIMIT ?`
        )
        .bind(userId, petIdFilter, limit)
        .all<{
          id: string;
          pet_id: string;
          event_type: string;
          latitude: number | null;
          longitude: number | null;
          rssi: number | null;
          raw_payload: string | null;
          created_at: string;
          pet_name: string;
          pet_photo: string | null;
        }>();
      return NextResponse.json({ events: results ?? [] });
    }

    const events = await listBleLocationEventsForOwner(db, userId, subjectKind, limit);
    return NextResponse.json({ events });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: msg }, { status: 500 });
  }
}
