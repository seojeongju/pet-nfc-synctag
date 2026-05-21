/** PWA·네이티브(Play) 설치 여부 — 전역 설치 배너 숨김용 */

export type InstalledRelatedApp = {
  id?: string;
  platform?: string;
  url?: string;
};

type NavigatorWithRelatedApps = Navigator & {
  standalone?: boolean;
  getInstalledRelatedApps?: () => Promise<InstalledRelatedApp[]>;
};

export function readIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as NavigatorWithRelatedApps;
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/**
 * Chrome: manifest.related_applications 에 등록된 Play·PWA가 이미 설치됐는지 확인.
 * 미지원 브라우저는 false.
 */
export async function detectInstalledRelatedApps(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as NavigatorWithRelatedApps;
  if (!nav.getInstalledRelatedApps) return false;

  try {
    const installed = await nav.getInstalledRelatedApps();
    return installed.length > 0;
  } catch {
    return false;
  }
}
