"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginRedirectPath } from "@/lib/login-redirect-path";
import { resetViewportMeta, forceViewportRecalc, runViewportFixBurst } from "@/lib/viewport-meta";

/**
 * better-auth OAuth 실패 시 `/?error=invalid_code` 등으로 떨어지는 경우
 * 로그인 화면으로 안내(홈에 머물며 원인을 알기 어려운 문제 방지).
 */
export function OAuthHomeErrorRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    resetViewportMeta();
    forceViewportRecalc();
    const cancel = runViewportFixBurst();

    if (error === "invalid_code" || error === "invalid_callback_request") {
      router.replace(
        loginRedirectPath({
          kind: "pet",
          oauthError: "invalid_code",
        })
      );
    }

    return cancel;
  }, [router, searchParams]);

  return null;
}
