"use client";

import { Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SHOW = process.env.NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED === "true";

type Props = {
  kind: string;
  petId: string;
  tenantId: string | null;
  className?: string;
};

/**
 * `petidconnect://nfc/pet?...` — Android Link-U 앱이 받아 기본 브라우저로
 * 동일 반려 상세의 #nfc(앵커) 를 연다. (관리·목록 UI는 웹)
 */
export function OpenNativePetNfcSectionButton({ kind, petId, tenantId, className }: Props) {
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setIsAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  if (!SHOW || !isAndroid) return null;

  const params = new URLSearchParams();
  params.set("kind", kind);
  params.set("pet_id", petId);
  if (tenantId?.trim()) params.set("tenant", tenantId.trim());
  const appHref = `petidconnect://nfc/pet?${params.toString()}`;

  return (
    <div className={cn("pt-2", className)}>
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-9 w-full flex-wrap gap-x-2 border-teal-200 py-2 text-left text-[11px] font-black text-teal-800"
        onClick={() => {
          window.location.href = appHref;
        }}
      >
        <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>전용 앱으로 열기 → 브라우저에 이 NFC 태그 안내</span>
      </Button>
      <p className="mt-1.5 text-center text-[9px] font-bold leading-snug text-slate-400">
        Link-U NFC(Android) 앱이 있을 때만 열립니다. 앱이 이 페이지(태그 섹션)로 연결돼요.
      </p>
    </div>
  );
}
