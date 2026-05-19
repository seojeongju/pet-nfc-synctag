"use client";

import { useEffect } from "react";

export const WAYFINDER_NFC_WELCOME_ID = "wayfinder-nfc-welcome";

/** NFC 태그 진입 시 화면 상단(태그 인식 카드)이 보이도록 스크롤 */
export function WayfinderNfcEntryScroll({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;

    const scrollToWelcome = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.getElementById(WAYFINDER_NFC_WELCOME_ID)?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    };

    scrollToWelcome();
    const t = window.setTimeout(scrollToWelcome, 80);
    return () => window.clearTimeout(t);
  }, [active]);

  return null;
}
