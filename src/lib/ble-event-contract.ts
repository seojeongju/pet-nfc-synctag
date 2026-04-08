/**
 * H1: nRF52 / companion app -> Cloud ble_location_events.event_type contract.
 * Unknown types still allowed up to 64 chars. Below are recommended canonical keys.
 */
export const BLE_CANONICAL_EVENT_TYPES = [
  "ble_scan",
  "ble_connect",
  "ble_lost",
  "phone_gps",
  "geofence_exit",
  "battery_low",
  "button_press",
] as const;

export type BleCanonicalEventType = (typeof BLE_CANONICAL_EVENT_TYPES)[number];

const EVENT_TYPE_ALIASES: Record<string, string> = {
  disconnect: "ble_lost",
  disconnected: "ble_lost",
  lost: "ble_lost",
  proximity: "ble_scan",
  scan: "ble_scan",
  rssi: "ble_scan",
  connect: "ble_connect",
  connected: "ble_connect",
  gps: "phone_gps",
  location: "phone_gps",
  geo_exit: "geofence_exit",
  lowbat: "battery_low",
  battery: "battery_low",
};

const MAX_LEN = 64;

export function normalizeBleEventType(raw: string): string {
  const t = raw.trim().slice(0, MAX_LEN);
  if (!t) return t;
  const key = t.toLowerCase();
  return EVENT_TYPE_ALIASES[key] ?? t;
}

export function isCanonicalBleEventType(t: string): t is BleCanonicalEventType {
  return (BLE_CANONICAL_EVENT_TYPES as readonly string[]).includes(t);
}
