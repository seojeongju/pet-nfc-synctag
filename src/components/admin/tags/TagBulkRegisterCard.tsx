"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerBulkTags } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Plus, CheckCircle, AlertCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { motion, AnimatePresence } from "framer-motion";

export function TagBulkRegisterCard() {
  const router = useRouter();
  const [uids, setUids] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const normalizeUid = (uid: string) => uid.trim().toUpperCase();
  const uidTokens = uids
    .split(/[\n,]/)
    .map((u) => normalizeUid(u))
    .filter((u) => u.length > 0);
  const uniqueTokens = Array.from(new Set(uidTokens));
  const duplicateInInputCount = uidTokens.length - uniqueTokens.length;
  const validUidPattern = /^([0-9A-F]{2}:){3,15}[0-9A-F]{2}$|^[A-Z0-9_-]{8,32}$/;
  const invalidInInputCount = uniqueTokens.filter((u) => !validUidPattern.test(u)).length;

  const handleRegister = async () => {
    if (!uids.trim()) return;
    const uidList = uids.split(/[\n,]/).map((u) => u.trim()).filter((u) => u.length > 0);
    if (uidList.length === 0) return;

    startTransition(async () => {
      try {
        const result = await registerBulkTags(uidList);
        setMessage({
          type: "success",
          text: `등록 ${result.registeredCount}개 / 실패 ${result.failedCount}개 (중복입력 ${result.duplicateInRequest}, 기존중복 ${result.duplicateExisting}, 형식오류 ${result.invalidCount})`,
        });
        setUids("");
        router.refresh();
      } catch {
        setMessage({ type: "error", text: "태그 등록 중 오류가 발생했습니다." });
      }
    });
  };

  return (
    <AdminCard variant="section" className="space-y-7 relative overflow-hidden">
      <div className="space-y-2 relative z-10">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-teal-400" />
          신규 태그 등록
        </h3>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">NFC UID 대량 등록</p>
      </div>

      <div className="relative z-10">
        <textarea
          value={uids}
          onChange={(e) => setUids(e.target.value)}
          placeholder="예: 04:A1:B2:C3, 04:D4:E5:F6..."
          className="w-full h-80 bg-slate-50 border border-slate-200 rounded-[32px] p-6 text-sm font-mono text-teal-700 focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all resize-none shadow-inner custom-scrollbar"
        />
      </div>
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-[11px] font-bold text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>입력 UID</span>
          <span className="text-slate-700">{uidTokens.length}개</span>
        </div>
        <div className="flex items-center justify-between">
          <span>중복 UID(입력 내)</span>
          <span className={duplicateInInputCount > 0 ? "text-amber-500" : "text-slate-700"}>{duplicateInInputCount}개</span>
        </div>
        <div className="flex items-center justify-between">
          <span>형식 오류</span>
          <span className={invalidInInputCount > 0 ? "text-rose-500" : "text-slate-700"}>{invalidInInputCount}개</span>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "p-4 rounded-2xl flex items-center gap-3 text-xs font-bold relative z-10 border",
              message.type === "success" ? adminUi.successBadge : adminUi.dangerBadge
            )}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 hover:scale-110 transition-transform" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={handleRegister}
        disabled={isPending || !uids.trim()}
        className={cn("w-full h-16 rounded-[24px] group relative z-10", adminUi.darkButton)}
      >
        {isPending ? "시스템 주입 중..." : "태그 인벤토리 등록"}
        <ArrowUpRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
      </Button>

      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl pointer-events-none" />
    </AdminCard>
  );
}
