"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordNfcWebReadAudit, registerBulkTags } from "@/app/actions/admin";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  PawPrint,
  UserRound,
  Baby,
  Briefcase,
  Gem,
  Smartphone,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { isValidTagUidFormat, normalizeTagUid } from "@/lib/tag-uid-format";
import {
  isWebNfcReadSupported,
  readNfcTagUidOnce,
  startNfcUidScanSession,
  type NfcUidScanSession,
} from "@/lib/web-nfc-read-uid";

const kindIcon: Record<SubjectKind, typeof PawPrint> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

const kindTabStyles: Record<
  SubjectKind,
  { active: string; inactive: string; iconBg: string }
> = {
  pet: {
    active: "border-teal-500 bg-teal-50 text-teal-900 shadow-sm",
    inactive: "border-slate-100 bg-white text-slate-500 hover:border-teal-200 hover:bg-teal-50/40",
    iconBg: "bg-teal-500/15 text-teal-600",
  },
  elder: {
    active: "border-violet-500 bg-violet-50 text-violet-900 shadow-sm",
    inactive: "border-slate-100 bg-white text-slate-500 hover:border-violet-200 hover:bg-violet-50/40",
    iconBg: "bg-violet-500/15 text-violet-600",
  },
  child: {
    active: "border-amber-500 bg-amber-50 text-amber-900 shadow-sm",
    inactive: "border-slate-100 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50/40",
    iconBg: "bg-amber-500/15 text-amber-600",
  },
  luggage: {
    active: "border-slate-600 bg-slate-100 text-slate-900 shadow-sm",
    inactive: "border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
    iconBg: "bg-slate-500/15 text-slate-700",
  },
  gold: {
    active: "border-amber-600 bg-amber-50 text-amber-950 shadow-sm",
    inactive: "border-slate-100 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50/40",
    iconBg: "bg-amber-500/15 text-amber-700",
  },
};

