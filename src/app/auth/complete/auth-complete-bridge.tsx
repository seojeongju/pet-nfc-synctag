"use client";

/**
 * OAuth 콜백 후 뷰포트를 강제 재설정한 뒤 최종 목적지로 이동합니다.
 * requestAnimationFrame 한 번만으로는 paint·재계산이 끝나기 전에 이탈하는 기기가 있어
 * 짧은 burst + 최소 대기 후 location.replace 합니다.
 */

import { useEffect } from "react";
import {
  forceViewportRecalc,
  resetViewportMeta,
  runViewportFixBurst,
} from "@/lib/viewport-meta";

interface Props {
  next: string;
}

/** 브라우저가 viewport를 재적용할 최소 시간(ms) */
const MIN_BRIDGE_MS = 380;

export function AuthCompleteBridge({ next }: Props) {
  useEffect(() => {
    resetViewportMeta();
    forceViewportRecalc();
    const cancelBurst = runViewportFixBurst();
    window.scrollTo(0, 0);

    const timer = window.setTimeout(() => {
      resetViewportMeta();
      forceViewportRecalc();
      window.location.replace(next);
    }, MIN_BRIDGE_MS);

    return () => {
      cancelBurst();
      window.clearTimeout(timer);
    };
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
