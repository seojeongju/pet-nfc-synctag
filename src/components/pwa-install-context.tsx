"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallContextValue = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isIOS: boolean;
  isStandalone: boolean;
  /** 발견자 온보딩 오버레이가 떠 있을 때 하단 전역 설치 칩 숨김 */
  pauseGlobalInstallChip: boolean;
  setPauseGlobalInstallChip: (v: boolean) => void;
  /** Android Chrome 설치 시트 (이벤트 없으면 unavailable) */
  triggerInstallPrompt: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function readStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone] = useState(readStandalone);
  const [pauseGlobalInstallChip, setPauseGlobalInstallChip] = useState(false);

  useEffect(() => {
    if (isStandalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, [isStandalone]);

  const triggerInstallPrompt = useCallback(async () => {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    return outcome;
  }, [deferredPrompt]);

  const value = useMemo(
    () => ({
      deferredPrompt,
      isIOS,
      isStandalone,
      pauseGlobalInstallChip,
      setPauseGlobalInstallChip,
      triggerInstallPrompt,
    }),
    [deferredPrompt, isIOS, isStandalone, pauseGlobalInstallChip, triggerInstallPrompt]
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return ctx;
}
