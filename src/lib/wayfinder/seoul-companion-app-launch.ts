/** 서울동행맵 앱 실행·설치 (웹 → 네이티브) */

import { SEOUL_COMPANION_APP } from "@/lib/wayfinder/accessible-routing-links";

const INSTALLED_STORAGE_KEY = "linku_seoul_companion_app_installed";

/** 공개 문서 미제공 — 패키지·마이티(My-T) 계승 스킴 추정. env로 덮어쓸 수 있음 */
const LAUNCH_SCHEME =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SEOUL_COMPANION_LAUNCH_SCHEME?.trim()) ||
  "mydata";

const ANDROID_PACKAGE = "kr.go.seoul.mydata";

export type SeoulCompanionPlatform = "android" | "ios" | "other";

export function detectSeoulCompanionPlatform(): SeoulCompanionPlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "other";
}

export function getSeoulCompanionStoreUrl(platform: SeoulCompanionPlatform = detectSeoulCompanionPlatform()): string {
  if (platform === "ios") return SEOUL_COMPANION_APP.appStoreUrl;
  return SEOUL_COMPANION_APP.playStoreUrl;
}

export function buildSeoulCompanionLaunchUrl(): string {
  const path = "";
  return `${LAUNCH_SCHEME}://${path}`;
}

/** Android Chrome: 앱 실행 실패 시 스토어로 폴백 */
export function buildSeoulCompanionAndroidIntentUrl(fallbackStoreUrl: string): string {
  const fallback = encodeURIComponent(fallbackStoreUrl);
  return `intent://open#Intent;scheme=${encodeURIComponent(LAUNCH_SCHEME)};package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
}

export function readSeoulCompanionInstalledFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(INSTALLED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSeoulCompanionInstalled(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(INSTALLED_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearSeoulCompanionInstalledFlag(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(INSTALLED_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

type OpenOptions = {
  onOpened?: () => void;
  onFallback?: () => void;
  fallbackMs?: number;
};

/**
 * 앱 실행을 시도하고, 화면이 백그라운드로 가면 설치됨으로 기록합니다.
 * 미설치·데스크톱은 스토어(또는 intent 폴백)로 이동합니다.
 */
export function openSeoulCompanionApp(options: OpenOptions = {}): void {
  if (typeof window === "undefined") return;

  const platform = detectSeoulCompanionPlatform();
  const storeUrl = getSeoulCompanionStoreUrl(platform);
  const fallbackMs = options.fallbackMs ?? 1400;
  const alreadyInstalled = readSeoulCompanionInstalledFlag();

  const goStore = () => {
    options.onFallback?.();
    window.location.href = storeUrl;
  };

  if (platform === "other" && !alreadyInstalled) {
    goStore();
    return;
  }

  let cleared = false;
  const cleanup = () => {
    if (cleared) return;
    cleared = true;
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      markSeoulCompanionInstalled();
      options.onOpened?.();
      cleanup();
    }
  };

  const onPageHide = () => {
    markSeoulCompanionInstalled();
    options.onOpened?.();
    cleanup();
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);

  const timer = window.setTimeout(() => {
    cleanup();
    if (!readSeoulCompanionInstalledFlag()) {
      goStore();
    }
  }, fallbackMs);

  if (platform === "android") {
    window.location.href = alreadyInstalled
      ? buildSeoulCompanionLaunchUrl()
      : buildSeoulCompanionAndroidIntentUrl(storeUrl);
    return;
  }

  if (platform === "ios") {
    window.location.href = buildSeoulCompanionLaunchUrl();
    return;
  }

  window.location.href = buildSeoulCompanionLaunchUrl();
}
