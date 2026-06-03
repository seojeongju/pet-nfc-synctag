"use client";

/**
 * 레거시 /auth/complete 진입 시 정적 OAuth viewport 브리지로 위임합니다.
 */

import { useEffect } from "react";
import { buildOAuthViewportResetUrl } from "@/lib/oauth-viewport-bridge";
import { forceViewportRecalc, resetViewportMeta } from "@/lib/viewport-meta";

interface Props {
  next: string;
}

export function AuthCompleteBridge({ next }: Props) {
  useEffect(() => {
    resetViewportMeta();
    forceViewportRecalc();
    window.scrollTo(0, 0);
    const timer = window.setTimeout(() => {
      window.location.replace(buildOAuthViewportResetUrl(next));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [next]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #eef2ff 100%)",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid #e2e8f0",
          borderTopColor: "#14b8a6",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
