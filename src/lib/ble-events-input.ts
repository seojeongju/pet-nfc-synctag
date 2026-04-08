import { normalizeBleEventType } from "./ble-event-contract";
import { extractBleRawMeta, type BleRawMeta } from "./ble-raw-payload";

const EVENT_TYPE_MAX = 64;
const RAW_PAYLOAD_MAX = 8192;

export type BleEventInputNormalized = {
  pet_id: string;
  event_type: string;
  latitude: number | null;
  longitude: number | null;
  rssi: number | null;
  raw_payload: string | null;
  /** raw_payload JSON에서 추출(응답·액션 반환용). DB에는 raw_payload 문자열만 저장 */
  raw_meta: BleRawMeta;
};

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? Math.trunc(v) : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

/** POST /api/ble/events JSON 본문 검증 */
export function parseBleEventBody(body: unknown): { ok: true; value: BleEventInputNormalized } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid JSON body" };
  }
  const o = body as Record<string, unknown>;
  const pet_id = typeof o.pet_id === "string" ? o.pet_id.trim() : "";
  const rawEventType =
    typeof o.event_type === "string" ? o.event_type.trim().slice(0, EVENT_TYPE_MAX) : "";
  const event_type = rawEventType ? normalizeBleEventType(rawEventType) : "";
  if (!pet_id) return { ok: false, error: "pet_id is required" };
  if (!event_type) return { ok: false, error: "event_type is required" };

  let raw_payload: string | null = null;
  if (o.raw_payload !== undefined && o.raw_payload !== null) {
    const s = typeof o.raw_payload === "string" ? o.raw_payload : JSON.stringify(o.raw_payload);
    raw_payload = s.slice(0, RAW_PAYLOAD_MAX);
  }
  const raw_meta = extractBleRawMeta(raw_payload);

  return {
    ok: true,
    value: {
      pet_id,
      event_type,
      latitude: numOrNull(o.latitude),
      longitude: numOrNull(o.longitude),
      rssi: intOrNull(o.rssi),
      raw_payload,
      raw_meta,
    },
  };
}
