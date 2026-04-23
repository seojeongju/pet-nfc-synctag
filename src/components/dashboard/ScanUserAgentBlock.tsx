"use client";

import { useState, useCallback } from "react";
import { Copy, Check, MonitorSmartphone, Smartphone } from "lucide-react";
import { summarizeUserAgent } from "@/lib/user-agent-label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  userAgent: string | null | undefined;
  className?: string;
};

/**
 * 스캔 기록: 발견자가 프로필을 열 때 기록된 User-Agent 요약 + 전체/복사
 */
export function ScanUserAgentBlock({ userAgent, className }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    if (!userAgent) return;
    try {
      await navigator.clipboard.writeText(userAgent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op
    }
  }, [userAgent]);

  if (!userAgent?.trim()) {
    return (
      <div
        className={cn(
          "flex min-h-12 items-center gap-2 rounded-xl bg-slate-50 p-2 text-slate-500",
          className
        )}
      >
        <Smartphone className="h-4 w-4 shrink-0 text-slate-300" />
        <span className="text-xs font-bold">User-Agent 없음</span>
      </div>
    );
  }

  const summary = summarizeUserAgent(userAgent);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full min-h-12 min-w-0 items-start gap-2 rounded-xl bg-slate-50 p-2 text-left text-slate-600",
          "transition-colors hover:bg-teal-50/80 hover:text-teal-800 focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:outline-none",
          className
        )}
        aria-label="접속 환경 User-Agent 상세"
      >
        <MonitorSmartphone className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold leading-snug">{summary}</p>
          <p className="text-[10px] font-bold text-slate-400">탭하여 전체·복사</p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>접속 환경 (User-Agent)</DialogTitle>
            <DialogDescription>
              이 스캔 시점에 발견자가 공개 프로필을 열 때 브라우저가 보낸 식별
              문자열입니다. 기기·브라우저 판단·문의 대응에 쓰입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <p className="whitespace-pre-wrap break-all text-[11px] font-mono text-slate-800 leading-relaxed">
              {userAgent}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopy}
              className="font-bold"
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  전문 복사
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