export function TagBulkRegisterCard() {
  const router = useRouter();
  const [activeKind, setActiveKind] = useState<SubjectKind>("pet");
  const [uidsByKind, setUidsByKind] = useState<Record<SubjectKind, string>>({
    pet: "",
    elder: "",
    child: "",
    luggage: "",
    gold: "",
  });
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [nfcReadSupported, setNfcReadSupported] = useState<boolean | null>(null);
  const [nfcBusy, setNfcBusy] = useState(false);
  const [nfcContinuous, setNfcContinuous] = useState(false);
  const [nfcHint, setNfcHint] = useState<string | null>(null);
  const sessionRef = useRef<NfcUidScanSession | null>(null);

  useEffect(() => {
    setNfcReadSupported(isWebNfcReadSupported());
  }, []);

  useEffect(() => {
    return () => {
      sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, []);

  const uids = uidsByKind[activeKind];
  const setUidsForActive = (value: string) =>
    setUidsByKind((prev) => ({ ...prev, [activeKind]: value }));

  const uidTokens = uids.split(/[\n,]+/).map(normalizeTagUid).filter((u) => u.length > 0);
  const uniqueTokens = Array.from(new Set(uidTokens));
  const validUids = uniqueTokens.filter(isValidTagUidFormat);
  const duplicateInInputCount = uidTokens.length - uniqueTokens.length;
  const invalidCount = uniqueTokens.length - validUids.length;

  const handleRegister = () => {
    if (!uids.trim()) return;
    const uidList = uids.split(/[\n,]+/).map(normalizeTagUid).filter((u) => u.length > 0);
    if (uidList.length === 0) return;

    startTransition(async () => {
      try {
        const result = await registerBulkTags(uidList, { assignedSubjectKind: activeKind });
        const modeLabel = subjectKindMeta[activeKind].label;
        setMessage({
          type: "success",
          text: `[${modeLabel}] 등록 완료: 신규 ${result.registeredCount}개 / 요청 ${result.requestedCount}개 · 무효 ${result.invalidCount}개 · 요청 내 중복 ${result.duplicateInRequest}개 · 기존 태그 ${result.duplicateExisting}개 (배치 ${result.batchId})`,
        });
        setUidsByKind((prev) => ({ ...prev, [activeKind]: "" }));
        router.refresh();
      } catch {
        setMessage({ type: "error", text: "등록 처리 중 오류가 발생했습니다." });
      }
    });
  };

  const focusRingByKind: Record<SubjectKind, string> = {
    pet: "focus:ring-teal-500/10 focus:border-teal-500/50",
    elder: "focus:ring-violet-500/10 focus:border-violet-500/50",
    child: "focus:ring-amber-500/10 focus:border-amber-500/50",
    luggage: "focus:ring-slate-500/10 focus:border-slate-500/50",
    gold: "focus:ring-amber-600/10 focus:border-amber-600/50",
  };

  const statsPanelByKind: Record<SubjectKind, string> = {
    pet: "bg-teal-50/50 border-teal-100",
    elder: "bg-violet-50/50 border-violet-100",
    child: "bg-amber-50/50 border-amber-100",
    luggage: "bg-slate-50 border-slate-200",
    gold: "bg-amber-50/80 border-amber-200",
  };

  return (
    <AdminCard variant="section" className="space-y-7 overflow-hidden relative">
      <div className="space-y-2 relative z-10">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
          <PlusCircle className="w-5 h-5 text-teal-500" />
          NFC 태그 대량 등록
        </h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          모드 탭 선택 → UID 입력 또는 NFC 스캔
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SUBJECT_KINDS.map((kind) => {
          const Icon = kindIcon[kind];
          const tab = kindTabStyles[kind];
          const active = kind === activeKind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => {
                sessionRef.current?.stop();
                sessionRef.current = null;
                setNfcContinuous(false);
                setActiveKind(kind);
                setMessage(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                active ? tab.active : tab.inactive,
                active ? "ring-offset-white focus-visible:ring-teal-500/40" : "focus-visible:ring-slate-300"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  active ? tab.iconBg : "bg-slate-100 text-slate-400"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-tight text-slate-400">모드</span>
                <span className="block truncate text-xs font-black">{subjectKindMeta[kind].label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative z-10 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] font-bold leading-snug text-slate-500 sm:hidden">NFC 스캔: Chrome·도움말 참고</p>
          <p className="hidden text-[10px] font-bold leading-relaxed text-slate-500 sm:block sm:max-w-[55%]">
            Chrome·HTTPS·버튼 탭 후 NFC 스캔 시 UID가 한 줄씩 붙습니다. (상세: 도움말)
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
            type="button"
            variant="outline"
            disabled={nfcBusy || nfcContinuous || nfcReadSupported === false || isPending}
            onClick={() => {
              setNfcHint(null);
              setMessage(null);
              setNfcBusy(true);
              const kind = activeKind;
              void readNfcTagUidOnce().then((r) => {
                setNfcBusy(false);
                if (r.ok) {
                  setUidsByKind((prev) => {
                    const cur = prev[kind].trim();
                    const next = cur ? `${cur}\n${r.uid}` : r.uid;
                    return { ...prev, [kind]: next };
                  });
                  setNfcHint(`UID를 추가했습니다: ${r.uid}`);
                  void recordNfcWebReadAudit({ success: true, source: "bulk_register", tagId: r.uid });
                } else {
                  setNfcHint(r.error);
                  void recordNfcWebReadAudit({ success: false, source: "bulk_register", clientError: r.error });
                }
              });
            }}
            className="h-11 shrink-0 rounded-2xl border-slate-200 font-black text-xs"
          >
            {nfcBusy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                태그 대기 중…
              </>
            ) : (
              <>
                <Smartphone className="mr-2 inline h-4 w-4" />
                NFC로 UID 한 줄 추가
              </>
            )}
          </Button>
            <Button
              type="button"
              variant={nfcContinuous ? "destructive" : "outline"}
              disabled={nfcReadSupported === false || isPending}
              onClick={() => {
                if (nfcContinuous) {
                  sessionRef.current?.stop();
                  sessionRef.current = null;
                  setNfcContinuous(false);
                  setNfcHint("연속 스캔을 중지했습니다.");
                  return;
                }
                setNfcHint(null);
                setMessage(null);
                setNfcBusy(true);
                const kind = activeKind;
                void startNfcUidScanSession({
                  onUid: (uid) => {
                    setUidsByKind((prev) => {
                      const tokens = prev[kind]
                        .split(/[\n,]+/)
                        .map(normalizeTagUid)
                        .filter((v) => v.length > 0);
                      if (tokens.includes(uid)) return prev;
                      const cur = prev[kind].trim();
                      const next = cur ? `${cur}\n${uid}` : uid;
                      return { ...prev, [kind]: next };
                    });
                    setNfcHint(`연속 스캔 감지: ${uid}`);
                    void recordNfcWebReadAudit({ success: true, source: "bulk_register", tagId: uid });
                  },
                  onError: (error) => {
                    setNfcHint(error);
                    void recordNfcWebReadAudit({ success: false, source: "bulk_register", clientError: error });
                  },
                }).then((res) => {
                  setNfcBusy(false);
                  if (!res.ok) {
                    setNfcHint(res.error);
                    void recordNfcWebReadAudit({ success: false, source: "bulk_register", clientError: res.error });
                    return;
                  }
                  sessionRef.current = res.session;
                  setNfcContinuous(true);
                  setNfcHint("연속 스캔 시작: 태그를 가까이 대면 UID가 자동으로 추가됩니다.");
                });
              }}
              className="h-11 shrink-0 rounded-2xl border-slate-200 font-black text-xs"
            >
              {nfcContinuous ? "연속 스캔 중지" : "연속 스캔 시작"}
            </Button>
          </div>
        </div>
        {nfcReadSupported === false && (
          <p className="text-[10px] font-black text-amber-800">
            NDEFReader 미지원 — UID는 직접 입력하거나 Chrome에서 열기 (도움말)
          </p>
        )}
        {nfcHint && (
          <p className="text-[10px] font-bold text-slate-600 whitespace-pre-wrap leading-relaxed">{nfcHint}</p>
        )}
        <textarea
          value={uids}
          onChange={(e) => setUidsForActive(e.target.value)}
          placeholder="UID (줄 또는 쉼표로 구분)"
          className={cn(
            "w-full h-48 bg-slate-50 border border-slate-200 rounded-[23px] p-6 text-sm font-mono text-slate-700",
            "focus:ring-4 focus:outline-none transition-all resize-none shadow-inner",
            focusRingByKind[activeKind]
          )}
        />
      </div>

      <div className={cn("rounded-xl border p-4 text-[11px] font-bold space-y-2", statsPanelByKind[activeKind])}>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">유효 UID</span>
          <span className="text-slate-900 tabular-nums">{validUids.length}개</span>
        </div>
        <div className="flex items-center justify-between">
          <span className={duplicateInInputCount > 0 ? "text-amber-600" : "text-slate-500"}>입력 내 중복</span>
          <span className={duplicateInInputCount > 0 ? "text-amber-700 tabular-nums" : "text-slate-700 tabular-nums"}>
            {duplicateInInputCount}개
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={invalidCount > 0 ? "text-rose-600" : "text-slate-500"}>형식 오류</span>
          <span className={invalidCount > 0 ? "text-rose-700 tabular-nums" : "text-slate-700 tabular-nums"}>
            {invalidCount}개
          </span>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "p-4 rounded-2xl flex items-start gap-3 border text-xs font-bold relative overflow-hidden",
              message.type === "success"
                ? adminUi.successBadge
                : adminUi.dangerBadge
            )}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        type="button"
        onClick={handleRegister}
        disabled={isPending || !uids.trim()}
        className={cn(
          "w-full h-16 rounded-[24px] group relative overflow-hidden font-black text-sm transition-all active:scale-95 shadow-xl",
          adminUi.darkButton
        )}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isPending ? (
            "처리 중..."
          ) : (
            <>
              {subjectKindMeta[activeKind].label} 묶음으로 태그 인벤토리 등록
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </span>
      </Button>

      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl pointer-events-none rounded-full" />
    </AdminCard>
  );
}
