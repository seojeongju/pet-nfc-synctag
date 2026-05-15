/** Kakao Maps JavaScript 앱키 후보 (우선순위 위→아래). */
export const KAKAO_MAP_APP_KEY_ENV_NAMES = [
  "NEXT_PUBLIC_KAKAO_MAP_JS_KEY",
  "NEXT_PUBLIC_KAKAO_MAP_KEY",
  "KAKAO_MAP_JS_KEY",
] as const;

export type KakaoMapKeySource = (typeof KAKAO_MAP_APP_KEY_ENV_NAMES)[number] | null;

/** 시크릿에 따옴표·BOM·개행이 섞여 sdk.js 가 403 날 때 정리 */
export function normalizeKakaoMapAppKey(value: string): string {
  let s = value.trim().replace(/^\uFEFF/, "");
  while (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim().replace(/^\uFEFF/, "");
  }
  return s.trim();
}
