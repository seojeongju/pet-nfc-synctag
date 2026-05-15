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
  Copy,
  ExternalLink,
  Globe2,
  Info,
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
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-[12px] font-bold leading-relaxed sm:text-xs",
        "border-amber-200 bg-amber-50 text-amber-950"
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="font-black">동행 스팟 미발행</p>
        <p>{warning.message}</p>
        <p className="text-[11px]">
          스팟: <strong>{label}</strong>
          {" · "}
          <Link
            href={`/wayfinder?spot=${encodeURIComponent(warning.slug)}&from=nfc`}
            className="font-black text-amber-900 underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            /wayfinder?spot={warning.slug}
          </Link>
        </p>
        <p className="text-[10px] font-bold text-amber-800">
          Web NFC 기록 시 확인 창이 뜹니다. 앱 핸드오프는 발행된 스팟만 지원합니다.
        </p>
      </div>
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
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black",
        ok ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 bg-slate-100 text-slate-500"
      )}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[9px]">—</span>}
      {label}
    </span>
  );
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="list"
      aria-label="이 기기·환경에서 사용할 수 있는 기록 수단"
    >
      {item(webWrite, "Web NFC 쓰기")}
      {item(webRead, "Web NFC 읽기")}
      {item(app, "앱(딥링크) 쓰기")}
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
        text: "Link-U 앱으로 이동했어요. 앱에서 쓰기를 완료한 뒤, 연결·감사 이력(nfc_web_write / nfc_native_write)을 확인하세요.",
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 sm:px-5">
        <Pills
          webWrite={nfcWriteSupported === true}
          webRead={nfcReadSupported === true}
          app={appHandoffUsable}
        />
        <p className="mt-2 text-[11px] font-bold leading-relaxed text-slate-500">
          <strong className="font-black text-slate-700">가능</strong>으로 표시된 수단이 최소 1개면 현장에서 기록할 수 있어요. 모두
          <strong> 불가</strong>에 가깝다면 URL은 수동(별도 NDEF 앱)으로 넣는 편이 안전합니다.
        </p>
      </div>

      {nfcWriteSupported === false && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] font-bold leading-snug sm:text-xs",
            "border-amber-200 bg-amber-50 text-amber-950"
          )}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p className="font-black">Web NFC 쓰기(NDEFReader.write)를 쓸 수 없습니다</p>
            <p>
              {appHandoffUsable
                ? "아래「앱에서 쓰기」를 쓰거나, Android + Chrome(HTTPS)으로 이 페이지를 연 뒤 다시 시도하세요."
                : "Web NFC 쓰기는 Android + Chrome(HTTPS)에서만 지원됩니다. iOS·Safari 또는 데스크톱에서는 ‘앱에서 쓰기’(설정돼 있을 때)를 사용하세요."}
            </p>
          </div>
        </div>
      )}

      {nfcReadSupported === false && nfcWriteSupported !== false && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] font-bold leading-snug sm:text-xs",
            "border-slate-200 bg-white text-slate-700"
          )}
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <p>Web NFC <strong>읽기(NDEFReader)만</strong> 막힌 상태예요. UID는 직접 입력하시면 Web 쓰기/앱 쓰기는 정상으로 진행될 수 있어요.</p>
        </div>
      )}

      {originMismatchNotice ? (
        <div
          className={cn(
            "flex items-start gap-3 rounded-2xl border px-4 py-3 text-[12px] font-bold leading-relaxed sm:text-xs",
            "border-amber-200 bg-amber-50 text-amber-950"
          )}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{originMismatchNotice}</span>
        </div>
      ) : null}

      {unpublishedWarning ? (
        <WayfinderUnpublishedNotice warning={unpublishedWarning} />
      ) : null}

      <AdminCard id="nfc-url-write" variant="section" className="space-y-5 scroll-mt-24">
        <h2 className="sr-only">URL 기록(웹 + 앱)</h2>

        <div className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <Label
              htmlFor="nfc-tag-uid"
              className="text-[11px] font-black uppercase tracking-widest text-slate-500 sm:text-[10px]"
            >
              ① 태그 UID
            </Label>
            <button
              type="button"
              onClick={async () => {
                if (!tagId) return;
                try {
                  await copyToClipboard(normalizeTagUid(tagId));
                  flash("uid");
                } catch {
                  setHint({ type: "error", text: "클립보드에 복사할 수 없습니다(HTTPS 권한·브라우저 확인)." });
                }
              }}
              disabled={!tagId.trim()}
              className="text-[10px] font-black text-teal-700 transition hover:underline disabled:opacity-30"
            >
              {copyFlash === "uid" ? "UID 복사됨" : "UID 복사"}
            </button>
          </div>
          <Input
            id="nfc-tag-uid"
            value={tagId}
            onChange={(e) => setTagId(e.target.value)}
            onBlur={() => {
              void runVerify(tagId);
            }}
            placeholder="예: 04:AB:12… (콜론) 또는 영숫자"
            disabled={busy}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            className={cn(
              adminUi.input,
              "min-h-[48px] rounded-2xl font-mono text-base shadow-inner focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 sm:h-12 sm:text-sm"
            )}
            aria-describedby="uid-status"
          />
          <div id="uid-status" className="min-h-[1.25rem] text-[11px] font-bold" aria-live="polite">
            {uidCheck.status === "loading" && <span className="text-slate-500">인벤토리 확인 중…</span>}
            {uidCheck.status === "format" && <span className="text-amber-700">UID 형식이 일반적이지 않아요(콜론 HEX 또는 8~32자).</span>}
            {uidCheck.status === "ok" && (
              <span className={unpublishedWarning ? "text-amber-800" : "text-teal-700"}>
                {unpublishedWarning ? (
                  <AlertTriangle className="mb-0.5 mr-1 inline h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="mb-0.5 mr-1 inline h-3.5 w-3.5" />
                )}
                {unpublishedWarning
                  ? "인벤토리 확인됨 · 동행 스팟 미발행(기록 전 경고·확인)"
                  : "인벤토리에 있음. 아래 URL이 태그에 써집니다."}
              </span>
            )}
            {uidCheck.status === "err" && <span className="text-rose-600">확인 실패: {uidCheck.message}</span>}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">② 기록될 URL (미리보기)</h3>
            {displayWriteUrl ? (
              <a
                href={displayWriteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 hover:underline"
              >
                새 탭에서 열기
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
          <p className="break-all font-mono text-sm font-bold text-slate-800 sm:text-xs">
            {displayWriteUrl ||
              "— UID를 입력·확인하면 서버가 인벤토리 기준으로 기록 URL을 돌려줍니다(일반 태그 /t/UID, 링크유-동행 /wayfinder?from=nfc&tag=UID)."}
          </p>
          {(uidCheck.status === "ok" || unverifiedTagUrlGuess) && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 touch-manipulation rounded-xl text-[10px] font-black"
                onClick={async () => {
                  const t = uidCheck.status === "ok" ? uidCheck.url : unverifiedTagUrlGuess;
                  if (!t) return;
                  try {
                    await copyToClipboard(t);
                    flash("url");
                  } catch {
                    setHint({ type: "error", text: "URL을 클립보드에 복지 못했습니다." });
                  }
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                {copyFlash === "url" ? "URL 복사됨" : "URL 복사"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-indigo-100/80 bg-gradient-to-b from-indigo-50/40 to-white p-4">
            <div className="flex items-center gap-2 text-indigo-900">
              <Globe2 className="h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="text-xs font-black">Chrome (Web NFC)</p>
                <p className="text-[10px] font-bold text-slate-500">태그를 휴대폰에 갖다 대면 NDEF 쓰기</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-1">
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
                      setHint({ type: "info", text: `UID: ${r.uid} — [기록]으로 넘기기 전, 필요하면 셀에 수정하세요.` });
                      void recordNfcWebReadAudit({ success: true, source: "write_card", tagId: r.uid });
                      void runVerify(r.uid);
                    } else {
                      setHint({ type: "error", text: r.error });
                      void recordNfcWebReadAudit({ success: false, source: "write_card", clientError: r.error });
                    }
                  });
                }}
                className="min-h-[50px] w-full rounded-2xl border-slate-200 text-[13px] font-black touch-manipulation"
              >
                {readBusy ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    읽는 중…
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 inline h-4 w-4" />
                    NFC로 UID 읽기
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => void onWrite()}
                disabled={busy || nfcWriteSupported === false}
                className={cn(
                  "min-h-[52px] w-full rounded-2xl text-[14px] font-black touch-manipulation",
                  adminUi.darkButton
                )}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Web NFC 쓰기 중…
                  </>
                ) : (
                  "태그에 URL 기록 (Web NFC)"
                )}
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "space-y-3 rounded-2xl border p-4",
              appHandoffUsable
                ? "border-teal-200/80 bg-gradient-to-b from-teal-50/50 to-white"
                : "border-slate-200 bg-slate-100/30 opacity-80"
            )}
          >
            <div className="flex items-center gap-2 text-slate-900">
              <Smartphone className="h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="text-xs font-black">Link-U 앱</p>
                <p className="text-[10px] font-bold text-slate-500">딥링크로 쓰기(현장·대량 권장)</p>
              </div>
            </div>
            <Button
              type="button"
              variant={appHandoffUsable ? "outline" : "secondary"}
              onClick={() => void onOpenNativeApp()}
              disabled={nativeBusy || busy}
              className="min-h-[50px] w-full rounded-2xl border-slate-200 text-[13px] font-black touch-manipulation"
            >
              {nativeBusy ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  앱 연결 중…
                </>
              ) : appHandoffUsable ? (
                "앱에서 쓰기 열기"
              ) : (
                "앱 쓰기 (비활성)"
              )}
            </Button>
            {NFC_NATIVE_APP_STORE_URL ? (
              <a
                href={NFC_NATIVE_APP_STORE_URL}
                className="inline-flex text-[11px] font-black text-indigo-700 underline underline-offset-2"
              >
                Play 스토어(또는 배포)에서 앱 설치
              </a>
            ) : null}
            {!appHandoffUsable ? (
              <p className="text-[10px] font-bold leading-relaxed text-slate-500">
                Cloudflare(또는 서버)에 링크유 앱용 핸드오프 시크릿·플래그를 켜면 이 버튼이 활성화돼요. 웹 전용이면 Web NFC(Chrome)만 쓰면 됩니다.
              </p>
            ) : null}
          </div>
        </div>

        {hint.type !== "idle" && (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "whitespace-pre-wrap rounded-2xl border px-4 py-3 text-[13px] font-bold sm:text-xs",
              hint.type === "success" && "border-teal-200 bg-teal-50 text-teal-900",
              hint.type === "error" && "border-rose-200 bg-rose-50 text-rose-900",
              hint.type === "info" && "border-slate-200 bg-white text-slate-800"
            )}
          >
            {hint.text}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[10px] font-black text-slate-500">
          <span>이력·확인</span>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/nfc-tags/history?action=nfc_web_write&days=7&success=all"
              className="text-teal-700 hover:underline"
            >
              Web 쓰기(nfc_web_write) 로그
            </Link>
            <Link
              href="/admin/nfc-tags/history?action=nfc_native_write&days=7&success=all"
              className="text-teal-700 hover:underline"
            >
              앱(nfc_native_write) 로그
            </Link>
            <span className="text-slate-400" title="저장소 docs/">
              docs/NFC_BLE_WEB_WRITING.md
            </span>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
