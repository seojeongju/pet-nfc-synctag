import type { WayfinderFacilityRow } from "@/lib/wayfinder/facility-types";
import { draftToFacilityId } from "@/lib/wayfinder/seoul-metro-wksn-client";

/** API 키·D1 동기화 전에도 파일럿 역 상세 UX 검증용 (대표 시설 예시) */
const PILOT_BY_STATION_NAME: Record<
  string,
  Omit<WayfinderFacilityRow, "station_id" | "synced_at" | "external_source">[]
> = {
  서울: [
    {
      id: "",
      facility_type: "elevator",
      label: "엘리베이터 · 1번 출입구",
      description: "서울역 · 1·4호선",
      line_name: "1·4호선",
      floor_text: "지하 1층",
      entrance_no: "1",
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:seoul:elv:1",
    },
    {
      id: "",
      facility_type: "elevator",
      label: "엘리베이터 · 대합실 연결",
      description: "서울역",
      line_name: "1·4호선",
      floor_text: "지하 2층",
      entrance_no: null,
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:seoul:elv:hall",
    },
    {
      id: "",
      facility_type: "wheelchair_lift",
      label: "휠체어리프트 · 2번 출입구",
      description: "서울역",
      line_name: null,
      floor_text: "지상 1층",
      entrance_no: "2",
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:seoul:lift:2",
    },
    {
      id: "",
      facility_type: "accessible_toilet",
      label: "장애인 화장실 · 대합실",
      description: "서울역",
      line_name: null,
      floor_text: "지하 1층",
      entrance_no: null,
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:seoul:toilet:1",
    },
  ],
  강남: [
    {
      id: "",
      facility_type: "elevator",
      label: "엘리베이터 · 1번 출입구",
      description: "강남역 · 2·신분당선",
      line_name: "2·신분당선",
      floor_text: "지하 1층",
      entrance_no: "1",
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:gangnam:elv:1",
    },
    {
      id: "",
      facility_type: "elevator",
      label: "엘리베이터 · 환승통로",
      description: "강남역",
      line_name: "2호선",
      floor_text: "지하 2층",
      entrance_no: null,
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:gangnam:elv:transfer",
    },
    {
      id: "",
      facility_type: "accessible_toilet",
      label: "장애인 화장실 · 승강장",
      description: "강남역",
      line_name: null,
      floor_text: "지하 2층",
      entrance_no: null,
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:gangnam:toilet",
    },
  ],
  잠실: [
    {
      id: "",
      facility_type: "elevator",
      label: "엘리베이터 · 3번 출입구",
      description: "잠실역 · 2·8호선",
      line_name: "2·8호선",
      floor_text: "지하 1층",
      entrance_no: "3",
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:jamsil:elv:3",
    },
    {
      id: "",
      facility_type: "wheelchair_lift",
      label: "휠체어리프트 · 롯데월드몰 연결",
      description: "잠실역",
      line_name: null,
      floor_text: "지하 2층",
      entrance_no: null,
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:jamsil:lift",
    },
    {
      id: "",
      facility_type: "accessible_toilet",
      label: "장애인 화장실 · 대합실",
      description: "잠실역",
      line_name: null,
      floor_text: "지하 1층",
      entrance_no: null,
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:jamsil:toilet",
    },
  ],
  홍대입구: [
    {
      id: "",
      facility_type: "elevator",
      label: "엘리베이터 · 1번 출입구",
      description: "홍대입구역",
      line_name: "2·공항철도·경의중앙",
      floor_text: "지하 1층",
      entrance_no: "1",
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:hongdae:elv:1",
    },
    {
      id: "",
      facility_type: "elevator",
      label: "엘리베이터 · 공항철도 환승",
      description: "홍대입구역",
      line_name: "공항철도",
      floor_text: "지하 3층",
      entrance_no: null,
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:hongdae:elv:arex",
    },
    {
      id: "",
      facility_type: "accessible_toilet",
      label: "장애인 화장실 · 대합실",
      description: "홍대입구역",
      line_name: null,
      floor_text: "지하 2층",
      entrance_no: null,
      operation_status: "Y",
      latitude: null,
      longitude: null,
      external_ref: "seed:hongdae:toilet",
    },
  ],
};

function stationNameKey(name: string): string | null {
  const base = name.replace(/역$/u, "").trim();
  if (base.includes("서울")) return "서울";
  if (base.includes("강남")) return "강남";
  if (base.includes("잠실")) return "잠실";
  if (base.includes("홍대")) return "홍대입구";
  return PILOT_BY_STATION_NAME[base] ? base : null;
}

export function getPilotAccessibilityFacilities(
  stationId: string,
  stationName: string
): WayfinderFacilityRow[] {
  const key = stationNameKey(stationName);
  if (!key) return [];
  const templates = PILOT_BY_STATION_NAME[key];
  if (!templates?.length) return [];

  const now = new Date().toISOString();
  return templates.map((t) => ({
    ...t,
    id: draftToFacilityId(stationId, t.external_ref ?? t.label),
    station_id: stationId,
    external_source: "pilot_seed",
    synced_at: now,
  }));
}
