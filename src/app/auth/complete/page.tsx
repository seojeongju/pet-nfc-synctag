/**
 * /auth/complete — Google OAuth 콜백 후 모바일 뷰포트 복구용 중간 브리지 페이지
 *
 * 왜 이 페이지가 필요한가?
 * -  Google OAuth는 accounts.google.com → /api/auth/callback/google(302) → 최종 페이지
 *    로 이어지는 연속 302 리다이렉트 체인을 만듭니다.
 * -  이 과정에서 일부 Android Chrome / Samsung Internet 브라우저는
 *    우리 도메인의 <meta name="viewport">를 한 번도 제대로 렌더링하지 않은 채
 *    최종 페이지에 도달하여, 외부 도메인의 viewport 컨텍스트를 그대로 승계합니다.
 * -  이 페이지를 중간에 삽입하면 브라우저가 우리 도메인 HTML을 완전히 paint하게
 *    되어, viewport <meta> 태그를 재계산한 뒤 최종 목적지로 이동합니다.
 */

import { Suspense } from "react";
import { AuthCompleteBridge } from "./auth-complete-bridge";
import { buildNoIndexMetadata } from "@/lib/seo";

export const runtime = "edge";
export const metadata = buildNoIndexMetadata("링크유 인증 처리");

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function AuthCompletePage({ searchParams }: Props) {
  const params = await searchParams;

  // 최종 목적지 URL — 검증: 내부 경로만 허용 (오픈 리다이렉트 방지)
  const raw = params.next ?? "";
  let next = "/hub";
  try {
    const decoded = decodeURIComponent(raw.trim());
    if (decoded.startsWith("/") && !decoded.startsWith("//") && !decoded.includes("://")) {
      next = decoded.length > 2048 ? "/hub" : decoded;
    }
  } catch {
    // 파싱 실패 시 기본값 유지
  }

  return (
    <Suspense>
      <AuthCompleteBridge next={next} />
    </Suspense>
  );
}
