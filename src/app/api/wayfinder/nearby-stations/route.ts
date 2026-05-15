import { NextResponse } from "next/server";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { findNearbyWayfinderStations } from "@/lib/wayfinder-stations-db";
import { formatDistanceMeters, parseLatLngQuery } from "@/lib/wayfinder/geo";

export const runtime = "edge";

/**
 * GPS 좌표 기준 가까운 지하철역(파일럿 DB). 인증 없음.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const coords = parseLatLngQuery(url.searchParams.get("lat"), url.searchParams.get("lng"));
  if (!coords) {
    return NextResponse.json({ error: "Invalid lat or lng" }, { status: 400 });
  }

  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw != null && limitRaw !== "" ? Number(limitRaw) : 5;
  if (!Number.isFinite(limit) || limit < 1) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  try {
    const context = getCfRequestContext();
    const nearby = await findNearbyWayfinderStations(context.env.DB, coords.lat, coords.lng, limit);
    return NextResponse.json({
      query: { lat: coords.lat, lng: coords.lng },
      stations: nearby.map((s) => ({
        id: s.id,
        name: s.name,
        lines: s.lines,
        latitude: s.latitude,
        longitude: s.longitude,
        distanceM: Math.round(s.distanceM),
        distanceLabel: formatDistanceMeters(s.distanceM),
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 });
  }
}
