"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Share, PlusSquare, ArrowDown, CheckCircle2, Smartphone, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const nextAppHref = (searchParams.get("next") || "").trim();
  useEffect(() => {
    setIsMounted(true);

    // 1. 설치 여부 확인 (이미 설치됨)
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;

    if (standalone) {
      setIsStandalone(true);
      // 이미 설치되었다면 바로 허브로 이동
      setTimeout(() => router.push("/hub"), 1500);
      return;
    }

    // 2. iOS 여부 확인
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 3. 안드로이드/데스크톱 설치 이벤트 리스닝
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [router]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      router.push("/hub");
    }
  };

  const openLinkedApp = () => {
    if (!nextAppHref || typeof window === "undefined") return;
    window.location.href = nextAppHref;
  };

  if (!isMounted) return null;

  // 이미 설치된 상태 UI
  if (isStandalone) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center font-outfit">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-teal-50 text-teal-500 shadow-xl shadow-teal-100"
        >
          <CheckCircle2 className="h-12 w-12" />
        </motion.div>
        <h1 className="mb-2 text-2xl font-black text-slate-900">이미 설치되었습니다!</h1>
        <p className="text-slate-500 font-bold">잠시 후 대시보드로 이동합니다...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-outfit text-slate-950 selection:bg-teal-100 selection:text-teal-900">
      {/* 상단 장식 */}
      <div className="pointer-events-none absolute left-0 top-0 h-[40vh] w-full overflow-hidden">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-indigo-300/10 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-12 min-[430px]:px-8">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-slate-900 text-white shadow-2xl rotate-12"
          >
            <Smartphone className="h-10 w-10 -rotate-12" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-teal-600">
              <Sparkles className="h-3 w-3" />
              Smart Installation
            </div>
            <h1 className="text-3xl font-black leading-tight text-slate-900">
              링크유(Link-U)를 <br />
              <span className="text-teal-500">당신의 홈에</span> 추가하세요
            </h1>
            <p className="text-sm font-bold leading-relaxed text-slate-400">
              설치하시면 QR·NFC 알림을 앱으로 <br />
              더욱 빠르고 안전하게 받을 수 있습니다.
            </p>
          </motion.div>
        </header>

        <section className="flex-1 space-y-8">
          {isIOS ? (
            /* iOS 가이드 */
            <div className="space-y-10">
              <div className="relative rounded-[40px] border border-slate-100 bg-white p-8 shadow-app shadow-app-hover">
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[13px] font-black text-white">1</div>
                    <div className="space-y-1">
                      <p className="text-base font-black text-slate-900 leading-none">브라우저 하단 메뉴</p>
                      <p className="text-sm font-bold text-slate-400 leading-relaxed">
                        Safari 브라우저 하단의 <span className="text-slate-800">[공유]</span> 버튼을 터치하세요.
                      </p>
                      <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-blue-500 shadow-inner">
                        <Share className="h-7 w-7" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[13px] font-black text-white">2</div>
                    <div className="space-y-1">
                      <p className="text-base font-black text-slate-900 leading-none">홈 화면에 추가</p>
                      <p className="text-sm font-bold text-slate-400 leading-relaxed">
                        메뉴 목록을 올려 <span className="text-slate-800">&apos;홈 화면에 추가&apos;</span>를 선택하세요.
                      </p>
                      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                        <PlusSquare className="h-6 w-6 text-slate-400" />
                        <span className="text-sm font-black text-slate-800">홈 화면에 추가</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 안내 화살표 애니메이션 */}
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-teal-500"
                >
                  <ArrowDown className="h-8 w-8" />
                </motion.div>
              </div>
            </div>
          ) : (
            /* 안드로이드 / 데스크톱 가이트 */
            <div className="space-y-6">
              <div className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-app shadow-app-hover text-center">
                <AnimatePresence mode="wait">
                  {!deferredPrompt ? (
                    <motion.div
                      key="waiting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                        <Smartphone className="h-8 h-8 animate-pulse" />
                      </div>
                      <p className="text-sm font-bold text-slate-500 leading-relaxed">
                        브라우저의 설치 메뉴가 로드되는 중입니다.
                        <br />
                        팝업이 뜨지 않으면 주소창의 <strong>&apos;설치&apos;</strong> 아이콘을 눌러주세요.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ready"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-6"
                    >
                      <p className="text-base font-black text-slate-800 leading-relaxed">
                        준비가 완료되었습니다!
                        <br />
                        아래 버튼을 눌러 링크유를 설치하세요.
                      </p>
                      <button
                        onClick={handleInstallClick}
                        className="flex h-16 w-full items-center justify-center gap-3 rounded-[24px] bg-teal-500 text-lg font-black text-white shadow-xl shadow-teal-500/20 transition-all hover:bg-teal-600 active:scale-95"
                      >
                        <Download className="h-6 w-6" />
                        지금 앱 설치하기
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-[11px] font-bold text-slate-400">
                  앱 설치 후에는 바탕화면의 아이콘을 통해 <br />
                  언제든지 즉시 접속할 수 있습니다.
                </p>
                {nextAppHref ? (
                  <button
                    type="button"
                    onClick={openLinkedApp}
                    className="mt-3 inline-flex h-10 items-center justify-center rounded-xl border border-teal-200 bg-white px-4 text-[11px] font-black text-teal-700 hover:bg-teal-50"
                  >
                    설치 후 앱 바로 열기
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <footer className="mt-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Link-U Smart Gateway</p>
        </footer>
      </main>
    </div>
  );
}
