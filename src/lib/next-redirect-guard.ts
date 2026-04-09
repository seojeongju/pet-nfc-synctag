import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isHTTPAccessFallbackError } from "next/dist/client/components/http-access-fallback/http-access-fallback";

/**
 * try/catch 안에서만 호출. redirect()·notFound()·forbidden()·unauthorized() 는 다시 throw.
 *
 * `next/navigation`의 unstable_rethrow 는 Dynamic Server Error 등도 재던지므로,
 * 데이터 조회 실패까지 전부 세그먼트 error.tsx 로 새는 문제가 생길 수 있어 사용하지 않습니다.
 */
export function rethrowNextControlFlowErrors(error: unknown): void {
  if (isRedirectError(error)) throw error;
  if (isHTTPAccessFallbackError(error)) throw error;
}

/** @deprecated rethrowNextControlFlowErrors 사용 권장 */
export function isNextRedirectError(error: unknown): boolean {
  return isRedirectError(error);
}
