"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WayfinderSpotUrlCopyProps = {
  url: string;
  className?: string;
};

/**
 * NFC·QR에 넣을 공개 URL을 클립보드로 복사합니다.
 */
export function WayfinderSpotUrlCopy({ url, className }: WayfinderSpotUrlCopyProps) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  const copy = useCallback(async () => {
    if (!url.trim()) return;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("ok");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("err");
      window.setTimeout(() => setStatus("idle"), 2500);
    }
  }, [url]);

  const label =
    status === "ok" ? "복사됨" : status === "err" ? "복사 실패" : "URL 복사";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={copy}
      className={cn(
        "shrink-0 font-black text-slate-700",
        status === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50",
        status === "err" && "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-50",
        className
      )}
      aria-label={`공개 URL 클립보드에 복사: ${url}`}
    >
      {status === "ok" ? (
        <Check className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </Button>
  );
}
