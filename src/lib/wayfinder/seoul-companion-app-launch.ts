/** 서울동행맵 앱 실행·설치 (웹 → 네이티브) */

import { SEOUL_COMPANION_APP } from "@/lib/wayfinder/accessible-routing-links";

const INSTALLED_STORAGE_KEY = "linku_seoul_companion_app_installed";

/** 공개 문서 미제공 — env로 덮어쓸 수 있음 (APK 기준 MainActivity 에 mydata 스킴 없음) */
const LAUNCH_SCHEME =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SEOUL_COMPANION_LAUNCH_SCHEME?.trim()) ||
  "mydata";

const LAUNCH_HOST =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SEOUL_COMPANION_LAUNCH_HOST?.trim()) ||
  "launch";

const ANDROID_PACKAGE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SEOUL_COMPANION_ANDROID_PACKAGE?.trim()) ||
  "kr.go.seoul.mydata";

/** APK AndroidManifest — MainActivity (커스텀 스킴 미등록) */
const ANDROID_MAIN_ACTIVITY = `${ANDROID_PACKAGE}/kr.go.seoul.mydata.MainActivity`;

/** env에 전체 intent/URL 지정 시 우선 사용 */
const LAUNCH_URL_OVERRIDE =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SEOUL_COMPANION_LAUNCH_URL?.trim() : "";

/** 미설치 추정 시에만 스토어 폴백 (ms). 「앱 실행」 버튼에서는 사용하지 않음 */
const LAUNCH_FALLBACK_MS = 2800;

export type SeoulCompanionPlatform = "android" | "ios" | "other";

export function detectSeoulCompanionPlatform(): SeoulCompanionPlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return "other";
}

/** 카카오톡·인스타 등 인앱 브라우저 — intent 가 Play 스토어로 빠지는 경우가 많음 */
export function detectInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /KAKAOTALK/i.test(ua) ||
    /FBAN|FBAV/i.test(ua) ||
    /Instagram/i.test(ua) ||
    /Line\//i.test(ua) ||
    /NAVER/i.test(ua) ||
    /DaumApps/i.test(ua) ||
    /Snapchat/i.test(ua) ||
    /; wv\)/i.test(ua)
  );
}

export function getSeoulCompanionStoreUrl(platform: SeoulCompanionPlatform = detectSeoulCompanionPlatform()): string {
  if (platform === "ios") return SEOUL_COMPANION_APP.appStoreUrl;
  return SEOUL_COMPANION_APP.playStoreUrl;
}

function buildCustomSchemeUrl(host: string): string {
  if (!host || host === "/") return `${LAUNCH_SCHEME}://`;
  return `${LAUNCH_SCHEME}://${host}`;
}

export function buildSeoulCompanionLaunchUrl(): string {
  return buildCustomSchemeUrl(LAUNCH_HOST);
}

/**
 * Android — MainActivity 직접 실행 (서울동행맵 APK 에 공개 딥링크 스킴 없음).
 * package 만 넣으면 Chrome 이 Play 로 보내는 경우가 있어 component 를 지정하여 강제 실행 유도.
 */
export function buildSeoulCompanionAndroidMainActivityIntentUrl(): string {
  return `intent:#Intent;component=${ANDROID_MAIN_ACTIVITY};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;launchFlags=0x10000000;end`;
}

/** @deprecated scheme+package — 미등록 스킴 시 Play 로 우회 */
export function buildSeoulCompanionAndroidLauncherIntentUrl(): string {
  return `intent://${LAUNCH_HOST}#Intent;scheme=${LAUNCH_SCHEME};package=${ANDROID_PACKAGE};end`;
}

/** @deprecated */
export function buildSeoulCompanionAndroidPackageIntentUrl(): string {
  return `intent:#Intent;package=${ANDROID_PACKAGE};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;
}

/** @deprecated */
export function buildSeoulCompanionAndroidSchemeIntentUrl(host: string = LAUNCH_HOST): string {
  const path = host && host !== "/" ? host : "launch";
  return `intent://${path}#Intent;scheme=${LAUNCH_SCHEME};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
}

