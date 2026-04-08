export const BLE_RAW_FW_MAX = 32;
export const BLE_RAW_NONCE_MAX = 128;
export const BLE_RAW_TAG_ID_MAX = 64;

export type BleRawMeta = {
  firmware_version: string | null;
  device_nonce: string | null;
  tag_id: string | null;
};

function pickTrunc(obj: Record<string, unknown>, keys: string[], max: number): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    let s: string;
    if (typeof v === "string") s = v.trim();
    else if (typeof v === "number" && Number.isFinite(v)) s = String(v);
    else if (typeof v === "boolean") s = v ? "true" : "false";
    else continue;
    if (!s) continue;
    return s.length > max ? s.slice(0, max) : s;
  }
  return null;
}

const emptyMeta = (): BleRawMeta => ({
  firmware_version: null,
  device_nonce: null,
  tag_id: null,
});

/** raw_payload(JSON 권장)에서 펌웨어·nonce·태그 ID만 추출. 저장 문자열은 변경하지 않음. */
export function extractBleRawMeta(raw_payload: string | null): BleRawMeta {
  if (!raw_payload?.trim()) return emptyMeta();
  try {
    const p = JSON.parse(raw_payload) as unknown;
    if (!p || typeof p !== "object" || Array.isArray(p)) return emptyMeta();
    const o = p as Record<string, unknown>;
    return {
      firmware_version: pickTrunc(o, ["fw", "firmware_version"], BLE_RAW_FW_MAX),
      device_nonce: pickTrunc(o, ["device_nonce", "nonce"], BLE_RAW_NONCE_MAX),
      tag_id: pickTrunc(o, ["tag_id"], BLE_RAW_TAG_ID_MAX),
    };
  } catch {
    return emptyMeta();
  }
}
