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
import { detectInstalledRelatedApps, readIsStandalone } from "@/lib/pwa-installed-detection";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PwaInstallContextValue = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isIOS: boolean;
  isStandalone: boolean;
  /** PWA(홈 화면) 또는 Play 네이티브 앱이 이미 설치된 경우 */
  isAppAlreadyInstalled: boolean;
  /** 발견자 온보딩 오버레이가 떠 있을 때 하단 전역 설치 칩 숨김 */
  pauseGlobalInstallChip: boolean;
  setPauseGlobalInstallChip: (v: boolean) => void;
  /** Android Chrome 설치 시트 (이벤트 없으면 unavailable) */
  triggerInstallPrompt: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isRelatedAppInstalled, setIsRelatedAppInstalled] = useState(false);
  const [pauseGlobalInstallChip, setPauseGlobalInstallChip] = useState(false);

  const isAppAlreadyInstalled = isStandalone || isRelatedAppInstalled;

  useEffect(() => {
    const standalone = readIsStandalone();
    setIsStandalone(standalone);
    if (standalone) return;

    void detectInstalledRelatedApps().then(setIsRelatedAppInstalled);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

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
      isAppAlreadyInstalled,
      pauseGlobalInstallChip,
      setPauseGlobalInstallChip,
      triggerInstallPrompt,
    }),
    [
      deferredPrompt,
      isIOS,
      isStandalone,
      isAppAlreadyInstalled,
      pauseGlobalInstallChip,
      triggerInstallPrompt,
    ]
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
