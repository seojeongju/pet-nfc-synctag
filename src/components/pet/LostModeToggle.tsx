"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { toggleLostMode } from "@/app/actions/pet";
import { cn } from "@/lib/utils";

interface LostModeToggleProps {
  petId: string;
  petName: string;
  initialIsLost: boolean;
  writeLocked?: boolean;
}

export function LostModeToggle({
  petId,
  petName,
  initialIsLost,
  writeLocked = false,
}: LostModeToggleProps) {
  const [isLost, setIsLost] = useState(initialIsLost);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingNext, setPendingNext] = useState<boolean | null>(null);

  const runToggle = (next: boolean) => {
    if (writeLocked || isPending) return;
    setError(null);
    setIsLost(next);
    startTransition(async () => {
      try {
        await toggleLostMode(petId, next);
      } catch (e) {
        // 실패 시 롤백
        setIsLost(!next);
        setError(e instanceof Error ? e.message : "상태 변경에 실패했습니다.");
      }
    });
  };
  const handleToggle = () => {
    if (writeLocked || isPending) return;
    const next = !isLost;
    setPendingNext(next);
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-2">
      {/* 실종 모드 활성화 배너 */}
      {isLost && (
        <div className="flex items-center gap-3 rounded-[20px] bg-rose-500 px-4 py-3 shadow-lg shadow-rose-500/20 animate-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="w-5 h-5 text-white shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white">🚨 실종 모드 활성화 중</p>
            <p className="text-[10px] text-white/80 font-bold">
              {petName}의 공개 프로필에 긴급 배너가 표시됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 토글 버튼 */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={writeLocked || isPending}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4 rounded-[20px] border-2 transition-all duration-200 active:scale-[0.98]",
          isLost
            ? "bg-rose-50 border-rose-200 hover:border-rose-400"
            : "bg-slate-50 border-slate-200 hover:border-teal-300",
          (writeLocked || isPending) && "opacity-50 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
              isLost ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
            )}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLost ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
          </div>
          <div className="text-left">
            <p className={cn("text-sm font-black", isLost ? "text-rose-700" : "text-slate-800")}>
              {isLost ? "실종 모드 ON" : "안전 상태"}
            </p>
            <p className="text-[10px] font-bold text-slate-400">
              {isLost ? "탭하여 안전 상태로 전환" : "탭하여 실종 신고 활성화"}
            </p>
          </div>
        </div>

        {/* 슬라이드 토글 시각화 */}
        <div
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors duration-300",
            isLost ? "bg-rose-500" : "bg-slate-200"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300",
              isLost ? "translate-x-6" : "translate-x-0.5"
            )}
          />
        </div>
      </button>

      {error && (
        <p className="text-[11px] font-bold text-rose-500 px-1">{error}</p>
      )}

      {confirmOpen && pendingNext !== null && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <p className="text-sm font-black text-slate-900">
              {pendingNext ? "실종 모드를 켤까요?" : "안전 상태로 전환할까요?"}
            </p>
            <p className="mt-1 text-[11px] font-bold text-slate-500 leading-relaxed">
              {pendingNext
                ? `${petName}의 공개 프로필에 긴급 배너가 노출됩니다.`
                : "실종 경고 배너가 비활성화됩니다."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="h-11 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-700"
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingNext(null);
                }}
              >
                취소
              </button>
              <button
                type="button"
                className={cn(
                  "h-11 rounded-2xl text-xs font-black text-white",
                  pendingNext ? "bg-rose-500 hover:bg-rose-600" : "bg-teal-600 hover:bg-teal-700"
                )}
                onClick={() => {
                  setConfirmOpen(false);
                  const next = pendingNext;
                  setPendingNext(null);
                  runToggle(next);
                }}
              >
                {pendingNext ? "실종모드 ON" : "안전상태 전환"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
