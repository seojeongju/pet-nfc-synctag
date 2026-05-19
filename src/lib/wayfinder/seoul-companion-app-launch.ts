/** 서울동행맵 앱 실행·설치 (웹 → 네이티브) */

import { SEOUL_COMPANION_APP } from "@/lib/wayfinder/accessible-routing-links";

const INSTALLED_STORAGE_KEY = "linku_seoul_companion_app_installed";

/** 공개 문서 미제공 — env로 덮어쓸 수 있음 */
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

/** 앱 실행 시도 후 스토어로 넘기기까지 대기 (ms) */
const LAUNCH_FALLBACK_MS = 2800;

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

/**
 * Android: 패키지 런처만 사용 (커스텀 스킴 불필요).
 * 앱이 설치되어 있으면 Chrome이 앱을 연다. browser_fallback_url 은 넣지 않는다.
 */
export function buildSeoulCompanionAndroidLauncherIntentUrl(): string {
  return `intent:#Intent;package=${ANDROID_PACKAGE};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;
}

/** @deprecated 스토어 즉시 폴백 유발 — 사용하지 않음 */
export function buildSeoulCompanionAndroidDirectIntentUrl(): string {
  return buildSeoulCompanionAndroidLauncherIntentUrl();
}

/** @deprecated browser_fallback_url 은 미설치·스킴 오류 시 스토어로 바로 감 */
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
  /** @deprecated 모바일에서는 항상 앱 실행을 먼저 시도 */
  assumeInstalled?: boolean;
  onOpened?: () => void;
  onFallback?: () => void;
  fallbackMs?: number;
};

function tryCustomSchemeViaHiddenFrame(): void {
  const url = buildSeoulCompanionLaunchUrl();
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "display:none;width:0;height:0;border:0";
  iframe.src = url;
  document.body.appendChild(iframe);
  window.setTimeout(() => {
    iframe.remove();
  }, 2500);
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
    options.onFallback?.();
    window.location.href = storeUrl;
  }, fallbackMs);

  tryLaunch();
  tryCustomSchemeViaHiddenFrame();
}

/**
 * 앱 실행을 시도합니다.
 * 모바일(Android/iOS): 설치 여부와 관계없이 **앱 실행을 먼저** 시도하고, 화면이 그대로면 스토어로 이동합니다.
 */
export function openSeoulCompanionApp(options: OpenOptions = {}): void {
  if (typeof window === "undefined") return;

  const platform = detectSeoulCompanionPlatform();
  const storeUrl = getSeoulCompanionStoreUrl(platform);

  if (platform === "android") {
    launchWithDeferredStoreFallback(() => {
      window.location.href = buildSeoulCompanionAndroidLauncherIntentUrl();
    }, storeUrl, options);
    return;
  }

  if (platform === "ios") {
    launchWithDeferredStoreFallback(() => {
      window.location.href = buildSeoulCompanionLaunchUrl();
    }, storeUrl, options);
    return;
  }

  if (options.assumeInstalled === true || readSeoulCompanionInstalledFlag()) {
    window.location.href = buildSeoulCompanionLaunchUrl();
    return;
  }

  options.onFallback?.();
  window.location.href = storeUrl;
}
