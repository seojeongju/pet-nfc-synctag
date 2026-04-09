import { unstable_rethrow } from "next/navigation";

/**
 * try/catch로 감싼 서버 컴포넌트에서 먼저 호출하세요.
 * redirect·notFound·dynamic rendering 등 Next 내부 제어 흐름 오류는 여기서 다시 throw 되며,
 * 이걸 삼키면 500·error.tsx로 이어질 수 있습니다.
 */
export function rethrowNextControlFlowErrors(error: unknown): void {
  unstable_rethrow(error);
}

/** @deprecated rethrowNextControlFlowErrors(unstable_rethrow) 사용 권장 */
export function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const o = error as { digest?: unknown; message?: unknown };
  if (typeof o.digest === "string" && o.digest.includes("NEXT_REDIRECT")) return true;
  if (o.message === "NEXT_REDIRECT") return true;
  return false;
}