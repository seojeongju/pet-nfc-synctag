"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  listWayfinderSpotsForAdminTagLink,
  recordNfcWebReadAudit,
  registerBulkTags,
  type RegisterBulkTagsOptions,
} from "@/app/actions/admin";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Smartphone,
  Loader2,
  TrainFront,
  Link2,
  ExternalLink,
  Package,
  Info,
} from "lucide-react";
import type { AdminWayfinderSpotPickRow } from "@/types/admin-tags";
import { computeNdefWriteUrlForInventoryTag } from "@/lib/nfc-inventory-ndef-url";
import { buildWayfinderCompanionPublicUrl } from "@/lib/wayfinder/companion-url";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { isValidTagUidFormat, normalizeTagUid } from "@/lib/tag-uid-format";
import {
  isWebNfcReadSupported,
  readNfcTagUidOnce,
  startNfcUidScanSession,
  type NfcUidScanSession,
} from "@/lib/web-nfc-read-uid";
import { writeNfcUrlRecord } from "@/lib/web-nfc-write-url";

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/$/, "");
}

function buildTagUrl(uid: string): string {
  return `${appBaseUrl()}/t/${encodeURIComponent(uid)}`;
}

async function tryWriteUrlToChip(uid: string): Promise<{ ok: boolean; error?: string }> {
  const result = await writeNfcUrlRecord(buildTagUrl(uid));
  if (result.ok) return { ok: true };
  return { ok: false, error: result.error };
}

async function tryWriteWayfinderUrlToChip(
  uid: string,
  spot: Pick<AdminWayfinderSpotPickRow, "id" | "slug" | "is_published" | "title"> | null
): Promise<{ ok: boolean; error?: string; url?: string }> {
  if (!spot) {
    const url = buildWayfinderCompanionPublicUrl(appBaseUrl(), uid);
    const write = await writeNfcUrlRecord(url);
    if (write.ok) return { ok: true, url };
    return { ok: false, error: write.error, url };
  }
  const built = computeNdefWriteUrlForInventoryTag(
    appBaseUrl(),
    uid,
    {
      wf_spot: spot.id,
      wf_slug: spot.slug,
      wf_pub: spot.is_published,
      wf_title: spot.title,
    },
    { allowUnpublishedWayfinder: true }
  );
  if (!built.ok) return { ok: false, error: built.error };
  const write = await writeNfcUrlRecord(built.url);
  if (write.ok) return { ok: true, url: built.url };
  return { ok: false, error: write.error, url: built.url };
}

type RegisterBulkMode = "product" | "wayfinder";

const wayfinderTabStyle = {
  active: "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm ring-offset-white focus-visible:ring-emerald-500/40",
  inactive: "border-slate-100 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50/40 focus-visible:ring-slate-300",
  iconBg: "bg-emerald-500/15 text-emerald-700",
};

function stopNfcSession(
  sessionRef: React.MutableRefObject<NfcUidScanSession | null>,
  setNfcContinuous: (v: boolean) => void
) {
  sessionRef.current?.stop();
  sessionRef.current = null;
  setNfcContinuous(false);
}

