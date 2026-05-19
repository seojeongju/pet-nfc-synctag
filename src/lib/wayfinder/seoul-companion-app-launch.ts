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

export function buildSeoulCompanionLaunchUrl(): string {
  return `${LAUNCH_SCHEME}://${LAUNCH_HOST}`;
}

/** Android intent — scheme·package (Chrome 권장 형식, browser_fallback_url 없음) */
export function buildSeoulCompanionAndroidLauncherIntentUrl(): string {
  return `intent://${LAUNCH_HOST}#Intent;scheme=${LAUNCH_SCHEME};package=${ANDROID_PACKAGE};end`;
}

/** Android intent — package 런처만 (일부 기기·삼성 브라우저) */
export function buildSeoulCompanionAndroidPackageIntentUrl(): string {
  return `intent:#Intent;package=${ANDROID_PACKAGE};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;
}

/** @deprecated browser_fallback_url 은 설치돼 있어도 스토어로 바로 감 */
export function buildSeoulCompanionAndroidIntentUrl(fallbackStoreUrl: string): string {
  const fallback = encodeURIComponent(fallbackStoreUrl);
  return `intent://${LAUNCH_HOST}#Intent;scheme=${LAUNCH_SCHEME};package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
}

/** 모바일 `<a href>` — 커스텀 스킴이 설치 앱 실행에 가장 안정적 */
export function getSeoulCompanionNativeLaunchHref(
  platform: SeoulCompanionPlatform = detectSeoulCompanionPlatform()
): string | null {
  if (platform === "android" || platform === "ios") {
    return buildSeoulCompanionLaunchUrl();
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

/** Chrome: 사용자 제스처 안에서 숨겨진 `<a>` 클릭이 intent 실행에 가장 안정적 */
function clickHiddenAnchor(href: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.setAttribute("aria-hidden", "true");
  anchor.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
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

  // 1) 커스텀 스킴 (설치 앱 직접 실행, Play 로 안 감)
  clickHiddenAnchor(buildSeoulCompanionLaunchUrl());
  // 2) intent scheme+package
  clickHiddenAnchor(buildSeoulCompanionAndroidLauncherIntentUrl());
  // 3) package 런처 (삼성·일부 Chrome)
  clickHiddenAnchor(buildSeoulCompanionAndroidPackageIntentUrl());
}

function launchIosAppOnly(options: OpenOptions): void {
  attachAppOpenedListeners(options);
  clickHiddenAnchor(buildSeoulCompanionLaunchUrl());
}

/**
 * 실행 버튼 클릭 직전 — 앱 전환 감지 리스너만 등록.
 * 모바일에서는 preventDefault 없이 `<a href="mydata://...">` 네비게이션을 허용하는 것이 좋음.
 */
export function prepareSeoulCompanionLaunch(options: OpenOptions = {}): void {
  attachAppOpenedListeners(options);
}

/**
 * 인앱 브라우저 등에서 `<a href>` 만으로 부족할 때 추가 시도 (스토어 자동 이동 없음).
 */
export function launchSeoulCompanionAppFromInAppBrowser(options: OpenOptions = {}): void {
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
