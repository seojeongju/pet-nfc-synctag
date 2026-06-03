/** Google OAuth 복귀 직후 viewport 재설정용 정적 HTML (Next.js/React 우회) */
export const OAUTH_VIEWPORT_RESET_PATH = "/oauth-viewport-reset.html";

export function buildOAuthViewportResetUrl(nextPath: string): string {
  return `${OAUTH_VIEWPORT_RESET_PATH}?next=${encodeURIComponent(nextPath)}`;
}

/**
 * 소셜 로그인 callbackURL — OAuth state에 넣는 경로는 짧게 유지(PKCE·state 쿠키 안정).
 * viewport 복구는 /consent·레이아웃 ViewportFix에서 처리합니다.
 */
export function buildSocialLoginCallbackUrl(destinationPath: string): string {
  return `/consent?next=${encodeURIComponent(destinationPath)}`;
}
