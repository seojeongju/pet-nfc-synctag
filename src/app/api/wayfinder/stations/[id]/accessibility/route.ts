import { NextResponse } from "next/server";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getWayfinderStationById } from "@/lib/wayfinder-stations-db";
import { listWayfinderStationFacilities } from "@/lib/wayfinder-station-facilities-db";
import { toPublicFacility } from "@/lib/wayfinder/facility-types";

export const runtime = "edge";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * 역별 교통약자 편의시설 (D1 캐시 → 파일럿 시드 폴백). 인증 없음.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const stationId = typeof id === "string" ? id.trim() : "";
  if (!stationId) {
    return NextResponse.json({ error: "Invalid station id" }, { status: 400 });
  }

  try {
    const cf = getCfRequestContext();
    const station = await getWayfinderStationById(cf.env.DB, stationId);
    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    const { facilities, source } = await listWayfinderStationFacilities(
      cf.env.DB,
      station.id,
      station.name
    );

    const grouped: Record<string, ReturnType<typeof toPublicFacility>[]> = {};
    for (const row of facilities) {
      const pub = toPublicFacility(row);
      if (!grouped[pub.type]) grouped[pub.type] = [];
      grouped[pub.type].push(pub);
    }

    return NextResponse.json({
      stationId: station.id,
      stationName: station.name,
      source,
      total: facilities.length,
      facilities: facilities.map(toPublicFacility),
      grouped,
      syncedAt: facilities[0]?.synced_at ?? null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 });
  }
}
