/** Google OAuth 복귀 직후 viewport 재설정용 정적 HTML (Next.js/React 우회) */
export const OAUTH_VIEWPORT_RESET_PATH = "/oauth-viewport-reset.html";

export function buildOAuthViewportResetUrl(nextPath: string): string {
  return `${OAUTH_VIEWPORT_RESET_PATH}?next=${encodeURIComponent(nextPath)}`;
}

export function buildConsentWithNextUrl(destinationPath: string): string {
  return `/consent?next=${encodeURIComponent(destinationPath)}`;
}

/**
 * 소셜 로그인 callbackURL — better-auth state에 넣는 경로.
 * OAuth 직후 정적 브리지 → consent → (동의 완료 시) 목적지 순으로 viewport 오염을 방지합니다.
 */
export function buildSocialLoginCallbackUrl(destinationPath: string): string {
  return buildOAuthViewportResetUrl(buildConsentWithNextUrl(destinationPath));
}

/** oauth-viewport-reset / consent 래핑 URL에서 최종 목적지 추출 */
export function resolveOAuthFlowDestination(callbackURL: string): string {
  if (
    callbackURL.startsWith(`${OAUTH_VIEWPORT_RESET_PATH}?`) ||
    callbackURL.startsWith("/oauth-viewport-reset.html?")
  ) {
    try {
      const u = new URL(callbackURL, "https://example.invalid");
      const inner = u.searchParams.get("next");
      if (inner) return resolveOAuthFlowDestination(inner);
    } catch {
      /* ignore */
    }
  }
  if (callbackURL.startsWith("/consent?")) {
    try {
      const u = new URL(callbackURL, "https://example.invalid");
      return u.searchParams.get("next") ?? "/hub";
    } catch {
      return "/hub";
    }
  }
  return callbackURL;
}
