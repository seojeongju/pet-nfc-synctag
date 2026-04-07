"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updateScanLocation } from "@/app/actions/scan";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function LocationShare({ tagId }: { tagId: string | null }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const searchParams = useSearchParams();
  const activeTag = tagId || searchParams.get("tag");

  const handleShare = async () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
      return;
    }

    setStatus("loading");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (activeTag) {
          try {
            await updateScanLocation(activeTag, latitude, longitude);
            setStatus("success");
          } catch (e) {
            console.error(e);
            setStatus("error");
          }
        } else {
          setStatus("success");
        }
      },
      (error) => {
        console.error(error);
        setStatus("error");
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
              disabled={status === "loading"}
              variant="outline" 
              className={cn(
                "w-full h-20 rounded-[28px] text-lg font-black border-2 transition-all active:scale-95 gap-4 group overflow-hidden relative",
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
              {status === "loading" ? "위치 정보 전송 중..." : status === "error" ? "다시 시도해 주세요" : "현재 위치 공유하기"}
              
              {/* Subtle hover effect light */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