export function TagBulkRegisterCard() {
  const router = useRouter();
  const [registerMode, setRegisterMode] = useState<RegisterBulkMode>("product");
  const [wayfinderSpotId, setWayfinderSpotId] = useState("");
  const [wfUids, setWfUids] = useState("");
  const [productUids, setProductUids] = useState("");
  const [batchLabel, setBatchLabel] = useState("");
  const [wfSpots, setWfSpots] = useState<AdminWayfinderSpotPickRow[]>([]);
  const [wfSpotsLoading, setWfSpotsLoading] = useState(true);
  const [wfSpotsError, setWfSpotsError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [nfcReadSupported, setNfcReadSupported] = useState<boolean | null>(null);
  const [nfcBusy, setNfcBusy] = useState(false);
  const [nfcContinuous, setNfcContinuous] = useState(false);
  const [nfcHint, setNfcHint] = useState<string | null>(null);
  const [existingUidBehavior, setExistingUidBehavior] =
    useState<NonNullable<RegisterBulkTagsOptions["existingUidBehavior"]>>("skip");
  const sessionRef = useRef<NfcUidScanSession | null>(null);
  const registerModeRef = useRef<RegisterBulkMode>(registerMode);
  registerModeRef.current = registerMode;
  const wayfinderSpotIdRef = useRef(wayfinderSpotId);
  wayfinderSpotIdRef.current = wayfinderSpotId;
  const wfSpotsRef = useRef(wfSpots);
  wfSpotsRef.current = wfSpots;
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    setNfcReadSupported(isWebNfcReadSupported());
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIos =
      /iPad|iPhone|iPod/.test(ua) ||
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

  useEffect(() => {
    let cancelled = false;
    setWfSpotsLoading(true);
    setWfSpotsError(null);
    void listWayfinderSpotsForAdminTagLink()
      .then((rows) => {
        if (!cancelled) setWfSpots(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setWfSpots([]);
          setWfSpotsError(
            e instanceof Error
              ? e.message
              : "동행 스팟 목록을 불러오지 못했습니다. D1 마이그레이션(wayfinder_spots, tags.wayfinder_spot_id)을 확인하세요."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setWfSpotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const bulkUidText = registerMode === "wayfinder" ? wfUids : productUids;
  const uidTokens = bulkUidText.split(/[\n,]+/).map(normalizeTagUid).filter((u) => u.length > 0);
  const uniqueTokens = Array.from(new Set(uidTokens));
  const validUids = uniqueTokens.filter(isValidTagUidFormat);
  const duplicateInInputCount = uidTokens.length - uniqueTokens.length;
  const invalidCount = uniqueTokens.length - validUids.length;

  const appendProductUid = (uid: string) => {
    setProductUids((prev) => {
      const tokens = prev
        .split(/[\n,]+/)
        .map(normalizeTagUid)
        .filter((v) => v.length > 0);
      if (tokens.includes(uid)) return prev;
      const cur = prev.trim();
      return cur ? `${cur}\n${uid}` : uid;
    });
  };

  const appendWfUid = (uid: string) => {
    setWfUids((prev) => {
      const tokens = prev
        .split(/[\n,]+/)
        .map(normalizeTagUid)
        .filter((v) => v.length > 0);
      if (tokens.includes(uid)) return prev;
      const cur = prev.trim();
      return cur ? `${cur}\n${uid}` : uid;
    });
  };

  const handleRegister = () => {
    if (registerMode === "wayfinder") {
      if (!wfUids.trim()) return;
      const uidList = wfUids.split(/[\n,]+/).map(normalizeTagUid).filter((u) => u.length > 0);
      if (uidList.length === 0) return;
      const spot = wayfinderSpotId.trim() || undefined;
      startTransition(async () => {
        try {
          const result = await registerBulkTags(uidList, {
            ...(spot ? { wayfinderSpotId: spot } : {}),
            linkuWayfinderInventory: true,
            existingUidBehavior,
          });
          const metaLine =
            existingUidBehavior === "update_meta" && result.updatedExistingMeta > 0
              ? ` · 기존 UID 메타 갱신 ${result.updatedExistingMeta}개`
              : "";
          setMessage({
            type: "success",
            text: `[링크유-동행] 등록 완료: 신규 ${result.registeredCount}개 / 요청 ${result.requestedCount}개 · 무효 ${result.invalidCount}개 · 요청 내 중복 ${result.duplicateInRequest}개 · DB에 이미 있던 UID ${result.duplicateExisting}개${metaLine} (배치 ${result.batchId})`,
          });
          setNfcHint(null);
          setWfUids("");
          router.refresh();
        } catch {
          setMessage({ type: "error", text: "등록 처리 중 오류가 발생했습니다." });
        }
      });
      return;
    }

    if (!productUids.trim()) return;
    const uidList = productUids.split(/[\n,]+/).map(normalizeTagUid).filter((u) => u.length > 0);
    if (uidList.length === 0) return;

    startTransition(async () => {
      try {
        const result = await registerBulkTags(uidList, {
          assignedSubjectKind: null,
          batchLabel: batchLabel.trim() || null,
          existingUidBehavior,
        });
        const metaLine =
          existingUidBehavior === "update_meta" && result.updatedExistingMeta > 0
            ? ` · 기존 UID 메타 갱신 ${result.updatedExistingMeta}개`
            : "";
        setMessage({
          type: "success",
          text: `[범용 제품 NFC] 등록 완료: 신규 ${result.registeredCount}개 / 요청 ${result.requestedCount}개 · 무효 ${result.invalidCount}개 · 요청 내 중복 ${result.duplicateInRequest}개 · DB에 이미 있던 UID ${result.duplicateExisting}개${metaLine} (배치 ${result.batchId}) · 모드는 보호자가 연결 시 선택합니다.`,
        });
        setNfcHint(null);
        setProductUids("");
        router.refresh();
      } catch {
        setMessage({ type: "error", text: "등록 처리 중 오류가 발생했습니다." });
      }
    });
  };

  const selectProductMode = () => {
    stopNfcSession(sessionRef, setNfcContinuous);
    setRegisterMode("product");
    setMessage(null);
    setNfcHint(null);
  };

  const selectWayfinderMode = () => {
    stopNfcSession(sessionRef, setNfcContinuous);
    setRegisterMode("wayfinder");
    setMessage(null);
    setNfcHint(null);
  };

  const handleWayfinderNfcUid = async (uid: string, continuous: boolean) => {
    const spotId = wayfinderSpotIdRef.current.trim();
    const spot = wfSpotsRef.current.find((s) => s.id === spotId) ?? null;
    appendWfUid(uid);
    const writeResult = await tryWriteWayfinderUrlToChip(uid, spot);
    if (writeResult.ok) {
      const warnSpot =
        spot && Number(spot.is_published) !== 1
          ? "\n⚠️ 보조 스팟 미발행 — 지점 안내 카드는 공개 전까지 보이지 않을 수 있습니다."
          : "";
      const noSpotHint = !spot
        ? "\n(보조 스팟 미선택 — 인벤토리 등록 후에도 동일 /wayfinder URL로 기록됩니다.)"
        : "";
      setNfcHint(
        `[링크유-동행] ${continuous ? "연속 스캔" : "UID 추가"} + URL 기록: ${uid}\n${writeResult.url ?? ""}${warnSpot}${noSpotHint}`
      );
    } else {
      setNfcHint(
        `[링크유-동행] UID 추가: ${uid}\n⚠️ 칩 URL 기록 실패(${writeResult.error}) —「URL 기록」메뉴에서 수동 기록하세요.`
      );
    }
    void recordNfcWebReadAudit({ success: true, source: "bulk_register", tagId: uid });
  };

  const handleProductNfcUid = async (uid: string, continuous: boolean) => {
    appendProductUid(uid);
    const writeResult = await tryWriteUrlToChip(uid);
    if (writeResult.ok) {
      setNfcHint(
        `[범용 제품] ${continuous ? "연속 스캔" : "UID 추가"} + URL 기록 완료: ${uid}\n${buildTagUrl(uid)}`
      );
    } else {
      setNfcHint(
        `[범용 제품] UID 추가: ${uid}\n⚠️ URL 자동 기록 실패(${writeResult.error}) —「URL 기록」에서 수동 처리하세요.`
      );
    }
    void recordNfcWebReadAudit({ success: true, source: "bulk_register", tagId: uid });
  };

  const selectedWfSpot = wfSpots.find((s) => s.id === wayfinderSpotId.trim()) ?? null;
  const selectedWfPreviewUrl = selectedWfSpot
    ? buildWayfinderCompanionPublicUrl(appBaseUrl(), "…UID…", selectedWfSpot.slug)
    : `${appBaseUrl()}/wayfinder?from=nfc`;

  const statsPanelClass =
    registerMode === "wayfinder" ? "bg-emerald-50/50 border-emerald-100" : "bg-teal-50/50 border-teal-100";

  return (
    <AdminCard variant="section" className="space-y-7 overflow-hidden relative">
      <div className="space-y-2 relative z-10">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
          <PlusCircle className="w-5 h-5 text-teal-500" />
          NFC 태그 대량 등록
        </h3>
        <p className="text-[11px] font-semibold leading-relaxed text-slate-500 sm:text-[10px] sm:font-bold">
          범용 제품은 UID만 등록하고, 링크유-동행은 별도 제품군으로 등록합니다. 사용 모드는 보호자가 연결할 때
          선택합니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={selectProductMode}
          className={cn(
            "touch-manipulation flex min-h-[48px] min-w-[140px] flex-1 items-center gap-2 rounded-2xl border px-4 py-3 text-left transition-all sm:min-h-0 sm:flex-none sm:py-2.5",
            registerMode === "product"
              ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"
          )}
        >
          <Package className="h-4 w-4 shrink-0 text-teal-600" />
          <span className="min-w-0">
            <span className="block text-xs font-black leading-snug">범용 제품 NFC</span>
            <span className="block text-[10px] font-semibold text-slate-500">모드 미지정 · /t/UID</span>
          </span>
        </button>
        <button
          type="button"
          onClick={selectWayfinderMode}
          className={cn(
            "touch-manipulation flex min-h-[48px] min-w-[140px] flex-1 items-center gap-2 rounded-2xl border px-4 py-3 text-left transition-all sm:min-h-0 sm:flex-none sm:py-2.5",
            registerMode === "wayfinder"
              ? wayfinderTabStyle.active
              : wayfinderTabStyle.inactive
          )}
        >
          <TrainFront className="h-4 w-4 shrink-0 text-emerald-700" />
          <span className="min-w-0">
            <span className="block text-xs font-black leading-snug">링크유-동행</span>
            <span className="block text-[10px] font-semibold text-slate-500">스팟 연결 · /wayfinder</span>
          </span>
        </button>
      </div>

      {registerMode === "product" ? (
        <div className="flex gap-2.5 rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-[11px] font-semibold leading-relaxed text-teal-900/90">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
          <p>
            입고 시 <strong className="font-black">UID와 공통 URL(/t/UID)</strong>만 등록합니다. 펫·메모리·키즈 등
            모드는 판매 후 보호자가 태그를 연결할 때 선택합니다. 출고 구분이 필요하면 아래 배치 메모를 입력하세요.
          </p>
        </div>
      ) : null}

      {registerMode === "wayfinder" ? (
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold leading-relaxed text-emerald-900/85">
            태그 스캔 시 방문자는 <strong className="text-emerald-950">GPS로 가까운 지하철역</strong> 안내(
            <span className="font-mono font-bold">/wayfinder</span>)로 이동합니다. 선택한 스팟은 보조 지점
            안내용 메타입니다.
          </p>

          {wfSpotsError ? (
            <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-bold text-rose-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{wfSpotsError}</span>
            </div>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wide text-emerald-800">
              보조 스팟 연결 (선택)
            </span>
            <select
              value={wayfinderSpotId}
              onChange={(e) => setWayfinderSpotId(e.target.value)}
              disabled={wfSpotsLoading || isPending || Boolean(wfSpotsError)}
              className="min-h-[44px] w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-bold text-slate-900 sm:min-h-10 sm:text-xs"
            >
              <option value="">
                {wfSpotsLoading
                  ? "스팟 목록 불러오는 중…"
                  : wfSpots.length === 0
                    ? "등록된 동행 스팟이 없습니다"
                    : "스팟을 선택하세요"}
              </option>
              {wfSpots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} — {s.slug}
                  {Number(s.is_published) !== 1 ? " (미발행)" : ""}
                </option>
              ))}
            </select>
          </label>
          {!wfSpotsLoading && !wfSpotsError && wfSpots.length === 0 ? (
            <p className="rounded-xl border border-dashed border-emerald-200 bg-white/80 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-slate-600">
              보호자 대시보드 → 링크유-동행에서 스팟을 먼저 등록·발행한 뒤 이 화면에서 선택하세요.
            </p>
          ) : null}

          {selectedWfSpot && selectedWfPreviewUrl ? (
            <div className="flex flex-wrap items-start gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2.5">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">기록·연결 URL</p>
                <p className="break-all font-mono text-[11px] font-bold text-indigo-700">{selectedWfPreviewUrl}</p>
                {Number(selectedWfSpot.is_published) !== 1 ? (
                  <p className="text-[10px] font-bold text-amber-700">
                    미발행 — 방문자 공개 전 NFC 스캔 시 안내가 나오지 않을 수 있습니다.
                  </p>
                ) : null}
              </div>
              <a
                href={selectedWfPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 text-[10px] font-black text-indigo-700 hover:bg-indigo-100"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                미리보기
              </a>
            </div>
          ) : null}
        </div>
      ) : (
        <label className="block space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-600">
            입고 배치 메모 (선택)
          </span>
          <input
            type="text"
            value={batchLabel}
            onChange={(e) => setBatchLabel(e.target.value)}
            placeholder="예: 2026-05-출고-A, 와우샵-100ea"
            disabled={isPending}
            className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 placeholder:font-semibold placeholder:text-slate-400 sm:min-h-10 sm:text-xs"
          />
          <p className="text-[10px] font-semibold text-slate-500">
            배치 ID에만 반영됩니다. 모드(펫/키즈 등)와 무관합니다.
          </p>
        </label>
      )}

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
                    if (registerModeRef.current === "wayfinder") {
                      await handleWayfinderNfcUid(r.uid, false);
                    } else {
                      await handleProductNfcUid(r.uid, false);
                    }
                  } else {
                    setNfcHint(r.error);
                    void recordNfcWebReadAudit({
                      success: false,
                      source: "bulk_register",
                      clientError: r.error,
                    });
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
                    if (registerModeRef.current === "wayfinder") {
                      await handleWayfinderNfcUid(uid, true);
                      return;
                    }
                    await handleProductNfcUid(uid, true);
                  },
                  onError: (error) => {
                    setNfcHint(error);
                    void recordNfcWebReadAudit({
                      success: false,
                      source: "bulk_register",
                      clientError: error,
                    });
                  },
                }).then((res) => {
                  setNfcBusy(false);
                  if (!res.ok) {
                    setNfcHint(res.error);
                    void recordNfcWebReadAudit({
                      success: false,
                      source: "bulk_register",
                      clientError: res.error,
                    });
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
            NDEFReader 미지원 — UID는 직접 입력하거나 Chrome에서 열기
          </p>
        )}
        {nfcHint && (
          <p className="text-[13px] font-semibold text-slate-600 whitespace-pre-wrap leading-relaxed sm:text-[10px] sm:font-bold">
            {nfcHint}
          </p>
        )}
        <textarea
          value={bulkUidText}
          onChange={(e) =>
            registerMode === "wayfinder" ? setWfUids(e.target.value) : setProductUids(e.target.value)
          }
          placeholder="UID (줄 또는 쉼표로 구분)"
          className={cn(
            "min-h-[11rem] w-full resize-none rounded-[23px] border border-slate-200 bg-slate-50 p-5 font-mono text-base text-slate-700 shadow-inner",
            "transition-all focus:outline-none focus:ring-4 sm:h-44 sm:text-sm",
            registerMode === "wayfinder"
              ? "focus:ring-emerald-500/10 focus:border-emerald-500/50"
              : "focus:ring-teal-500/10 focus:border-teal-500/50"
          )}
        />
      </div>

      <div
        className={cn(
          "space-y-2 rounded-xl border p-4 text-[13px] font-bold sm:text-[11px]",
          statsPanelClass
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">유효 UID</span>
          <span className="text-slate-900 tabular-nums">{validUids.length}개</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className={duplicateInInputCount > 0 ? "text-amber-600" : "text-slate-500"}>입력 내 중복</span>
          <span
            className={
              duplicateInInputCount > 0 ? "text-amber-700 tabular-nums" : "text-slate-700 tabular-nums"
            }
          >
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
            <span className="block text-[13px] font-black text-slate-900 sm:text-xs">배치·제품군 메타 갱신</span>
            <span className="block text-[12px] font-semibold leading-snug text-slate-500 sm:text-[10px] sm:font-bold">
              {registerMode === "product"
                ? "기존 태그의 할당 모드를 비우고(범용), 이번 배치 ID로 갱신합니다. 펫 연결은 유지됩니다."
                : "동행 제품군·스팟·배치 ID로 기존 태그 메타를 갱신합니다. 펫 연결은 유지됩니다."}
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
              message.type === "success" ? adminUi.successBadge : adminUi.dangerBadge
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
        disabled={isPending || validUids.length === 0}
        className={cn(
          "min-h-14 w-full touch-manipulation rounded-[24px] px-4 py-4 text-[15px] shadow-xl transition-all group relative overflow-hidden font-black active:scale-[0.98] sm:py-3 sm:text-sm",
          adminUi.darkButton
        )}
      >
        <span className="relative z-10 flex w-full items-center justify-center gap-2 text-center leading-snug break-keep whitespace-normal">
          {isPending ? (
            "처리 중..."
          ) : registerMode === "wayfinder" ? (
            <>
              링크유-동행 태그 인벤토리 등록
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </>
          ) : (
            <>
              범용 제품 태그 등록 ({validUids.length}개)
              <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </span>
      </Button>

      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl pointer-events-none rounded-full" />
    </AdminCard>
  );
}
