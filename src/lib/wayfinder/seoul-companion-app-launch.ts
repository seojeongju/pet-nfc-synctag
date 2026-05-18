/** 서울동행맵 앱 실행·설치 (웹 → 네이티브) */

import { SEOUL_COMPANION_APP } from "@/lib/wayfinder/accessible-routing-links";

const INSTALLED_STORAGE_KEY = "linku_seoul_companion_app_installed";

/** 공개 문서 미제공 — 패키지·마이티(My-T) 계승 스킴 추정. env로 덮어쓸 수 있음 */
const LAUNCH_SCHEME =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SEOUL_COMPANION_LAUNCH_SCHEME?.trim()) ||
  "mydata";

const LAUNCH_HOST = "launch";

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
  return `${LAUNCH_SCHEME}://${LAUNCH_HOST}`;
}

/** Android: 앱만 실행 (스토어 폴백 없음) */
export function buildSeoulCompanionAndroidDirectIntentUrl(): string {
  return `intent://${LAUNCH_HOST}#Intent;scheme=${encodeURIComponent(LAUNCH_SCHEME)};package=${ANDROID_PACKAGE};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;
}

/** Android: 미설치 시 스토어로 폴백 */
export function buildSeoulCompanionAndroidIntentUrl(fallbackStoreUrl: string): string {
  const fallback = encodeURIComponent(fallbackStoreUrl);
  return `intent://${LAUNCH_HOST}#Intent;scheme=${encodeURIComponent(LAUNCH_SCHEME)};package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
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
  /** UI가 「실행」 상태일 때 true — 스토어 폴백 없이 앱만 연다 */
  assumeInstalled?: boolean;
  onOpened?: () => void;
  onFallback?: () => void;
  fallbackMs?: number;
};

function launchViaCustomScheme(): void {
  const url = buildSeoulCompanionLaunchUrl();
  window.location.href = url;
}

/**
 * 앱 실행을 시도합니다.
 * assumeInstalled: 설치된 기기 — 스토어로 넘기지 않고 앱 실행만 시도.
 */
export function openSeoulCompanionApp(options: OpenOptions = {}): void {
  if (typeof window === "undefined") return;

  const platform = detectSeoulCompanionPlatform();
  const storeUrl = getSeoulCompanionStoreUrl(platform);
  const assumeInstalled =
    options.assumeInstalled === true || readSeoulCompanionInstalledFlag();

  const goStore = () => {
    options.onFallback?.();
    window.location.href = storeUrl;
  };

  if (platform === "other") {
    if (assumeInstalled) {
      launchViaCustomScheme();
    } else {
      goStore();
    }
    return;
  }

  if (assumeInstalled) {
    if (platform === "android") {
      window.location.href = buildSeoulCompanionAndroidDirectIntentUrl();
      return;
    }
    launchViaCustomScheme();
    return;
  }

  const fallbackMs = options.fallbackMs ?? 1600;

  let cleared = false;
  const cleanup = () => {
    if (cleared) return;
    cleared = true;
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("blur", onBlur);
  };

  const onOpened = () => {
    markSeoulCompanionInstalled();
    options.onOpened?.();
    cleanup();
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") onOpened();
  };

  const onPageHide = () => onOpened();
  const onBlur = () => onOpened();

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("blur", onBlur);

  const timer = window.setTimeout(() => {
    cleanup();
    goStore();
  }, fallbackMs);

  if (platform === "android") {
    window.location.href = buildSeoulCompanionAndroidIntentUrl(storeUrl);
    return;
  }

  launchViaCustomScheme();
}
