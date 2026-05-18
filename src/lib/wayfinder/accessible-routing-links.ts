/** 서울동행맵 등 교통약자 맞춤 경로 연동 (아웃바운드) */

export const SEOUL_COMPANION_APP = {
  name: "서울동행맵",
  description: "단차·경사·보도폭을 고려한 서울 시내 보행·저상버스·지하철 안내",
  playStoreUrl: "https://play.google.com/store/apps/details?id=kr.go.seoul.mydata",
  appStoreUrl: "https://apps.apple.com/kr/app/%EC%84%9C%EC%9A%B8%EB%8F%99%ED%96%89%EB%A7%B5/id1555649324",
  oneStoreUrl: "https://m.onestore.co.kr/mobilepoc/apps/appsDetail.omp?prodId=0000753480",
} as const;

/** 서울특별시 대략 경계 (동행맵 안내 노출용) */
const SEOUL_LAT_MIN = 37.41;
const SEOUL_LAT_MAX = 37.72;
const SEOUL_LNG_MIN = 126.76;
const SEOUL_LNG_MAX = 127.19;

export function isInSeoulMetroBounds(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return lat >= SEOUL_LAT_MIN && lat <= SEOUL_LAT_MAX && lng >= SEOUL_LNG_MIN && lng <= SEOUL_LNG_MAX;
}