/** @deprecated browser_fallback_url 은 설치돼 있어도 스토어로 바로 감 */
export function buildSeoulCompanionAndroidIntentUrl(fallbackStoreUrl: string): string {
  const fallback = encodeURIComponent(fallbackStoreUrl);
  return `intent://${LAUNCH_HOST}#Intent;scheme=${LAUNCH_SCHEME};package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
}

/** 모바일 `<a href>` — Android 는 MainActivity intent */
export function getSeoulCompanionNativeLaunchHref(
  platform: SeoulCompanionPlatform = detectSeoulCompanionPlatform()
): string | null {
  if (platform === "android") {
    return LAUNCH_URL_OVERRIDE || buildSeoulCompanionAndroidMainActivityIntentUrl();
  }
  if (platform === "ios") {
    return LAUNCH_URL_OVERRIDE || buildSeoulCompanionLaunchUrl();
  }
  return null;
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
  /** true일 때만 앱 미실행 시 스토어로 자동 이동 (기본 false) */
  allowStoreFallback?: boolean;
  /** @deprecated allowStoreFallback 사용 */
  assumeInstalled?: boolean;
  onOpened?: () => void;
  onFallback?: () => void;
  fallbackMs?: number;
};

function attachAppOpenedListeners(options: OpenOptions): () => void {
  let cleared = false;

  const cleanup = () => {
    if (cleared) return;
    cleared = true;
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
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

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);

  return cleanup;
}

/** 사용자 제스처 직후 동기 실행 (iframe·지연 다중 시도는 Android 에서 무효) */
function navigateLaunchUrlSync(url: string): void {
  window.location.assign(url);
}

function launchWithDeferredStoreFallback(
  tryLaunch: () => void,
  storeUrl: string,
  options: OpenOptions
): void {
  const fallbackMs = options.fallbackMs ?? LAUNCH_FALLBACK_MS;
  let cleared = false;

  const cleanup = () => {
    if (cleared) return;
    cleared = true;
    window.clearTimeout(timer);
    removeOpenedListeners();
  };

  const removeOpenedListeners = attachAppOpenedListeners({
    ...options,
    onOpened: () => {
      options.onOpened?.();
      cleanup();
    },
  });

  const timer = window.setTimeout(() => {
    cleanup();
    options.onFallback?.();
    window.location.href = storeUrl;
  }, fallbackMs);

  tryLaunch();
}

function launchAndroidAppOnly(options: OpenOptions): void {
  attachAppOpenedListeners(options);
  const url = LAUNCH_URL_OVERRIDE || buildSeoulCompanionAndroidMainActivityIntentUrl();
  navigateLaunchUrlSync(url);
}

function launchIosAppOnly(options: OpenOptions): void {
  attachAppOpenedListeners(options);
  const url = LAUNCH_URL_OVERRIDE || buildSeoulCompanionLaunchUrl();
  navigateLaunchUrlSync(url);
}

/**
 * 「서울동행앱 실행」 버튼 — Play 자동 이동 없음.
 */
export function launchSeoulCompanionAppFromBrowser(options: OpenOptions = {}): void {
  if (typeof window === "undefined") return;

  const platform = detectSeoulCompanionPlatform();
  if (platform === "android") {
    launchAndroidAppOnly(options);
    return;
  }
  if (platform === "ios") {
    launchIosAppOnly(options);
    return;
  }
}

/** @deprecated launchSeoulCompanionAppFromBrowser 사용 */
export function prepareSeoulCompanionLaunch(options: OpenOptions = {}): void {
  attachAppOpenedListeners(options);
}

/** @deprecated launchSeoulCompanionAppFromBrowser 사용 */
export function launchSeoulCompanionAppFromInAppBrowser(options: OpenOptions = {}): void {
  launchSeoulCompanionAppFromBrowser(options);
}

/**
 * 앱 실행을 시도합니다.
 * 모바일 기본: Play·App Store 자동 이동 없음. 설치 링크는 UI 하단 스토어 버튼 사용.
 */
export function openSeoulCompanionApp(options: OpenOptions = {}): void {
  if (typeof window === "undefined") return;

  const platform = detectSeoulCompanionPlatform();
  const storeUrl = getSeoulCompanionStoreUrl(platform);
  const allowStoreFallback = options.allowStoreFallback === true;

  if (platform === "android") {
    if (allowStoreFallback) {
      launchWithDeferredStoreFallback(() => launchAndroidAppOnly({}), storeUrl, options);
    } else {
      launchAndroidAppOnly(options);
    }
    return;
  }

  if (platform === "ios") {
    if (allowStoreFallback) {
      launchWithDeferredStoreFallback(() => launchIosAppOnly({}), storeUrl, options);
    } else {
      launchIosAppOnly(options);
    }
    return;
  }

  if (options.assumeInstalled === true || readSeoulCompanionInstalledFlag()) {
    window.location.href = buildSeoulCompanionLaunchUrl();
    return;
  }

  options.onFallback?.();
  window.location.href = storeUrl;
}
