"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "모드 선택" },
  { id: 2, label: "대상 등록" },
  { id: 3, label: "태그 연결" },
] as const;

type TagActivateBannerProps = {
  tagId: string;
  onDismiss?: () => void;
  className?: string;
  /** 모드 게이트 등 좁은 레이아웃 */
  compact?: boolean;
};

export function TagActivateBanner({
  tagId,
  onDismiss,
  className,
  compact = false,
}: TagActivateBannerProps) {
  const shortUid =
    tagId.length > 18 ? `${tagId.slice(0, 16)}…` : tagId;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className={cn("relative z-50", className)}
      >
        <div
          className={cn(
            "flex flex-col gap-3 rounded-[22px] border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50/80 shadow-lg shadow-teal-500/10",
            compact ? "px-3.5 py-3.5" : "px-4 py-4"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-md shadow-teal-500/30">
              <Tag className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[13px] font-black leading-tight text-teal-950">
                새 링크유 태그가 감지됐어요
              </p>
              <p className="text-[11px] font-semibold leading-snug text-teal-800/90">
                이 태그는 범용 제품입니다. 아래에서 <strong className="font-black">사용 목적에 맞는 모드</strong>를
                고른 뒤 대상을 등록하고 연결해 주세요.
              </p>
              <div className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[10px] font-bold text-teal-700 ring-1 ring-teal-200">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden />
                <span className="truncate">UID {shortUid}</span>
              </div>
            </div>
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-teal-600 transition-colors hover:bg-white hover:text-teal-800"
                aria-label="안내 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <ol
            className={cn(
              "grid gap-1.5",
              compact ? "grid-cols-3" : "grid-cols-3 sm:gap-2"
            )}
            aria-label="태그 연결 순서"
          >
            {steps.map((step) => (
              <li
                key={step.id}
                className="flex flex-col items-center gap-1 rounded-xl border border-teal-100/90 bg-white/70 px-1.5 py-2 text-center"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-[10px] font-black text-teal-800">
                  {step.id}
                </span>
                <span className="text-[9px] font-black leading-tight text-slate-700 min-[360px]:text-[10px]">
                  {step.label}
                </span>
              </li>
            ))}
          </ol>

          <p className="flex items-start gap-1.5 text-[10px] font-semibold leading-snug text-slate-600">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden />
            모드는 나중에 바꿀 수 있어요. 지금은 연결할 대상에 맞는 모드를 선택하면 됩니다.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
