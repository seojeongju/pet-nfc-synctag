/** 대시보드·허브·하단 탭 등 내비에 표시하는 기능명 */
export const linkuCompanionMenuTitle = "링크유-동행";

/** 메인 가치: 위치 기반 지하철·교통약자 이동 안내 */
export const linkuCompanionServiceDescription = "지하철·교통약자 이동 경로 안내";

/** 공개·대시보드 리드 (한 줄) */
export const linkuCompanionMainLead =
  "지금 위치에서 가까운 지하철역을 찾고, 카카오맵으로 역까지·역 안 이동 방향을 안내합니다.";

/** 서브 기능 라벨 */
export const linkuCompanionSpotSubLabel = "시설·지점 안내";

export const linkuCompanionSpotSubDescription =
  "NFC 태그 스캔 시 기본은 GPS·가까운 역 안내입니다. 특정 지점(엘리베이터 앞 등) 메타를 연결하면 보조 안내 카드가 함께 표시됩니다.";

/** 공개 동행 화면 — 보조 스팟 안내 아코디언 */
export const linkuCompanionSpotAuxiliaryLead =
  "태그를 찍으면 먼저 지하철·길찾기 안내가 열리고, 시설에 연결된 지점이 있으면 그곳 안내 카드가 더해집니다.";

export const linkuCompanionSpotExamplePlaces = [
  "안내 데스크",
  "엘리베이터 앞",
  "역무실·개찰구",
  "장애인 화장실 앞",
] as const;

/** 대상 이용자 (칩 표시) */
export const wayfinderAudienceTags = [
  "휠체어",
  "시각장애",
  "유모차·보호자",
  "교통약자",
] as const;
