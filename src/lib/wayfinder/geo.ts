const EARTH_RADIUS_M = 6_371_000;

/** 두 WGS84 좌표 간 거리(미터), Haversine */
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export function formatDistanceMeters(m: number): string {
  if (!Number.isFinite(m) || m < 0) return "—";
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export function parseLatLngQuery(
  latRaw: string | null | undefined,
  lngRaw: string | null | undefined
): { lat: number; lng: number } | null {
  const lat = Number((latRaw ?? "").trim());
  const lng = Number((lngRaw ?? "").trim());
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
