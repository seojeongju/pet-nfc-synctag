/** Google OAuth 복귀 직후 viewport 재설정용 정적 HTML (Next.js/React 우회) */
export const OAUTH_VIEWPORT_RESET_PATH = "/oauth-viewport-reset.html";

export function buildOAuthViewportResetUrl(nextPath: string): string {
  return `${OAUTH_VIEWPORT_RESET_PATH}?next=${encodeURIComponent(nextPath)}`;
}

/** 소셜 로그인 callbackURL: OAuth → 정적 브리지 → consent → 최종 목적지 */
export function buildSocialLoginCallbackUrl(destinationPath: string): string {
  const consentNext = `/consent?next=${encodeURIComponent(destinationPath)}`;
  return buildOAuthViewportResetUrl(consentNext);
}
