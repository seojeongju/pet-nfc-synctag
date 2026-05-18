/** 역 상세 — 링크유-동행 고유 기능 (서울동행맵과 분리) */

export type StationLinkuFeatureId = "map" | "facilities" | "filter" | "speech" | "nfc";

export type StationLinkuFeatureAnchor =
  | "wf-station-map"
  | "wf-station-facilities"
  | "wf-station-filter"
  | "wf-station-speech"
  | "wf-station-nfc-spot";

export const STATION_LINKU_FEATURES: ReadonlyArray<{
  id: StationLinkuFeatureId;
  title: string;
  hint: string;
  anchor: StationLinkuFeatureAnchor;
}> = [
  { id: "map", title: "역 시설 지도", hint: "마커·위치 확인", anchor: "wf-station-map" },
  { id: "facilities", title: "편의시설 목록", hint: "엘리베이터·화장실", anchor: "wf-station-facilities" },
  { id: "filter", title: "유형별 찾기", hint: "필터로 빠르게", anchor: "wf-station-filter" },
  { id: "speech", title: "음성 안내", hint: "시설 목록 듣기", anchor: "wf-station-speech" },
  { id: "nfc", title: "NFC 지점 안내", hint: "승강기 앞 등", anchor: "wf-station-nfc-spot" },
];
