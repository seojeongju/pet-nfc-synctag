export function getDashboardBleNavLabel(): string {
  return "BLE 동행";
}

export function getDashboardBlePageTitle(): string {
  return "BLE 동행 앱 연결";
}

export function getDashboardBlePageDescription(modeLabel: string): string {
  return `${modeLabel} 모드에서 등록된 태그의 BLE MAC을 동행 앱과 연결하고, 근접·이탈 기록을 확인할 수 있어요.`;
}
