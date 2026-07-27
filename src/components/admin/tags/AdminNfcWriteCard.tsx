"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getNfcOriginMismatchMessage, normalizeAppBaseUrl } from "@/lib/nfc-app-origin-guard";
import { normalizeTagUid, isValidTagUidFormat } from "@/lib/tag-uid-format";
import {
  prepareNfcNativeHandoff,
  prepareNfcTagWrite,
  recordNfcWebReadAudit,
  recordNfcWebWriteAudit,
} from "@/app/actions/admin";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertTriangle,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Globe2,
} from "lucide-react";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import { isWebNfcReadSupported, readNfcTagUidOnce } from "@/lib/web-nfc-read-uid";
import { isWebNfcWriteSupported, writeNfcUrlRecord } from "@/lib/web-nfc-write-url";
import type { NdefWriteWayfinderWarning } from "@/lib/nfc-inventory-ndef-url";

const SHOW_NFC_NATIVE_HANDOFF = process.env.NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED === "true";
const NFC_NATIVE_APP_STORE_URL = (process.env.NEXT_PUBLIC_NFC_NATIVE_APP_STORE_URL || "").trim();

type UidCheckState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; url: string; tagId: string; warnings?: NdefWriteWayfinderWarning[] }
  | { status: "err"; message: string }
  | { status: "format" };

function getUnpublishedWayfinderWarning(
  warnings?: NdefWriteWayfinderWarning[]
): NdefWriteWayfinderWarning | undefined {
  return warnings?.find((w) => w.code === "wayfinder_unpublished");
}

function confirmUnpublishedWayfinderWrite(w: NdefWriteWayfinderWarning): boolean {
  const label = (w.title || w.slug).trim();
  return confirm(
    `${w.message}\n\n보조 스팟: ${label}\n기록 URL: /wayfinder?from=nfc&tag=…\n\n미발행 스팟은 지점 안내 카드만 숨겨지며, GPS·근처 역 안내는 이용 가능합니다. 계속할까요?`
  );
}

function WayfinderUnpublishedNotice({ warning }: { warning: NdefWriteWayfinderWarning }) {
  const label = (warning.title || warning.slug).trim();
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-bold text-amber-950"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        스팟 미발행 · <strong>{label}</strong>
      </p>
    </div>
  );
}

type HintState =
  | { type: "idle" }
  | { type: "info" | "success" | "error"; text: string };

function Pills({
  webWrite,
  webRead,
  app,
}: {
  webWrite: boolean;
  webRead: boolean;
  app: boolean;
}) {
  const item = (ok: boolean, label: string) => (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black",
        ok ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 bg-slate-100 text-slate-400"
      )}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <span className="text-[9px]">—</span>}
      {label}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="사용 가능 수단">
      {item(webWrite, "Web 쓰기")}
      {item(webRead, "Web 읽기")}
      {item(app, "앱 쓰기")}
    </div>
  );
}

function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return Promise.reject();
  }
  return navigator.clipboard.writeText(text);
}

