"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/components/pwa-install-context";

export function PwaInstallPrompt() {
  const {
    deferredPrompt,
    isIOS,
    isStandalone,
    pauseGlobalInstallChip,
    triggerInstallPrompt,
  } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleInstallClick = () => {
    void triggerInstallPrompt();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (!isMounted) return null;

  if (isStandalone || pauseGlobalInstallChip) {
    return null;
  }

  if (isDismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:max-w-sm z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-4 flex items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-16 h-16 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex-1 flex flex-col z-10">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
            {isIOS ? "링크유 앱 추가하기" : "링크유 앱 설치하기"}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed break-keep">
            {isIOS
              ? "Safari 하단의 [공유] 아이콘을 누르고 '홈 화면에 추가'를 선택해 주세요."
              : "바탕화면에 설치하여 더욱 빠르고 간편하게 링크유를 이용하세요!"}
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 shrink-0">
          {!isIOS && deferredPrompt ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white px-3 py-2 rounded-xl transition-all flex items-center justify-center shadow-md shadow-teal-500/20 active:scale-95"
              aria-label="앱 설치"
            >
              <Download className="w-4 h-4 mr-1.5" />
              <span className="text-xs font-semibold">설치</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleDismiss}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-2 rounded-xl transition-colors bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-95"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
