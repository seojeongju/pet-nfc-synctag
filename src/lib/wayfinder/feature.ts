/**
 * 링크유-동행(교통약자 맞춤 이동·시설 안내) UI·향후 API 게이트.
 * 운영 배포에서는 false 또는 미설정 유지 → 공개 /wayfinder 는 404 처리.
 */
export function isWayfinderEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WAYFINDER_ENABLED === "true";
}
