"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { updateScanLocation } from "@/app/actions/scan";
import { useSearchParams } from "next/navigation";

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
          // If no tag, just show success on UI (mock)
          setStatus("success");
        }
      },
      (error) => {
        console.error(error);
        setStatus("error");
        alert("위치 정보를 가져오는 데 실패했습니다. 권한 설정을 확인해 주세요.");
      }
    );
  };

  if (status === "success") {
    return (
      <Button disabled className="w-full h-16 rounded-[24px] text-lg font-extrabold bg-teal-500 text-white gap-3 shadow-xl shadow-teal-100">
        <CheckCircle2 className="w-6 h-6" />
        위치 공유 완료!
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleShare}
      disabled={status === "loading"}
      variant="outline" 
      className="w-full h-16 rounded-[24px] text-lg font-extrabold border-2 border-teal-100 text-teal-600 hover:bg-teal-50 transition-all active:scale-95 gap-3"
    >
      {status === "loading" ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <MapPin className="w-6 h-6" />
      )}
      현재 위치 공유하기
    </Button>
  );
}
