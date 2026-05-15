/**
 * 링크유-동행 베타 게이트: 공개 /wayfinder 및 대시보드 동행 화면의 상세(로드맵) 블록만 제어합니다.
 * 허브·대시보드 네비의 링크유-동행 타일/메뉴는 항상 노출됩니다.
 */
export function isWayfinderEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WAYFINDER_ENABLED === "true";
}
