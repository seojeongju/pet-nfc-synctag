/** "true" 일 때만 보호자 BLE 동행 앱 온보딩 UI 노출 */
export function isBleCompanionEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BLE_COMPANION_ENABLED === "true";
}

export function getBleCompanionAppStoreUrl(): string {
  return (process.env.NEXT_PUBLIC_BLE_COMPANION_APP_STORE_URL || "").trim();
}
