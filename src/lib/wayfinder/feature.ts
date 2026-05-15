/**
 * 링크유-동행 베타 게이트: 공개 /wayfinder 및 대시보드 동행 화면의 상세(로드맵) 블록만 제어합니다.
 * (대시보드 메인 그리드·하단 바에는 동행 메뉴를 두지 않고, 허브 모드 선택에서만 진입합니다.)
 */
export function isWayfinderEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WAYFINDER_ENABLED === "true";
}
