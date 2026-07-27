import { normalizeBleMac } from "@/lib/device-mode";

/** BLE MAC: AA:BB:CC:DD:EE:FF (대시·콜론 허용) */
const BLE_MAC_RE = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;

export { normalizeBleMac };

export function isValidBleMac(input: string): boolean {
  const mac = normalizeBleMac(input);
  if (!mac) return false;
  return BLE_MAC_RE.test(mac);
}
