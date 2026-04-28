/**
 * 카카오 로컬 API — 좌표→주소(역지오코딩)
 * @see https://developers.kakao.com/docs/latest/ko/local/dev-guide#coord-to-address
 *
 * 서버 전용 `KAKAO_REST_API_KEY` 필요 (JavaScript 키와 다름).
 */

const COORD2ADDRESS = "https://dapi.kakao.com/v2/local/geo/coord2address.json";

export type KakaoReverseGeocodeResult = {
  /** 표시용: 도로명 우선, 없으면 지번 */
  label: string;
  road?: string;
  jibun?: string;
};

function getKakaoRestKey(): string | null {
  const k = process.env.KAKAO_REST_API_KEY?.trim();
  return k || null;
}

/**
 * WGS84 위도·경도 → 한국어 주소 문자열.
 * 키 없음·API 실패 시 null.
 */
export async function reverseGeocodeToKoreanAddress(
  lat: number,
  lng: number
): Promise<KakaoReverseGeocodeResult | null> {
  const key = getKakaoRestKey();
  if (!key) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const url = new URL(COORD2ADDRESS);
  url.searchParams.set("x", String(lng));
  url.searchParams.set("y", String(lat));
  url.searchParams.set("input_coord", "WGS84");

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: `KakaoAK ${key}` },
      signal: ac.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      documents?: Array<{
        address?: { address_name?: string };
        road_address?: { address_name?: string } | null;
      }>;
    };
    const doc = data.documents?.[0];
    if (!doc) return null;
    const road = doc.road_address?.address_name?.trim();
    const jibun = doc.address?.address_name?.trim();
    const label = (road || jibun || "").trim();
    if (!label) return null;
    return { label, road, jibun };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type RowWithCoords = { latitude?: unknown; longitude?: unknown };

function parseLatLng(lat: unknown, lng: unknown): [number, number] | null {
  const la = lat != null && lat !== "" ? Number(lat) : NaN;
  const ln = lng != null && lng !== "" ? Number(lng) : NaN;
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  return [la, ln];
}

function roundCoordKey(lat: number, lng: number) {
  return `${Math.round(lat * 1e5)}_${Math.round(lng * 1e5)}`;
}

/**
 * 목록 행에 `addressLabel`을 붙입니다. 좌표별로 역지오코딩 1회만 호출(중복 좌표 공유).
 * `KAKAO_REST_API_KEY` 없으면 모두 `addressLabel: null`.
 */
export async function enrichWithKakaoAddressLabels<T extends RowWithCoords>(
  rows: T[]
): Promise<Array<T & { addressLabel: string | null }>> {
  const unique = new Map<string, { lat: number; lng: number }>();
  for (const row of rows) {
    const p = parseLatLng(row.latitude, row.longitude);
    if (!p) continue;
    const k = roundCoordKey(p[0], p[1]);
    if (!unique.has(k)) unique.set(k, { lat: p[0], lng: p[1] });
  }

  const labelByKey = new Map<string, string | null>();
  await Promise.all(
    [...unique.values()].map(async ({ lat, lng }) => {
      const k = roundCoordKey(lat, lng);
      const geo = await reverseGeocodeToKoreanAddress(lat, lng);
      labelByKey.set(k, geo?.label ?? null);
    })
  );

  return rows.map((row) => {
    const p = parseLatLng(row.latitude, row.longitude);
    if (!p) return { ...row, addressLabel: null as string | null };
    const k = roundCoordKey(p[0], p[1]);
    return { ...row, addressLabel: labelByKey.get(k) ?? null };
  });
}
