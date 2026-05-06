"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";
import { logFinderAction, updateScanLocation } from "@/app/actions/scan";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function LocationShare({
  tagId,
  petId,
  enabled = true,
  disabledHint,
  onStatusChange,
}: {
  tagId: string | null;
  petId?: string | null;
  enabled?: boolean;
  /** enabled=false일 때 기본 문구 대신 표시 (발견자 동의 거절 등) */
  disabledHint?: string | null;
  onStatusChange?: (status: "idle" | "loading" | "success" | "error") => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  /** 지오/전송 실패 시 버튼에 표시 (Button 기본 whitespace-nowrap 때문에 짧은 문구만 쓰던 문제 보완) */
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const searchParams = useSearchParams();
  const activeTag = tagId || searchParams.get("tag");
  const canSend = enabled && Boolean(activeTag);

  const helperText = useMemo(() => {
    if (!enabled) {
      const h = disabledHint?.trim();
      if (h) return h;
      return "이 화면에서만 위치를 보낼 수 있어요.";
    }
    if (!activeTag) return "인식표로 이 화면에 바로 오셨을 때만 가족에게 전달돼요.";
    return "누르면 지금 계신 곳이 가족에게 전해져요.";
  }, [enabled, activeTag, disabledHint]);

  const getHapticPattern = () => {
    if (typeof navigator === "undefined") return [35, 25, 35] as number[];
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    if (isIOS) return [20];
    if (isAndroid) return [40, 20, 40];
    return [35, 25, 35];
  };

  /** 버튼 클릭 → 동의 모달 오픈 */
  const handleButtonClick = () => {
    if (!enabled || !activeTag) return;
    setConsentChecked(false);
    setErrorHint(null);
    setShowModal(true);
  };

  /** 동의 후 실제 위치 전송 처리 */
  const handleSend = async () => {
    if (!consentChecked || !activeTag) return;
    setShowModal(false);

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
    void logFinderAction({
      action: "location_share_click",
      tagId: activeTag,
      petId: petId ?? null,
      userAgent: ua,
    });

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorHint("이 브라우저에서는 위치를 사용할 수 없어요.");
      onStatusChange?.("error");
      void logFinderAction({
        action: "location_share_error",
        tagId: activeTag,
        petId: petId ?? null,
        detail: "geolocation_not_supported",
        userAgent: ua,
      });
      return;
    }

    setStatus("loading");
    setErrorHint(null);
    onStatusChange?.("loading");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await updateScanLocation(activeTag as string, latitude, longitude);
          if (!res.success) {
            setStatus("error");
            setErrorHint("가족에게 전달하지 못했어요. 잠시 후 다시 시도해 주세요.");
            onStatusChange?.("error");
            void logFinderAction({
              action: "location_share_error",
              tagId: activeTag,
              petId: petId ?? null,
              detail: res.error,
              userAgent: ua,
            });
            return;
          }
          setStatus("success");
          onStatusChange?.("success");
          void logFinderAction({
            action: "location_share_success",
            tagId: activeTag,
            petId: petId ?? null,
            userAgent: ua,
            latitude,
            longitude,
          });
          if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
            navigator.vibrate(getHapticPattern());
          }
        } catch (e) {
          console.error(e);
          setStatus("error");
          setErrorHint("전송 중 문제가 있었어요. 다시 시도해 주세요.");
          onStatusChange?.("error");
          void logFinderAction({
            action: "location_share_error",
            tagId: activeTag,
            petId: petId ?? null,
            detail: "update_failed",
            userAgent: ua,
          });
        }
      },
      (error) => {
        console.error(error);
        setStatus("error");
        const code = error?.code;
        const hint =
          code === 1 // PERMISSION_DENIED
            ? "브라우저·앱 설정에서 위치 권한을 허용해 주세요."
            : code === 2 // POSITION_UNAVAILABLE
              ? "기기에서 위치(GPS)를 켜 주시고, 잠시 후 다시 눌러 주세요."
              : code === 3 // TIMEOUT
                ? "위치 확인이 지연됐어요. 통신이 나은 곳에서 다시 눌러 주세요."
                : "위치를 가져올 수 없어요. 설정을 확인한 뒤 다시 시도해 주세요.";
        setErrorHint(hint);
        onStatusChange?.("error");
        void logFinderAction({
          action: "location_share_error",
          tagId: activeTag,
          petId: petId ?? null,
          detail: error?.code ? `geo_error_${error.code}` : "geo_error",
          userAgent: ua,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 25_000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      {/* 위치 전송 버튼 */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="w-full"
            >
              <Button
                disabled
                className="flex h-auto min-h-[5rem] w-full min-w-0 whitespace-normal rounded-[28px] border-b-4 border-teal-700 bg-teal-500 px-4 py-3 text-lg font-black text-white opacity-100 shadow-xl shadow-teal-500/20"
              >
                <span className="flex w-full min-w-0 items-center justify-center gap-3">
                  <motion.span
                    className="inline-flex shrink-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                  >
                    <CheckCircle2 className="h-7 w-7" />
                  </motion.span>
                  <span className="text-center leading-snug break-keep [word-break:keep-all]">
                    가족에게 보냈어요
                  </span>
                </span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="w-full"
            >
              <Button
                onClick={handleButtonClick}
                disabled={!canSend || status === "loading"}
                variant="outline"
                className={cn(
                  "group relative flex h-auto min-h-[5rem] w-full min-w-0 whitespace-normal rounded-[28px] border-2 px-3 py-3 text-base font-black transition-all active:scale-95 sm:px-4 sm:text-lg",
                  !canSend
                    ? "border-slate-200 bg-slate-50 text-slate-400"
                    : status === "error"
                      ? "border-rose-100 bg-rose-50/50 text-rose-600"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                )}
              >
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[26px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
                </div>
                <span className="relative z-[1] flex w-full min-w-0 items-center justify-center gap-2 sm:gap-3">
                  {status === "loading" ? (
                    <Loader2 className="h-7 w-7 shrink-0 animate-spin" />
                  ) : status === "error" ? (
                    <AlertCircle className="h-7 w-7 shrink-0 text-rose-500" />
                  ) : (
                    <MapPin className="h-7 w-7 shrink-0 transition-transform group-hover:scale-110" />
                  )}
                  <span className="min-w-0 flex-1 text-center leading-snug break-keep [word-break:keep-all]">
                    {status === "loading"
                      ? "보내는 중…"
                      : status === "error"
                        ? errorHint ??
                          "위치를 가져올 수 없어요. 설정을 확인한 뒤 다시 시도해 주세요."
                        : canSend
                          ? "지금 위치 보내기"
                          : "지금은 쓸 수 없어요"}
                  </span>
                </span>
              </Button>
              <p className="mt-2 text-[11px] text-slate-400 text-center font-semibold leading-snug">
                {helperText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 동의 모달 (Bottom Sheet) */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* 배경 딤 */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />

            {/* 바텀 시트 */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[201] mx-auto max-w-md"
            >
              <div className="rounded-t-[40px] bg-white shadow-[0_-16px_60px_rgba(0,0,0,0.25)] px-6 pt-6 pb-[max(2rem,env(safe-area-inset-bottom,2rem))] space-y-5">
                {/* 핸들 바 */}
                <div className="mx-auto w-10 h-1 rounded-full bg-slate-200 -mt-1" />

                {/* 헤더 */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</p>
                      <h3 className="text-[17px] font-black text-slate-900 leading-tight">지금 위치 보내기</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 active:scale-90 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 안내 문구 */}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
                    <p className="text-[12px] font-black">개인정보 안내</p>
                  </div>
                  <p className="text-[12px] font-semibold text-slate-500 leading-relaxed pl-6">
                    발견하신 <strong className="text-slate-700">현재 위치(GPS)</strong>를 반려동물 보호자에게{" "}
                    <strong className="text-slate-700">1회만</strong> 전송합니다. 수집된 위치 정보는 가족에게만 전달되며 다른 용도로 사용되지 않습니다.
                  </p>
                </div>

                {/* 동의 체크박스 */}
                <label className="flex items-start gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 cursor-pointer transition-all hover:border-teal-300 hover:bg-teal-50/30 active:scale-[0.99]">
                  {/* 커스텀 체크박스 */}
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="sr-only"
                    />
                    <motion.div
                      animate={consentChecked ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                        consentChecked
                          ? "bg-teal-500 border-teal-500 shadow-md shadow-teal-500/30"
                          : "bg-white border-slate-300"
                      )}
                    >
                      {consentChecked && (
                        <motion.svg
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", damping: 12 }}
                          viewBox="0 0 12 12"
                          className="w-3.5 h-3.5 text-white"
                          fill="none"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </motion.svg>
                      )}
                    </motion.div>
                  </div>
                  <span className="text-[14px] font-bold text-slate-800 leading-snug pt-0.5">
                    현재 위치를 가족에게 전달하는 것에 동의합니다.
                  </span>
                </label>

                {/* 전송 버튼 */}
                <Button
                  onClick={handleSend}
                  disabled={!consentChecked}
                  className={cn(
                    "w-full h-14 rounded-2xl text-[15px] font-black transition-all duration-200",
                    consentChecked
                      ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg active:scale-[0.98]"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  위치 전송하기
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
