"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updateScanLocation } from "@/app/actions/scan";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function LocationShare({
  tagId,
  enabled = true,
  onStatusChange,
}: {
  tagId: string | null;
  enabled?: boolean;
  onStatusChange?: (status: "idle" | "loading" | "success" | "error") => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const searchParams = useSearchParams();
  const activeTag = tagId || searchParams.get("tag");
  const canSend = enabled && Boolean(activeTag);
  const helperText = useMemo(() => {
    if (!enabled) return "공개 방문자 화면에서만 위치 공유를 보낼 수 있습니다.";
    if (!activeTag) return "태그 스캔 진입에서만 보호자에게 위치가 전달됩니다.";
    return "현재 위치를 공유하면 보호자에게 마지막 발견 위치가 전달됩니다.";
  }, [enabled, activeTag]);

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
    if (!canSend) return;
    if (!navigator.geolocation) {
      setStatus("error");
      onStatusChange?.("error");
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
            return;
          }
          setStatus("success");
          onStatusChange?.("success");
          if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
            navigator.vibrate(getHapticPattern());
          }
        } catch (e) {
          console.error(e);
          setStatus("error");
          onStatusChange?.("error");
        }
      },
      (error) => {
        console.error(error);
        setStatus("error");
        onStatusChange?.("error");
      }
    );
  };

  return (
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
            <Button disabled className="w-full h-20 rounded-[28px] text-lg font-black bg-teal-500 text-white gap-3 shadow-xl shadow-teal-500/20 border-b-4 border-teal-700 opacity-100">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
              >
                <CheckCircle2 className="w-7 h-7" />
              </motion.div>
              위치 공유 완료!
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
                "w-full h-20 rounded-[28px] text-lg font-black border-2 transition-all active:scale-95 gap-4 group overflow-hidden relative",
                !canSend
                  ? "border-slate-200 text-slate-400 bg-slate-50"
                  : "",
                status === "error" 
                  ? "border-rose-100 text-rose-500 hover:bg-rose-50" 
                  : "border-teal-100 text-teal-600 hover:bg-teal-50"
              )}
            >
              {status === "loading" ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : status === "error" ? (
                <AlertCircle className="w-7 h-7" />
              ) : (
                <MapPin className="w-7 h-7 group-hover:bounce transition-transform" />
              )}
              {status === "loading"
                ? "위치 정보 전송 중..."
                : status === "error"
                  ? "위치 권한을 확인하고 다시 시도해 주세요"
                  : canSend
                    ? "현재 위치 공유하기"
                    : "위치 공유 사용 불가"}
              
              {/* Subtle hover effect light */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
