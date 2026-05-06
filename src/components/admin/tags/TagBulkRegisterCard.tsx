"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordNfcWebReadAudit, registerBulkTags, type RegisterBulkTagsOptions } from "@/app/actions/admin";
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
import { writeNfcUrlRecord } from "@/lib/web-nfc-write-url";

/** UID로 기록할 URL 생성 */
function buildTagUrl(uid: string): string {
  const base =
    (process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : ""))
      .replace(/\/$/, "");
  return `${base}/t/${encodeURIComponent(uid)}`;
}

/** NFC 칩에 URL NDEF 기록 시도 (실패해도 UID 등록은 계속) */
async function tryWriteUrlToChip(uid: string): Promise<{ ok: boolean; error?: string }> {
  const result = await writeNfcUrlRecord(buildTagUrl(uid));
  if (result.ok) return { ok: true };
  return { ok: false, error: result.error };
}

const kindIcon: Record<SubjectKind, typeof PawPrint> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

const kindShortLabel: Record<SubjectKind, string> = {
  pet: "링크유-펫",
  elder: "링크유-메모리",
  child: "링크유-키즈",
  luggage: "링크유-러기지",
  gold: "링크유-골드",
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
  /** 이미 DB에 있는 UID: 건너뛰기 vs 현재 모드·배치로 메타 갱신 */
  const [existingUidBehavior, setExistingUidBehavior] =
    useState<NonNullable<RegisterBulkTagsOptions["existingUidBehavior"]>>("skip");
  const sessionRef = useRef<NfcUidScanSession | null>(null);
  /** NFC 읽기가 비동기라, 완료 시점의 활성 모드 기준으로 UID를 반영합니다 */
  const activeKindRef = useRef<SubjectKind>(activeKind);
  activeKindRef.current = activeKind;
  /** iOS / Safari 환경 감지 (NFC 읽기·쓰기 모두 미지원) */
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    setNfcReadSupported(isWebNfcReadSupported());
    // iOS 기기 또는 iPad OS(모바일 Safari) 감지
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIos = /iPad|iPhone|iPod/.test(ua) ||
      (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafariOnly = /^((?!chrome|chromium|crios|fxios|opios|brave).)*safari/i.test(ua);
    setIsIosSafari(isIos || isSafariOnly);
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
        const result = await registerBulkTags(uidList, {
          assignedSubjectKind: activeKind,
          existingUidBehavior,
        });
        const modeLabel = subjectKindMeta[activeKind].label;
        const metaLine =
          existingUidBehavior === "update_meta" && result.updatedExistingMeta > 0
            ? ` · 기존 UID 메타 갱신 ${result.updatedExistingMeta}개`
            : "";
        setMessage({
          type: "success",
          text: `[${modeLabel}] 등록 완료: 신규 ${result.registeredCount}개 / 요청 ${result.requestedCount}개 · 무효 ${result.invalidCount}개 · 요청 내 중복 ${result.duplicateInRequest}개 · DB에 이미 있던 UID ${result.duplicateExisting}개${metaLine} (배치 ${result.batchId})`,
        });
        setNfcHint(null);
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
        <p className="text-[11px] font-black uppercase tracking-tight text-slate-500 sm:text-[10px]">
          모드 선택 → UID 입력/스캔 → 등록
        </p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                setNfcHint(null);
              }}
              className={cn(
                "touch-manipulation shrink-0 flex min-h-[52px] min-w-[112px] items-center gap-2 rounded-2xl border px-3 py-3 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.99] sm:min-h-0 sm:py-2.5",
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
                <span className="block text-xs font-black leading-snug break-words [text-wrap:balance]">
                  {kindShortLabel[kind]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative z-10 space-y-2">
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold leading-snug text-slate-500 sm:text-[10px] sm:font-bold">
            NFC 스캔은 Android Chrome + HTTPS 환경에서 동작합니다.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2">
            <Button
            type="button"
            variant="outline"
            disabled={nfcBusy || nfcContinuous || nfcReadSupported === false || isPending}
            onClick={() => {
              setNfcHint(null);
              setMessage(null);
              setNfcBusy(true);
              void readNfcTagUidOnce().then(async (r) => {
                if (r.ok) {
                  const k = activeKindRef.current;
                  setUidsByKind((prev) => {
                    const cur = prev[k].trim();
                    const next = cur ? `${cur}\n${r.uid}` : r.uid;
                    return { ...prev, [k]: next };
                  });
                  // UID 읽기 직후 URL을 칩에 자동 기록
                  const writeResult = await tryWriteUrlToChip(r.uid);
                  if (writeResult.ok) {
                    setNfcHint(`[${kindShortLabel[k]}] UID 추가 + URL 자동 기록 완료: ${r.uid}`);
                  } else {
                    setNfcHint(`[${kindShortLabel[k]}] UID 추가됨: ${r.uid}\n⚠️ URL 자동 기록 실패(${writeResult.error}) — 수동으로 URL 기록 페이지에서 처리하세요.`);
                  }
                  void recordNfcWebReadAudit({ success: true, source: "bulk_register", tagId: r.uid });
                } else {
                  setNfcHint(r.error);
                  void recordNfcWebReadAudit({ success: false, source: "bulk_register", clientError: r.error });
                }
                setNfcBusy(false);
              });
            }}
            className="min-h-12 rounded-2xl border-slate-200 text-[14px] font-black touch-manipulation sm:h-11 sm:text-xs"
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
                void startNfcUidScanSession({
                  onUid: async (uid) => {
                    const k = activeKindRef.current;
                    setUidsByKind((prev) => {
                      const tokens = prev[k]
                        .split(/[\n,]+/)
                        .map(normalizeTagUid)
                        .filter((v) => v.length > 0);
                      if (tokens.includes(uid)) return prev;
                      const cur = prev[k].trim();
                      const next = cur ? `${cur}\n${uid}` : uid;
                      return { ...prev, [k]: next };
                    });
                    // 연속 스캔 시에도 URL 자동 기록
                    const writeResult = await tryWriteUrlToChip(uid);
                    if (writeResult.ok) {
                      setNfcHint(`[${kindShortLabel[k]}] 연속 스캔 + URL 자동 기록: ${uid}`);
                    } else {
                      setNfcHint(`[${kindShortLabel[k]}] 연속 스캔 감지: ${uid}\n⚠️ URL 기록 실패(${writeResult.error})`);
                    }
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
              className="min-h-12 rounded-2xl border-slate-200 text-[14px] font-black touch-manipulation sm:h-11 sm:text-xs"
            >
              {nfcContinuous ? "연속 스캔 중지" : "연속 스캔 시작"}
            </Button>
          </div>
        </div>
        {/* iOS/Safari 환경: NFC 읽기·쓰기 완전 미지원 안내 */}
        {isIosSafari && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <span className="mt-0.5 text-base leading-none">🚫</span>
            <div className="space-y-0.5">
              <p className="text-[13px] font-black text-rose-800 sm:text-xs">
                iOS / Safari는 NFC 스캔 기능을 사용할 수 없습니다.
              </p>
              <p className="text-[11px] font-semibold text-rose-600 leading-snug sm:text-[10px]">
                UID는 직접 입력하거나, Android Chrome에서 이 페이지를 열어 NFC 스캔을 사용하세요.
              </p>
            </div>
          </div>
        )}
        {!isIosSafari && nfcReadSupported === false && (
          <p className="text-[13px] font-black text-amber-800 sm:text-[10px]">
            NDEFReader 미지원 — UID는 직접 입력하거나 Chrome에서 열기 (도움말)
          </p>
        )}
        {nfcHint && (
          <p className="text-[13px] font-semibold text-slate-600 whitespace-pre-wrap leading-relaxed sm:text-[10px] sm:font-bold">
            {nfcHint}
          </p>
        )}
        <textarea
          value={uids}
          onChange={(e) => setUidsForActive(e.target.value)}
          placeholder="UID (줄 또는 쉼표로 구분)"
          className={cn(
            "min-h-[11rem] w-full resize-none rounded-[23px] border border-slate-200 bg-slate-50 p-5 font-mono text-base text-slate-700 shadow-inner",
            "transition-all focus:outline-none focus:ring-4 sm:h-44 sm:text-sm",
            focusRingByKind[activeKind]
          )}
        />
      </div>

      <div
        className={cn(
          "space-y-2 rounded-xl border p-4 text-[13px] font-bold sm:text-[11px]",
          statsPanelByKind[activeKind]
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">유효 UID</span>
          <span className="text-slate-900 tabular-nums">{validUids.length}개</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className={duplicateInInputCount > 0 ? "text-amber-600" : "text-slate-500"}>입력 내 중복</span>
          <span className={duplicateInInputCount > 0 ? "text-amber-700 tabular-nums" : "text-slate-700 tabular-nums"}>
            {duplicateInInputCount}개
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className={invalidCount > 0 ? "text-rose-600" : "text-slate-500"}>형식 오류</span>
          <span className={invalidCount > 0 ? "text-rose-700 tabular-nums" : "text-slate-700 tabular-nums"}>
            {invalidCount}개
          </span>
        </div>
      </div>

      <fieldset className="space-y-2 rounded-xl border border-slate-200 bg-white/80 p-4">
        <legend className="text-[11px] font-black uppercase tracking-wide text-slate-600 px-1">
          이미 등록된 UID가 있을 때
        </legend>
        <label className="flex cursor-pointer items-start gap-2.5 touch-manipulation">
          <input
            type="radio"
            name="existingUidBehavior"
            className="mt-1"
            checked={existingUidBehavior === "skip"}
            onChange={() => setExistingUidBehavior("skip")}
          />
          <span>
            <span className="block text-[13px] font-black text-slate-900 sm:text-xs">건너뛰기 (기본)</span>
            <span className="block text-[12px] font-semibold leading-snug text-slate-500 sm:text-[10px] sm:font-bold">
              DB에 같은 UID가 있으면 새 행을 만들지 않습니다.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 touch-manipulation">
          <input
            type="radio"
            name="existingUidBehavior"
            className="mt-1"
            checked={existingUidBehavior === "update_meta"}
            onChange={() => setExistingUidBehavior("update_meta")}
          />
          <span>
            <span className="block text-[13px] font-black text-slate-900 sm:text-xs">할당 모드·배치 갱신</span>
            <span className="block text-[12px] font-semibold leading-snug text-slate-500 sm:text-[10px] sm:font-bold">
              위에서 선택한 모드·이번 배치 ID로 기존 태그 메타를 덮어씁니다. (펫 연결은 유지됩니다. 완전 삭제는 인벤토리
              목록의 삭제를 사용하세요.)
            </span>
          </span>
        </label>
      </fieldset>

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
          "min-h-14 w-full touch-manipulation rounded-[24px] px-4 py-4 text-[15px] shadow-xl transition-all group relative overflow-hidden font-black active:scale-[0.98] sm:py-3 sm:text-sm",
          adminUi.darkButton
        )}
      >
        <span className="relative z-10 flex w-full items-center justify-center gap-2 text-center leading-snug break-keep whitespace-normal">
          {isPending ? (
            "처리 중..."
          ) : (
            <>
              {kindShortLabel[activeKind]} 태그 인벤토리 등록
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </span>
      </Button>

      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl pointer-events-none rounded-full" />
    </AdminCard>
  );
}
