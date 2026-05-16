import { NextResponse } from "next/server";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { getWayfinderStationById } from "@/lib/wayfinder-stations-db";
import {
  syncAllActiveWayfinderStationsAccessibility,
  syncWayfinderStationAccessibility,
} from "@/lib/wayfinder/sync-station-accessibility";

export const runtime = "edge";

async function requirePlatformAdmin(request: Request) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const row = await context.env.DB.prepare("SELECT role FROM user WHERE id = ?")
    .bind(userId)
    .first<{ role?: string | null }>();

  if (!isPlatformAdminRole(row?.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { context };
}

/**
 * 공공데이터(서울교통공사 교통약자이용정보) → D1 wayfinder_station_facilities 동기화.
 * POST body: { stationId?: string, limit?: number }
 */
export async function POST(request: Request) {
  const authz = await requirePlatformAdmin(request);
  if ("error" in authz) return authz.error;

  const apiKey = authz.context.env.PUBLIC_DATA_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "PUBLIC_DATA_API_KEY not configured",
        hint: "Cloudflare Pages 환경 변수에 공공데이터포털 서비스키를 설정하세요.",
      },
      { status: 503 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const stationId = typeof body.stationId === "string" ? body.stationId.trim() : "";
  const limit =
    typeof body.limit === "number" && Number.isFinite(body.limit)
      ? Math.min(50, Math.max(1, Math.floor(body.limit)))
      : undefined;

  try {
    const db = authz.context.env.DB;

    if (stationId) {
      const station = await getWayfinderStationById(db, stationId);
      if (!station) {
        return NextResponse.json({ error: "Station not found" }, { status: 404 });
      }
      const result = await syncWayfinderStationAccessibility(db, station, apiKey);
      return NextResponse.json({ ok: true, results: [result] });
    }

    const results = await syncAllActiveWayfinderStationsAccessibility(db, apiKey, { limit });
    return NextResponse.json({ ok: true, results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Sync failed", detail: msg }, { status: 500 });
  }
}
