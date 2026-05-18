/** 역 상세 진입 맥락 (근처 역 목록·NFC 등) */

export type WayfinderStationEntryContext = {
  fromNearby: boolean;
  distanceM: number | null;
  isNearestFromGps: boolean;
};

export function formatDistanceMeters(m: number): string {
  if (!Number.isFinite(m) || m < 0) return "";
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)}km`;
}

export function parseStationEntryFromSearchParams(
  sp: Record<string, string | string[] | undefined>
): WayfinderStationEntryContext {
  const from = typeof sp.from === "string" ? sp.from.trim().toLowerCase() : "";
  const distRaw = typeof sp.dist === "string" ? sp.dist.trim() : "";
  const nearestRaw = typeof sp.nearest === "string" ? sp.nearest.trim() : "";

  const distanceM = distRaw ? Number(distRaw) : NaN;
  const fromNearby = from === "nearby";
  const isNearestFromGps = nearestRaw === "1" || nearestRaw.toLowerCase() === "true";

  return {
    fromNearby,
    distanceM: fromNearby && Number.isFinite(distanceM) && distanceM >= 0 ? Math.round(distanceM) : null,
    isNearestFromGps: fromNearby && isNearestFromGps,
  };
}

export function buildStationDetailHref(
  stationId: string,
  options?: { distanceM?: number; isNearest?: boolean; facilityId?: string }
): string {
  const base = `/wayfinder/stations/${encodeURIComponent(stationId)}`;
  const q = new URLSearchParams();
  if (options?.facilityId?.trim()) q.set("facility", options.facilityId.trim());
  if (options?.distanceM != null && Number.isFinite(options.distanceM)) {
    q.set("from", "nearby");
    q.set("dist", String(Math.round(options.distanceM)));
    if (options.isNearest) q.set("nearest", "1");
  }
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}
