/** 서울동행맵 등 교통약자 맞춤 경로 연동 (아웃바운드) */

export const SEOUL_COMPANION_APP = {
  name: "서울동행맵",
  tagline: "서울 시내 · 지하철 맞춤 이동",
  description: "단차·경사·보도폭을 반영한 보행 경로와 지하철·저상버스 교통약자 시설을 한 앱에서 안내합니다.",
  playStoreUrl: "https://play.google.com/store/apps/details?id=kr.go.seoul.mydata",
  appStoreUrl: "https://apps.apple.com/kr/app/%EC%84%9C%EC%9A%B8%EB%8F%99%ED%96%89%EB%A7%B5/id1555649324",
  oneStoreUrl: "https://m.onestore.co.kr/mobilepoc/apps/appsDetail.omp?prodId=0000753480",
} as const;

export type SeoulCompanionFeatureIcon = "accessibility" | "train" | "bus";

export const SEOUL_COMPANION_FEATURES: ReadonlyArray<{
  id: string;
  label: string;
  icon: SeoulCompanionFeatureIcon;
}> = [
  { id: "walk", label: "휠체어·유모차 보행", icon: "accessibility" },
  { id: "subway", label: "지하철 역내 시설", icon: "train" },
  { id: "bus", label: "저상버스·환승", icon: "bus" },
];

export type SeoulCompanionStepIcon = "download" | "search" | "route";

export const SEOUL_COMPANION_STEPS_MAIN: ReadonlyArray<{
  title: string;
  body: string;
  icon: SeoulCompanionStepIcon;
}> = [
  {
    title: "앱 설치",
    body: "아래 버튼으로 서울동행맵을 설치합니다.",
    icon: "download",
  },
  {
    title: "출발·도착 설정",
    body: "앱에서 지하철역·장소를 검색해 목적지를 정합니다.",
    icon: "search",
  },
  {
    title: "맞춤 경로 안내",
    body: "단차·경사를 피한 보행·대중교통 경로를 따라 이동합니다.",
    icon: "route",
  },
];

export function seoulCompanionStepsForStation(stationName: string) {
  return [
    {
      title: "앱 설치·실행",
      body: "서울동행맵이 없다면 먼저 설치합니다.",
      icon: "download" as const,
    },
    {
      title: "역 이름 검색",
      body: `앱 검색창에 「${stationName}」을 입력해 이 역을 목적지로 선택합니다.`,
      icon: "search" as const,
    },
    {
      title: "맞춤 경로 따라가기",
      body: "보행·지하철·버스 중 필요한 구간의 교통약자 맞춤 경로를 안내받습니다.",
      icon: "route" as const,
    },
  ];
}

/** 맞춤서비스 이동 — 역할 칩 클릭 시 스크롤 대상 */
export const WAYFINDER_SERVICE_SECTION_IDS = {
  linku: "wf-service-linku",
  seoul: "wf-service-seoul",
  kakao: "wf-service-kakao",
} as const;

export type WayfinderServiceRoleId = keyof typeof WAYFINDER_SERVICE_SECTION_IDS;

export const SEOUL_COMPANION_ROLE_LEGEND: ReadonlyArray<{
  id: WayfinderServiceRoleId;
  label: string;
  hint: string;
  tone: "slate" | "sky" | "amber";
  sectionId: (typeof WAYFINDER_SERVICE_SECTION_IDS)[WayfinderServiceRoleId];
}> = [
  {
    id: "linku",
    label: "링크유-동행",
    hint: "역·시설·NFC",
    tone: "slate",
    sectionId: WAYFINDER_SERVICE_SECTION_IDS.linku,
  },
  {
    id: "seoul",
    label: "서울동행맵",
    hint: "맞춤 보행·지하철",
    tone: "sky",
    sectionId: WAYFINDER_SERVICE_SECTION_IDS.seoul,
  },
  {
    id: "kakao",
    label: "카카오맵",
    hint: "참고 경로",
    tone: "amber",
    sectionId: WAYFINDER_SERVICE_SECTION_IDS.kakao,
  },
];

/** 서울특별시 대략 경계 (동행맵 안내 노출용) */
const SEOUL_LAT_MIN = 37.41;
const SEOUL_LAT_MAX = 37.72;
const SEOUL_LNG_MIN = 126.76;
const SEOUL_LNG_MAX = 127.19;

export function isInSeoulMetroBounds(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return lat >= SEOUL_LAT_MIN && lat <= SEOUL_LAT_MAX && lng >= SEOUL_LNG_MIN && lng <= SEOUL_LNG_MAX;
}
