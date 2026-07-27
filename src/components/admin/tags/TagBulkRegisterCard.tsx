"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  listWayfinderSpotsForAdminTagLink,
  recordNfcWebReadAudit,
  registerBulkTags,
  type RegisterBulkTagsOptions,
} from "@/app/actions/admin";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Smartphone,
  Loader2,
  TrainFront,
  ExternalLink,
  Package,
  Bluetooth,
  Radio,
  ListPlus,
} from "lucide-react";
import type { AdminWayfinderSpotPickRow } from "@/types/admin-tags";
import { computeNdefWriteUrlForInventoryTag } from "@/lib/nfc-inventory-ndef-url";
import { buildWayfinderCompanionPublicUrl } from "@/lib/wayfinder/companion-url";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { parseBleBulkPairLines, zipUidsWithBleMacLines } from "@/lib/ble-bulk-register-parse";
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
  const [productBleMacs, setProductBleMacs] = useState("");
  /** 범용 제품: BLE MAC을 같은 출고에 포함 (UID,MAC 한 줄 또는 보조 MAC 목록) */
  const [includeBleOut, setIncludeBleOut] = useState(false);
  const [showMacAuxLines, setShowMacAuxLines] = useState(false);
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
  const productPairsParsed = parseBleBulkPairLines(productUids);
  const productPairUids = productPairsParsed.pairs.map((p) => p.uid);
  const productMacFromPairs = productPairsParsed.pairs.filter((p) => p.bleMac).length;
  const productMissingMac = productPairsParsed.pairs.filter((p) => !p.bleMac).length;

  const uidTokens =
    registerMode === "wayfinder"
      ? bulkUidText.split(/[\n,]+/).map(normalizeTagUid).filter((u) => u.length > 0)
      : productPairUids;
  const uniqueTokens =
    registerMode === "wayfinder" ? Array.from(new Set(uidTokens)) : productPairUids;
  const validUids =
    registerMode === "wayfinder" ? uniqueTokens.filter(isValidTagUidFormat) : productPairUids;
  const duplicateInInputCount =
    registerMode === "wayfinder"
      ? uidTokens.length - uniqueTokens.length
      : productPairsParsed.duplicateUidInInput;
  const invalidCount =
    registerMode === "wayfinder"
      ? uniqueTokens.length - validUids.length
      : productPairsParsed.invalidUidCount + productPairsParsed.invalidMacCount;

  const appendProductUid = (uid: string) => {
    setProductUids((prev) => {
      const parsed = parseBleBulkPairLines(prev);
      if (parsed.pairs.some((p) => p.uid === uid)) return prev;
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
          setMessage({
            type: "success",
            text: `동행 등록 ${result.registeredCount}/${result.requestedCount} · 배치 ${result.batchId}${
              result.duplicateExisting > 0 ? ` · 기존 ${result.duplicateExisting}` : ""
            }${
              existingUidBehavior === "update_meta" && result.updatedExistingMeta > 0
                ? ` · 메타 ${result.updatedExistingMeta}`
                : ""
            }`,
          });
          setNfcHint(null);
          setWfUids("");
          router.refresh();
        } catch {
          setMessage({ type: "error", text: "등록 실패" });
        }
      });
      return;
    }

    if (!productUids.trim()) return;
    const parsed = parseBleBulkPairLines(productUids);
    if (parsed.pairs.length === 0) {
      setMessage({
        type: "error",
        text:
          parsed.invalidMacCount > 0
            ? `MAC 오류 ${parsed.invalidMacCount}줄 — UID,AA:BB:… 형식`
            : "유효한 UID 없음",
      });
      return;
    }

    const uidList = parsed.pairs.map((p) => p.uid);
    const bleMacByUid: Record<string, string> = {};
    for (const pair of parsed.pairs) {
      if (pair.bleMac) bleMacByUid[pair.uid] = pair.bleMac;
    }
    if (showMacAuxLines && productBleMacs.trim()) {
      const zipped = zipUidsWithBleMacLines(uidList, productBleMacs);
      for (const [uid, mac] of zipped.entries()) {
        if (mac && !bleMacByUid[uid]) bleMacByUid[uid] = mac;
      }
    }

    if (includeBleOut) {
      const missing = uidList.filter((uid) => !bleMacByUid[uid]).length;
      if (missing > 0) {
        setMessage({
          type: "error",
          text: `BLE 출고 — MAC 없는 줄 ${missing}개`,
        });
        return;
      }
    }

    startTransition(async () => {
      try {
        const result = await registerBulkTags(uidList, {
          assignedSubjectKind: null,
          batchLabel: batchLabel.trim() || null,
          existingUidBehavior,
          ...(Object.keys(bleMacByUid).length > 0 ? { bleMacByUid } : {}),
        });
        const macRegistered = Object.keys(bleMacByUid).length;
        setMessage({
          type: "success",
          text: `등록 ${result.registeredCount}/${result.requestedCount} · 배치 ${result.batchId}${
            result.duplicateExisting > 0 ? ` · 기존 ${result.duplicateExisting}` : ""
          }${macRegistered > 0 ? ` · MAC ${macRegistered}` : ""}${
            existingUidBehavior === "update_meta" && result.updatedExistingMeta > 0
              ? ` · 메타 ${result.updatedExistingMeta}`
              : ""
          }`,
        });
        setNfcHint(null);
        setProductUids("");
        setProductBleMacs("");
        router.refresh();
      } catch {
        setMessage({ type: "error", text: "등록 실패" });
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
      const warn =
        spot && Number(spot.is_published) !== 1 ? " · 스팟 미발행" : !spot ? " · 스팟 없음" : "";
      setNfcHint(`${continuous ? "연속" : "1회"} + 기록 ${uid}${warn}`);
    } else {
      setNfcHint(`추가 ${uid} · 기록 실패 — URL 기록 메뉴`);
    }
    void recordNfcWebReadAudit({ success: true, source: "bulk_register", tagId: uid });
  };

  const handleProductNfcUid = async (uid: string, continuous: boolean) => {
    appendProductUid(uid);
    const writeResult = await tryWriteUrlToChip(uid);
    if (writeResult.ok) {
      setNfcHint(`${continuous ? "연속" : "1회"} + 기록 ${uid}`);
    } else {
      setNfcHint(`추가 ${uid} · 기록 실패 — URL 기록 메뉴`);
    }
    void recordNfcWebReadAudit({ success: true, source: "bulk_register", tagId: uid });
  };

  const selectedWfSpot = wfSpots.find((s) => s.id === wayfinderSpotId.trim()) ?? null;
  const selectedWfPreviewUrl = selectedWfSpot
    ? buildWayfinderCompanionPublicUrl(appBaseUrl(), "…UID…", selectedWfSpot.slug)
    : `${appBaseUrl()}/wayfinder?from=nfc`;

  const previewItems =
    registerMode === "product"
      ? productPairsParsed.pairs.slice(0, 8).map((p) => ({
          key: p.uid,
          label: p.bleMac ? `${p.uid} · ${p.bleMac.slice(0, 8)}…` : p.uid,
          hasMac: Boolean(p.bleMac),
        }))
      : validUids.slice(0, 8).map((uid) => ({ key: uid, label: uid, hasMac: false }));
  const previewMore = Math.max(0, validUids.length - previewItems.length);
  const canRegister = !isPending && validUids.length > 0;
  const nfcBlocked = nfcReadSupported === false || isIosSafari;

  const runNfcOnce = () => {
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
  };

  const toggleNfcContinuous = () => {
    if (nfcContinuous) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      setNfcContinuous(false);
      setNfcHint("스캔 중지");
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
      setNfcHint("연속 스캔 중 — 태그에 대세요");
    });
  };

  return (
    <AdminCard variant="section" className="relative space-y-5 overflow-hidden pb-28 sm:pb-6">
      {/* 1. 모드 */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={selectProductMode}
          className={cn(
            "touch-manipulation flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition active:scale-[0.98]",
            registerMode === "product"
              ? "border-teal-500 bg-gradient-to-br from-teal-50 to-white shadow-sm ring-2 ring-teal-500/20"
              : "border-slate-200 bg-white hover:border-teal-200"
          )}
        >
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl",
              registerMode === "product" ? "bg-teal-600 text-white" : "bg-slate-100 text-teal-700"
            )}
          >
            <Package className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-black text-slate-900">범용</span>
          <span className="text-[10px] font-bold leading-snug text-slate-500">제품 출고 · UID(+MAC)</span>
        </button>
        <button
          type="button"
          onClick={selectWayfinderMode}
          className={cn(
            "touch-manipulation flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition active:scale-[0.98]",
            registerMode === "wayfinder"
              ? "border-emerald-600 bg-gradient-to-br from-emerald-50 to-white shadow-sm ring-2 ring-emerald-500/20"
              : "border-slate-200 bg-white hover:border-emerald-200"
          )}
        >
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl",
              registerMode === "wayfinder" ? "bg-emerald-600 text-white" : "bg-slate-100 text-emerald-700"
            )}
          >
            <TrainFront className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-black text-slate-900">동행</span>
          <span className="text-[10px] font-bold leading-snug text-slate-500">스팟 연결 출고</span>
        </button>
      </div>

      {/* 2. 모드별 설정 */}
      {registerMode === "wayfinder" ? (
        <div className="space-y-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3.5">
          {wfSpotsError ? (
            <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{wfSpotsError}</span>
            </div>
          ) : null}
          <label className="block space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-emerald-800">스팟</span>
            <select
              value={wayfinderSpotId}
              onChange={(e) => setWayfinderSpotId(e.target.value)}
              disabled={wfSpotsLoading || isPending || Boolean(wfSpotsError)}
              className="min-h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-bold text-slate-900"
            >
              <option value="">
                {wfSpotsLoading ? "불러오는 중…" : wfSpots.length === 0 ? "스팟 없음" : "선택 안 함"}
              </option>
              {wfSpots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                  {Number(s.is_published) !== 1 ? " · 미발행" : ""}
                </option>
              ))}
            </select>
          </label>
          {selectedWfSpot && selectedWfPreviewUrl ? (
            <a
              href={selectedWfPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-black text-indigo-700 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              미리보기
            </a>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-stretch gap-2">
          <label className="min-w-0 flex-1 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">배치</span>
            <input
              type="text"
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
              placeholder="선택"
              disabled={isPending}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 placeholder:text-slate-400"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setIncludeBleOut((v) => {
                if (v) setShowMacAuxLines(false);
                return !v;
              });
            }}
            disabled={isPending}
            className={cn(
              "mt-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 touch-manipulation transition",
              includeBleOut
                ? "border-indigo-400 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/15"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
            )}
          >
            <Bluetooth className="h-4 w-4 text-indigo-600" aria-hidden />
            <span className="text-xs font-black">BLE</span>
          </button>
        </div>
      )}

      {registerMode === "product" && includeBleOut ? (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setShowMacAuxLines((v) => !v)}
            className="text-[11px] font-black text-indigo-800 hover:underline"
          >
            {showMacAuxLines ? "MAC 보조 닫기" : "MAC 보조 목록"}
          </button>
          {showMacAuxLines ? (
            <textarea
              value={productBleMacs}
              onChange={(e) => setProductBleMacs(e.target.value)}
              placeholder={"AA:BB:CC:DD:EE:FF"}
              disabled={isPending}
              className="mt-2 min-h-[4.5rem] w-full resize-none rounded-xl border border-indigo-100 bg-white p-3 font-mono text-xs font-bold text-slate-800"
            />
          ) : (
            <p className="mt-1 text-[10px] font-bold text-indigo-700/80">한 줄: UID,MAC</p>
          )}
        </div>
      ) : null}

      {/* 3. 입력 — NFC 우선 + 붙여넣기 */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/90 to-white p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-slate-500">
            <Radio className="h-3.5 w-3.5 text-teal-600" aria-hidden />
            입력
          </p>
          {nfcContinuous ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              스캔 중
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={nfcBusy || nfcContinuous || nfcBlocked || isPending}
            onClick={runNfcOnce}
            className={cn(
              "min-h-12 rounded-2xl text-xs font-black touch-manipulation",
              !nfcBlocked && "border-teal-200 bg-teal-50/50 text-teal-950 hover:bg-teal-50"
            )}
          >
            {nfcBusy && !nfcContinuous ? (
              <>
                <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" />
                대기…
              </>
            ) : (
              <>
                <Smartphone className="mr-1.5 inline h-4 w-4" />
                NFC 1회
              </>
            )}
          </Button>
          <Button
            type="button"
            variant={nfcContinuous ? "destructive" : "outline"}
            disabled={nfcBlocked || isPending}
            onClick={toggleNfcContinuous}
            className="min-h-12 rounded-2xl border-slate-200 text-xs font-black touch-manipulation"
          >
            {nfcContinuous ? "중지" : "연속 스캔"}
          </Button>
        </div>

        {nfcBlocked ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900">
            {isIosSafari ? "iOS/Safari — UID 직접 입력" : "NFC 미지원 — UID 직접 입력"}
          </p>
        ) : null}

        {nfcHint ? (
          <p className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700">
            {nfcHint}
          </p>
        ) : null}

        <textarea
          value={bulkUidText}
          onChange={(e) =>
            registerMode === "wayfinder" ? setWfUids(e.target.value) : setProductUids(e.target.value)
          }
          placeholder={
            registerMode === "wayfinder"
              ? "UID 붙여넣기 (줄바꿈)"
              : includeBleOut
                ? "UID,AA:BB:CC:DD:EE:FF"
                : "UID 또는 UID,MAC"
          }
          className={cn(
            "min-h-[9rem] w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm text-slate-700",
            "focus:outline-none focus:ring-4 sm:min-h-[8rem]",
            registerMode === "wayfinder"
              ? "focus:border-emerald-400 focus:ring-emerald-500/10"
              : includeBleOut
                ? "focus:border-indigo-400 focus:ring-indigo-500/10"
                : "focus:border-teal-400 focus:ring-teal-500/10"
          )}
        />

        {/* 실시간 미리보기 */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black tabular-nums",
              validUids.length > 0
                ? registerMode === "wayfinder"
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-teal-100 text-teal-900"
                : "bg-slate-100 text-slate-500"
            )}
          >
            {validUids.length}개
          </span>
          {registerMode === "product" && productMacFromPairs > 0 ? (
            <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-black tabular-nums text-indigo-900">
              MAC {productMacFromPairs}
            </span>
          ) : null}
          {includeBleOut && productMissingMac > 0 ? (
            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black tabular-nums text-amber-900">
              MAC 누락 {productMissingMac}
            </span>
          ) : null}
          {duplicateInInputCount > 0 ? (
            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black tabular-nums text-amber-900">
              중복 {duplicateInInputCount}
            </span>
          ) : null}
          {invalidCount > 0 ? (
            <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-black tabular-nums text-rose-900">
              오류 {invalidCount}
            </span>
          ) : null}
        </div>

        {previewItems.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {previewItems.map((item) => (
              <span
                key={item.key}
                className={cn(
                  "max-w-full truncate rounded-lg border px-2 py-1 font-mono text-[10px] font-bold",
                  item.hasMac
                    ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                )}
                title={item.key}
              >
                {item.label}
              </span>
            ))}
            {previewMore > 0 ? (
              <span className="rounded-lg border border-dashed border-slate-200 px-2 py-1 text-[10px] font-black text-slate-500">
                +{previewMore}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <ListPlus className="h-3.5 w-3.5" aria-hidden />
            NFC 스캔 또는 UID 붙여넣기
          </p>
        )}
      </div>

      {/* 4. 옵션 */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setExistingUidBehavior("skip")}
          className={cn(
            "min-h-9 rounded-xl border px-3 text-[11px] font-black touch-manipulation",
            existingUidBehavior === "skip"
              ? "border-slate-800 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600"
          )}
        >
          기존 → 건너뛰기
        </button>
        <button
          type="button"
          onClick={() => setExistingUidBehavior("update_meta")}
          className={cn(
            "min-h-9 rounded-xl border px-3 text-[11px] font-black touch-manipulation",
            existingUidBehavior === "update_meta"
              ? "border-slate-800 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600"
          )}
        >
          기존 → 메타 갱신
        </button>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "overflow-hidden rounded-2xl border p-3 text-xs font-bold",
              message.type === "success" ? adminUi.successBadge : adminUi.dangerBadge
            )}
          >
            <div className="flex items-start gap-2">
              {message.type === "success" ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span className="leading-relaxed">{message.text}</span>
            </div>
            {message.type === "success" ? (
              <div className="mt-2.5 flex flex-wrap gap-2 pl-6">
                <Link
                  href="/admin/nfc-tags/inventory"
                  className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-teal-800 hover:bg-teal-50"
                >
                  인벤토리
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
                <Link
                  href="/admin/nfc-tags/write-url"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50"
                >
                  URL 기록
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. CTA — 모바일 sticky */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="mx-auto max-w-3xl sm:max-w-none">
          <Button
            type="button"
            onClick={handleRegister}
            disabled={!canRegister}
            className={cn(
              "min-h-12 w-full touch-manipulation rounded-2xl text-sm font-black active:scale-[0.98]",
              adminUi.darkButton
            )}
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                처리 중…
              </span>
            ) : registerMode === "wayfinder" ? (
              <span className="inline-flex items-center gap-2">
                동행 등록 {validUids.length || ""}
                <ArrowUpRight className="h-4 w-4 opacity-60" />
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                등록 {validUids.length}
                {includeBleOut || productMacFromPairs > 0 ? ` · MAC ${productMacFromPairs}` : ""}
                <ArrowUpRight className="h-4 w-4 opacity-60" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </AdminCard>
  );
}
