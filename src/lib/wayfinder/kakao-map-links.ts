export function buildKakaoMapPinHref(name: string, lat: number, lng: number): string {
  return `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;
}

/** 카카오맵 앱·웹 길찾기(목적지). 출발은 사용자 현재 위치 기준 */
export function buildKakaoMapRouteHref(name: string, lat: number, lng: number): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
}
