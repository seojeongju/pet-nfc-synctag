"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
  const [locationConsentChecked, setLocationConsentChecked] = useState(false);
  const searchParams = useSearchParams();
  const activeTag = tagId || searchParams.get("tag");
  const canSend = enabled && Boolean(activeTag) && locationConsentChecked;
  const helperText = useMemo(() => {
    if (!enabled) {
      const h = disabledHint?.trim();
      if (h) return h;
      return "이 화면에서만 위치를 보낼 수 있어요.";
    }
    if (!activeTag) return "인식표로 이 화면에 바로 오셨을 때만 가족에게 전달돼요. 링크로만 열었을 땐 전화·문자로 알려 주세요.";
    return "누르면 지금 계신 곳이 가족에게 전해져요. (위치 사용을 허용해 주세요.)";
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

  const handleShare = async () => {
    if (!enabled || !activeTag) return;
    if (!locationConsentChecked) {
      setStatus("error");
      onStatusChange?.("error");
      return;
    }
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
    void logFinderAction({
      action: "location_share_click",
      tagId: activeTag,
      petId: petId ?? null,
      userAgent: ua,
    });
    if (!navigator.geolocation) {
      setStatus("error");
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
    onStatusChange?.("loading");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const res = await updateScanLocation(activeTag as string, latitude, longitude);
          if (!res.success) {
            setStatus("error");
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
          });
          if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
            navigator.vibrate(getHapticPattern());
          }
        } catch (e) {
          console.error(e);
          setStatus("error");
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
        onStatusChange?.("error");
        void logFinderAction({
          action: "location_share_error",
          tagId: activeTag,
          petId: petId ?? null,
          detail: error?.code ? `geo_error_${error.code}` : "geo_error",
          userAgent: ua,
        });
      }
    );
  };

  return (
    <div className="w-full">
      <label className="mb-2 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600">
        <input
          type="checkbox"
          checked={locationConsentChecked}
          onChange={(e) => setLocationConsentChecked(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5"
        />
        현재 위치를 가족에게 전달하는 것에 동의합니다. (동의 후에만 위치 전송 버튼이 활성화됩니다.)
      </label>
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="w-full"
          >
            <Button disabled className="flex h-20 w-full min-w-0 rounded-[28px] border-b-4 border-teal-700 bg-teal-500 px-4 text-lg font-black text-white opacity-100 shadow-xl shadow-teal-500/20">
              <span className="flex w-full min-w-0 items-center justify-center gap-3">
                <motion.span
                  className="inline-flex shrink-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                >
                  <CheckCircle2 className="h-7 w-7" />
                </motion.span>
                <span className="text-center leading-tight">가족에게 보냈어요</span>
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
              onClick={handleShare}
              disabled={!canSend || status === "loading"}
              variant="outline"
              className={cn(
                "group relative flex h-20 w-full min-w-0 overflow-hidden rounded-[28px] border-2 px-4 text-lg font-black transition-all active:scale-95",
                !canSend ? "border-slate-200 bg-slate-50 text-slate-400" : "",
                status === "error"
                  ? "border-rose-100 text-rose-500 hover:bg-rose-50"
                  : "border-teal-100 text-teal-600 hover:bg-teal-50"
              )}
            >
              <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
              <span className="relative z-[1] flex w-full min-w-0 items-center justify-center gap-3">
                {status === "loading" ? (
                  <Loader2 className="h-7 w-7 shrink-0 animate-spin" />
                ) : status === "error" ? (
                  <AlertCircle className="h-7 w-7 shrink-0" />
                ) : (
                  <MapPin className="h-7 w-7 shrink-0 transition-transform group-hover:bounce" />
                )}
                <span className="min-w-0 text-center leading-tight">
                  {status === "loading"
                    ? "보내는 중…"
                    : status === "error"
                      ? "위치를 켜 주시고 다시 눌러 주세요"
                      : canSend
                        ? "지금 위치 보내기"
                        : "지금은 쓸 수 없어요"}
                </span>
              </span>
            </Button>
            <p className="mt-2 text-[11px] text-slate-400 text-center font-semibold">{helperText}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
