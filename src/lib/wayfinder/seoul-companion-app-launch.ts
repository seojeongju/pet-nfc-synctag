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

export function getSeoulCompanionStoreUrl(platform: SeoulCompanionPlatform = detectSeoulCompanionPlatform()): string {
  if (platform === "ios") return SEOUL_COMPANION_APP.appStoreUrl;
  return SEOUL_COMPANION_APP.playStoreUrl;
}

export function buildSeoulCompanionLaunchUrl(): string {
  return `${LAUNCH_SCHEME}://${LAUNCH_HOST}`;
}

/**
 * Android: scheme+package intent (설치 시 앱 실행).
 * `intent:#Intent;package=...` 단독 형식은 Chrome에서 미동작·스토어로 빠지는 경우가 있어 host+scheme 사용.
 */
export function buildSeoulCompanionAndroidLauncherIntentUrl(): string {
  return `intent://${LAUNCH_HOST}#Intent;scheme=${encodeURIComponent(LAUNCH_SCHEME)};package=${ANDROID_PACKAGE};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;
}

/** @deprecated browser_fallback_url 은 설치돼 있어도 스토어로 바로 감 */
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
  /** true일 때만 앱 미실행 시 스토어로 자동 이동 (기본 false — 실행 버튼용) */
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

/** 모바일 「앱 실행」: 스토어 자동 이동 없이 intent·커스텀 스킴만 시도 */
function launchMobileAppOnly(platform: "android" | "ios", options: OpenOptions): void {
  attachAppOpenedListeners(options);

  if (platform === "android") {
    window.location.href = buildSeoulCompanionAndroidLauncherIntentUrl();
    return;
  }

  window.location.href = buildSeoulCompanionLaunchUrl();
}

/**
 * 앱 실행을 시도합니다.
 * 모바일 기본 동작: 설치된 앱만 실행하고 Play·App Store로 자동 이동하지 않습니다.
 * 미설치 시 설치는 하단 Play·iOS·원스토어 링크를 이용합니다.
 */
export function openSeoulCompanionApp(options: OpenOptions = {}): void {
  if (typeof window === "undefined") return;

  const platform = detectSeoulCompanionPlatform();
  const storeUrl = getSeoulCompanionStoreUrl(platform);
  const allowStoreFallback = options.allowStoreFallback === true;

  if (platform === "android") {
    if (allowStoreFallback) {
      launchWithDeferredStoreFallback(() => {
        window.location.href = buildSeoulCompanionAndroidLauncherIntentUrl();
      }, storeUrl, options);
    } else {
      launchMobileAppOnly("android", options);
    }
    return;
  }

  if (platform === "ios") {
    if (allowStoreFallback) {
      launchWithDeferredStoreFallback(() => {
        window.location.href = buildSeoulCompanionLaunchUrl();
      }, storeUrl, options);
    } else {
      launchMobileAppOnly("ios", options);
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
