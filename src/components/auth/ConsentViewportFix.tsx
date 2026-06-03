"use client";

import { useEffect } from "react";
import { runViewportFixBurst, resetViewportMeta, forceViewportRecalc } from "@/lib/viewport-meta";

/** Google OAuth 직후 /consent 진입 시 모바일 viewport 오염 복구 */
export function ConsentViewportFix() {
  useEffect(() => {
    resetViewportMeta();
    forceViewportRecalc();
    return runViewportFixBurst();
  }, []);
  return null;
}
