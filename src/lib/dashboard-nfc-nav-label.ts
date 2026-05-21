/** 태그 연결/관리 화면 갱신 후 상단 네비 라벨 재조회용 */
export const DASHBOARD_LINKED_TAGS_CHANGED_EVENT = "dashboard-linked-tags-changed";

export function getDashboardNfcNavLabel(linkedTagCount: number): string {
  return linkedTagCount > 0 ? "태그 관리" : "태그 연결";
}

export function getDashboardNfcPageTitle(linkedTagCount: number): string {
  return linkedTagCount > 0 ? "태그 연결·관리" : "태그 연결하기";
}

export function getDashboardNfcPageDescription(
  linkedTagCount: number,
  modeLabel: string
): string {
  if (linkedTagCount > 0) {
    return `${modeLabel} 모드에서 연결된 태그를 확인·추가하고, 새 태그도 연결할 수 있어요. 모바일·데스크톱 너비에 맞춰 한 화면에서 진행해요.`;
  }
  return `${modeLabel} 모드에서 태그 UID를 맞추고 프로필에 연결합니다. 모바일·데스크톱 너비에 맞춰 한 화면에서 진행해요.`;
}

export function notifyDashboardLinkedTagsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DASHBOARD_LINKED_TAGS_CHANGED_EVENT));
}
