/**
 * 링크유-동행 기능 스위치. 기본값은 켜짐(운영·로컬 동일).
 * 비활성화하려면 빌드·런타임에 NEXT_PUBLIC_WAYFINDER_ENABLED=false 를 설정합니다.
 * (대시보드 메인 그리드·하단 바에는 동행 메뉴를 두지 않고, 허브 모드 선택에서만 진입합니다.)
 */
export function isWayfinderEnabled(): boolean {
  const raw = (process.env.NEXT_PUBLIC_WAYFINDER_ENABLED ?? "").trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}
