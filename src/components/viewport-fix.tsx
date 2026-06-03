"use client";

/**
 * ViewportFix — 앱 전역에서 viewport를 능동적으로 보호하는 보조 컴포넌트
 *
 * Google OAuth 등 외부 도메인에서 복귀 시 Android Chrome이 zoom/scale 값을 승계하는 버그 대응.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  forceViewportRecalc,
  resetViewportMeta,
  runViewportFixBurst,
} from "@/lib/viewport-meta";

export function ViewportFix() {
  const pathname = usePathname();

  useEffect(() => {
    resetViewportMeta();
    forceViewportRecalc();
    const cancelBurstOnMount = runViewportFixBurst();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetViewportMeta();
        forceViewportRecalc();
        runViewportFixBurst();
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      resetViewportMeta();
      forceViewportRecalc();
      runViewportFixBurst();
    };

    const handleWindowFocus = () => {
      resetViewportMeta();
      forceViewportRecalc();
      runViewportFixBurst();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      cancelBurstOnMount();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  useEffect(() => {
    resetViewportMeta();
    forceViewportRecalc();
    const cancelBurstOnRoute = runViewportFixBurst();
    return () => cancelBurstOnRoute();
  }, [pathname]);

  return null;
}
