export type WayfinderFacilityType =
  | "elevator"
  | "wheelchair_lift"
  | "accessible_toilet"
  | "sign_language_phone"
  | "wheelchair_charger"
  | "safety_step"
  | "movement_path"
  | "traffic_weak_assistant"
  | "other";

export type WayfinderFacilityRow = {
  id: string;
  station_id: string;
  facility_type: WayfinderFacilityType;
  label: string;
  description: string | null;
  line_name: string | null;
  floor_text: string | null;
  entrance_no: string | null;
  operation_status: string | null;
  latitude: number | null;
  longitude: number | null;
  external_source: string;
  external_ref: string | null;
  synced_at: string | null;
};

export type WayfinderFacilityPublic = {
  id: string;
  type: WayfinderFacilityType;
  typeLabel: string;
  label: string;
  description: string | null;
  lineName: string | null;
  floor: string | null;
  entrance: string | null;
  operationStatus: string | null;
  operationLabel: string | null;
};

export const FACILITY_TYPE_LABELS: Record<WayfinderFacilityType, string> = {
  elevator: "엘리베이터",
  wheelchair_lift: "휠체어리프트",
  accessible_toilet: "장애인 화장실",
  sign_language_phone: "수어영상전화",
  wheelchair_charger: "휠체어 급속충전",
  safety_step: "안전발판",
  movement_path: "이동통로",
  traffic_weak_assistant: "교통약자 도우미",
  other: "편의시설",
};

export function operationStatusLabel(status: string | null | undefined): string | null {
  if (!status?.trim()) return null;
  const s = status.trim().toUpperCase();
  if (["Y", "YES", "1", "운영", "OPERATING", "사용", "가능", "정상"].some((k) => s.includes(k))) {
    return "운영 중";
  }
  if (["N", "NO", "0", "중단", "CLOSED", "미운영", "불가"].some((k) => s.includes(k))) {
    return "운영 중단";
  }
  return status.trim();
}

export function toPublicFacility(row: WayfinderFacilityRow): WayfinderFacilityPublic {
  return {
    id: row.id,
    type: row.facility_type,
    typeLabel: FACILITY_TYPE_LABELS[row.facility_type] ?? FACILITY_TYPE_LABELS.other,
    label: row.label,
    description: row.description,
    lineName: row.line_name,
    floor: row.floor_text,
    entrance: row.entrance_no,
    operationStatus: row.operation_status,
    operationLabel: operationStatusLabel(row.operation_status),
  };
}
