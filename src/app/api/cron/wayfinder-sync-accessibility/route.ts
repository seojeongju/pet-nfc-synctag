import { NextResponse } from "next/server";
import { getCfRequestContext } from "@/lib/cf-request-context";
import {
  METRO_SYNC_DEFAULT_BATCH_SIZE,
  syncMetroStationsAccessibilityBatch,
} from "@/lib/wayfinder/sync-station-accessibility";
import { getMetroSyncOffset, setMetroSyncOffset } from "@/lib/wayfinder/sync-meta-db";

export const runtime = "edge";

function authorizeCron(request: Request, secret: string | undefined): boolean {
  if (!secret?.trim()) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ") && auth.slice(7).trim() === secret.trim()) return true;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret.trim();
}

/**
 * Cloudflare Cron Triggers 등에서 호출.
 * 수도권 배치 1회 실행 후 D1에 다음 offset 저장.
 * 환경 변수: CRON_SECRET, PUBLIC_DATA_API_KEY
 */
export async function GET(request: Request) {
  const ctx = getCfRequestContext();
  const cronSecret = ctx.env.CRON_SECRET?.trim();
  if (!authorizeCron(request, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = ctx.env.PUBLIC_DATA_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "PUBLIC_DATA_API_KEY not configured" }, { status: 503 });
  }

  const db = ctx.env.DB;
  let offset = 0;
  try {
    offset = await getMetroSyncOffset(db);
  } catch {
    /* meta 미적용 시 0부터 */
  }

  const batchSize = METRO_SYNC_DEFAULT_BATCH_SIZE;
  const { results, meta } = await syncMetroStationsAccessibilityBatch(db, apiKey, {
    offset,
    batchSize,
  });

  const nextOffset = meta.done ? 0 : (meta.nextOffset ?? 0);
  try {
    await setMetroSyncOffset(db, nextOffset);
  } catch {
    /* ignore */
  }

  const facilitiesTotal = results.reduce((n, r) => n + r.upserted, 0);
  return NextResponse.json({
    ok: true,
    cron: true,
    offset,
    nextOffset,
    done: meta.done,
    batchSize,
    facilitiesUpserted: facilitiesTotal,
    stationsProcessed: results.length,
    stationsWithErrors: results.filter((r) => r.errors.length > 0).length,
  });
}