export function AdminNfcWriteCard() {
  const [tagId, setTagId] = useState("");
  const [busy, setBusy] = useState(false);
  const [uidCheck, setUidCheck] = useState<UidCheckState>({ status: "idle" });
  const [hint, setHint] = useState<HintState>({ type: "idle" });
  const [copyFlash, setCopyFlash] = useState<"uid" | "url" | null>(null);
  const [nfcWriteSupported, setNfcWriteSupported] = useState<boolean | null>(null);
  const [nfcReadSupported, setNfcReadSupported] = useState<boolean | null>(null);
  const [readBusy, setReadBusy] = useState(false);
  const [nativeBusy, setNativeBusy] = useState(false);
  const [originMismatchNotice, setOriginMismatchNotice] = useState<string | null>(null);

  const appHandoffUsable = SHOW_NFC_NATIVE_HANDOFF;

  useEffect(() => {
    setNfcWriteSupported(isWebNfcWriteSupported());
    setNfcReadSupported(isWebNfcReadSupported());
  }, []);

  useEffect(() => {
    setOriginMismatchNotice(
      getNfcOriginMismatchMessage(process.env.NEXT_PUBLIC_APP_URL, window.location.origin, "advisory")
    );
  }, []);

  const unverifiedTagUrlGuess = useMemo(() => {
    const t = normalizeTagUid(tagId);
    if (!t || !isValidTagUidFormat(t)) return null;
    const base = normalizeAppBaseUrl(
      (process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : ""))
    );
    if (!base) return null;
    return `${base}/t/${encodeURIComponent(t)}`;
  }, [tagId]);

  const displayWriteUrl =
    uidCheck.status === "ok" ? uidCheck.url : unverifiedTagUrlGuess;

  const unpublishedWarning =
    uidCheck.status === "ok" ? getUnpublishedWayfinderWarning(uidCheck.warnings) : undefined;

  const runVerify = useCallback(async (raw: string) => {
    const t = normalizeTagUid(raw);
    if (t !== raw) setTagId(t);
    if (!t) {
      setUidCheck({ status: "idle" });
      return;
    }
    if (!isValidTagUidFormat(t)) {
      setUidCheck({ status: "format" });
      return;
    }
    setUidCheck({ status: "loading" });
    try {
      const prep = await prepareNfcTagWrite(t);
      if (prep.ok) {
        setUidCheck({
          status: "ok",
          url: prep.url,
          tagId: prep.tagId,
          ...(prep.warnings?.length ? { warnings: prep.warnings } : {}),
        });
      } else {
        setUidCheck({ status: "err", message: prep.error });
      }
    } catch (e) {
      setUidCheck({ status: "err", message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const onWrite = useCallback(async () => {
    setHint({ type: "idle" });
    if (!isWebNfcWriteSupported()) {
      setHint({
        type: "error",
        text: "이 브라우저는 Web NFC 쓰기(NDEFReader.write)를 지원하지 않습니다. Android Chrome(HTTPS)에서 열거나 아래 ‘앱에서 쓰기’를 사용하세요.",
      });
      return;
    }
    const trimmed = normalizeTagUid(tagId);
    if (!trimmed) {
      setHint({ type: "error", text: "태그 UID를 입력하거나 NFC로 읽어 주세요." });
      return;
    }
    setBusy(true);
    try {
      const prep = await prepareNfcTagWrite(trimmed);
      if (!prep.ok) {
        setHint({ type: "error", text: prep.error });
        return;
      }
      const unpublished = getUnpublishedWayfinderWarning(prep.warnings);
      if (unpublished && !confirmUnpublishedWayfinderWrite(unpublished)) {
        setHint({ type: "info", text: "미발행 스팟 URL 기록을 취소했습니다. 스팟을 발행한 뒤 다시 시도하세요." });
        setUidCheck({
          status: "ok",
          url: prep.url,
          tagId: prep.tagId,
          ...(prep.warnings?.length ? { warnings: prep.warnings } : {}),
        });
        return;
      }
      try {
        const w = await writeNfcUrlRecord(prep.url);
        if (!w.ok) throw new Error(w.error);
        await recordNfcWebWriteAudit({
          tagId: prep.tagId,
          url: prep.url,
          success: true,
        });
        setHint({
          type: "success",
          text: unpublished
            ? "태그에 URL이 기록되었습니다. 동행 스팟이 아직 미발행이므로 공개 후 스캔을 확인하세요."
            : "태그에 URL이 기록되었습니다. 감사 로그(연결·감사)에도 남습니다.",
        });
        setUidCheck({
          status: "ok",
          url: prep.url,
          tagId: prep.tagId,
          ...(prep.warnings?.length ? { warnings: prep.warnings } : {}),
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        await recordNfcWebWriteAudit({
          tagId: prep.tagId,
          url: prep.url,
          success: false,
          clientError: msg,
        });
        setHint({ type: "error", text: `Web NFC 기록에 실패했습니다: ${msg}\n\n앱에서 기록(핸드오프)이 가능한지 확인하거나, 태그·기기를 다시 대어 보세요.` });
      }
    } finally {
      setBusy(false);
    }
  }, [tagId]);

  const onOpenNativeApp = useCallback(async () => {
    if (!appHandoffUsable) {
      setHint({ type: "error", text: "전용 앱 쓰기(핸드오프)가 이 환경에서 비활성화돼 있어요. 콘솔/배포 환경에서 NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED 와 secrets를 확인하세요." });
      return;
    }
    setHint({ type: "idle" });
    const trimmed = normalizeTagUid(tagId);
    if (!trimmed) {
      setHint({ type: "error", text: "태그 UID를 입력하거나 먼저 ‘NFC로 UID 읽기’로 채우세요." });
      return;
    }
    setNativeBusy(true);
    try {
      const handoff = await prepareNfcNativeHandoff(trimmed);
      if (!handoff.ok) {
        setHint({ type: "error", text: handoff.error });
        return;
      }
      if (typeof window !== "undefined") {
        window.location.href = handoff.appLink;
      }
      setHint({
        type: "info",
        text: "앱으로 이동했습니다. 쓰기 후 감사 로그를 확인하세요.",
      });
    } finally {
      setNativeBusy(false);
    }
  }, [appHandoffUsable, tagId]);

  const flash = (k: "uid" | "url") => {
    setCopyFlash(k);
    setTimeout(() => setCopyFlash(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2.5">
        <Pills
          webWrite={nfcWriteSupported === true}
          webRead={nfcReadSupported === true}
          app={appHandoffUsable}
        />
        {nfcWriteSupported === false ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Web 쓰기 불가
          </span>
        ) : null}
      </div>

      {originMismatchNotice ? (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-bold text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{originMismatchNotice}</span>
        </div>
      ) : null}

      {unpublishedWarning ? <WayfinderUnpublishedNotice warning={unpublishedWarning} /> : null}

      <AdminCard id="nfc-url-write" variant="section" className="space-y-4 scroll-mt-24">
        <h2 className="sr-only">URL 기록</h2>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="nfc-tag-uid" className="text-[10px] font-black uppercase tracking-wide text-slate-500">
              UID
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={readBusy || busy || nfcReadSupported === false}
                onClick={() => {
                  setHint({ type: "idle" });
                  setReadBusy(true);
                  void readNfcTagUidOnce().then((r) => {
                    setReadBusy(false);
                    if (r.ok) {
                      setTagId(r.uid);
                      setHint({ type: "info", text: `읽음: ${r.uid}` });
                      void recordNfcWebReadAudit({ success: true, source: "write_card", tagId: r.uid });
                      void runVerify(r.uid);
                    } else {
                      setHint({ type: "error", text: r.error });
                      void recordNfcWebReadAudit({ success: false, source: "write_card", clientError: r.error });
                    }
                  });
                }}
                className="h-8 rounded-xl px-2.5 text-[10px] font-black"
              >
                {readBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Smartphone className="h-3.5 w-3.5" />}
                <span className="ml-1">NFC 읽기</span>
              </Button>
              <button
                type="button"
                onClick={async () => {
                  if (!tagId) return;
                  try {
                    await copyToClipboard(normalizeTagUid(tagId));
                    flash("uid");
                  } catch {
                    setHint({ type: "error", text: "복사 실패" });
                  }
                }}
                disabled={!tagId.trim()}
                className="text-[10px] font-black text-teal-700 hover:underline disabled:opacity-30"
              >
                {copyFlash === "uid" ? "복사됨" : "복사"}
              </button>
            </div>
          </div>
          <Input
            id="nfc-tag-uid"
            value={tagId}
            onChange={(e) => setTagId(e.target.value)}
            onBlur={() => {
              void runVerify(tagId);
            }}
            placeholder="태그 UID"
            disabled={busy}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            className={cn(
              adminUi.input,
              "min-h-11 rounded-2xl font-mono text-sm shadow-inner focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
            )}
            aria-describedby="uid-status"
          />
          <div id="uid-status" className="min-h-[1.1rem] text-[11px] font-bold" aria-live="polite">
            {uidCheck.status === "loading" && <span className="text-slate-500">확인 중…</span>}
            {uidCheck.status === "format" && <span className="text-amber-700">UID 형식 오류</span>}
            {uidCheck.status === "ok" && (
              <span className={unpublishedWarning ? "text-amber-800" : "text-teal-700"}>
                {unpublishedWarning ? (
                  <>
                    <AlertTriangle className="mb-0.5 mr-1 inline h-3.5 w-3.5" />
                    확인됨 · 스팟 미발행
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mb-0.5 mr-1 inline h-3.5 w-3.5" />
                    인벤토리 확인
                  </>
                )}
              </span>
            )}
            {uidCheck.status === "err" && <span className="text-rose-600">{uidCheck.message}</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">URL</span>
            <div className="flex items-center gap-2">
              {displayWriteUrl ? (
                <a
                  href={displayWriteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 hover:underline"
                >
                  열기
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              {(uidCheck.status === "ok" || unverifiedTagUrlGuess) && (
                <button
                  type="button"
                  className="text-[10px] font-black text-teal-700 hover:underline"
                  onClick={async () => {
                    const t = uidCheck.status === "ok" ? uidCheck.url : unverifiedTagUrlGuess;
                    if (!t) return;
                    try {
                      await copyToClipboard(t);
                      flash("url");
                    } catch {
                      setHint({ type: "error", text: "URL 복사 실패" });
                    }
                  }}
                >
                  {copyFlash === "url" ? "복사됨" : "복사"}
                </button>
              )}
            </div>
          </div>
          <p className="break-all font-mono text-xs font-bold text-slate-800">
            {displayWriteUrl || "— UID 확인 후 표시"}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            onClick={() => void onWrite()}
            disabled={busy || nfcWriteSupported === false}
            className={cn("min-h-12 w-full rounded-2xl text-sm font-black", adminUi.darkButton)}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                기록 중…
              </>
            ) : (
              <>
                <Globe2 className="mr-2 inline h-4 w-4" />
                Web NFC 기록
              </>
            )}
          </Button>
          <Button
            type="button"
            variant={appHandoffUsable ? "outline" : "secondary"}
            onClick={() => void onOpenNativeApp()}
            disabled={nativeBusy || busy || !appHandoffUsable}
            className="min-h-12 w-full rounded-2xl border-slate-200 text-sm font-black"
          >
            {nativeBusy ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                앱 연결…
              </>
            ) : (
              <>
                <Smartphone className="mr-2 inline h-4 w-4" />
                {appHandoffUsable ? "앱에서 기록" : "앱 비활성"}
              </>
            )}
          </Button>
        </div>

        {NFC_NATIVE_APP_STORE_URL && appHandoffUsable ? (
          <a
            href={NFC_NATIVE_APP_STORE_URL}
            className="inline-flex text-[11px] font-black text-indigo-700 hover:underline"
          >
            앱 설치
          </a>
        ) : null}

        {hint.type !== "idle" && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "rounded-2xl border px-3.5 py-2.5 text-[12px] font-bold",
              hint.type === "success" && "border-teal-200 bg-teal-50 text-teal-900",
              hint.type === "error" && "border-rose-200 bg-rose-50 text-rose-900",
              hint.type === "info" && "border-slate-200 bg-slate-50 text-slate-800"
            )}
          >
            {hint.text}
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-[10px] font-black text-teal-700">
          <Link href="/admin/nfc-tags/history?action=nfc_web_write&days=7&success=all" className="hover:underline">
            Web 쓰기 로그
          </Link>
          <Link href="/admin/nfc-tags/history?action=nfc_native_write&days=7&success=all" className="hover:underline">
            앱 쓰기 로그
          </Link>
        </div>
      </AdminCard>
    </div>
  );
}
