"use client";

import { useCallback, useEffect, useState } from "react";
import { getNfcOriginMismatchMessage } from "@/lib/nfc-app-origin-guard";
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
import { Loader2, AlertTriangle, Smartphone } from "lucide-react";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import { isWebNfcReadSupported, readNfcTagUidOnce } from "@/lib/web-nfc-read-uid";

type NDEFWriterCtor = new () => {
  write(message: { records: Array<{ recordType: string; data: string }> }): Promise<void>;
};

function getNdefWriterClass(): NDEFWriterCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { NDEFWriter?: NDEFWriterCtor };
  return w.NDEFWriter ?? null;
}

const SHOW_NFC_NATIVE_HANDOFF = process.env.NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED === "true";

export function AdminNfcWriteCard() {
  const [tagId, setTagId] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [nfcReadSupported, setNfcReadSupported] = useState<boolean | null>(null);
  const [readBusy, setReadBusy] = useState(false);
  const [nativeBusy, setNativeBusy] = useState(false);
  const [originMismatchNotice, setOriginMismatchNotice] = useState<string | null>(null);

  useEffect(() => {
    setNfcSupported(!!getNdefWriterClass());
    setNfcReadSupported(isWebNfcReadSupported());
  }, []);

  useEffect(() => {
    setOriginMismatchNotice(
      getNfcOriginMismatchMessage(process.env.NEXT_PUBLIC_APP_URL, window.location.origin, "advisory")
    );
  }, []);

  const onWrite = useCallback(async () => {
    setHint(null);
    const Writer = getNdefWriterClass();
    if (!Writer) {
      setHint("NDEFWriter 미지원 — Chrome(HTTPS) 또는 외부 기록. 상단 도움말·docs/NFC_BLE_WEB_WRITING.md");
      return;
    }
    const trimmed = tagId.trim();
    if (!trimmed) {
      setHint("태그 UID를 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const prep = await prepareNfcTagWrite(trimmed);
      if (!prep.ok) {
        setHint(prep.error);
        return;
      }
      try {
        const writer = new Writer();
        await writer.write({
          records: [{ recordType: "url", data: prep.url }],
        });
        await recordNfcWebWriteAudit({
          tagId: prep.tagId,
          url: prep.url,
          success: true,
        });
        setHint("기록이 완료되었습니다. 감사 로그에도 저장했습니다.");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        await recordNfcWebWriteAudit({
          tagId: prep.tagId,
          url: prep.url,
          success: false,
          clientError: msg,
        });
        setHint(`기록에 실패했습니다: ${msg}`);
      }
    } finally {
      setBusy(false);
    }
  }, [tagId]);

  const onOpenNativeApp = useCallback(async () => {
    setHint(null);
    const trimmed = tagId.trim();
    if (!trimmed) {
      setHint("태그 UID를 입력해 주세요.");
      return;
    }
    setNativeBusy(true);
    try {
      const handoff = await prepareNfcNativeHandoff(trimmed);
      if (!handoff.ok) {
        setHint(handoff.error);
        return;
      }
      if (typeof window !== "undefined") {
        window.location.href = handoff.appLink;
      }
      setHint("전용 앱 실행을 시도했습니다. 앱에서 기록 후 이력 화면에서 결과를 확인하세요.");
    } finally {
      setNativeBusy(false);
    }
  }, [tagId]);

  return (
    <AdminCard id="nfc-url-write" variant="section" className="space-y-4 scroll-mt-24">
      {/* 페이지 상단(AdminPageIntro)과 중복되지 않도록 시각적 제목은 숨김 */}
      <h2 className="sr-only">NDEF URL 기록 폼</h2>

      {nfcSupported === false && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] font-black leading-snug sm:text-[10px]",
            "border-amber-200 bg-amber-50 text-amber-900"
          )}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
          <span>NDEFWriter 없음 — Chrome(HTTPS) 또는 도움말</span>
        </div>
      )}

      {nfcReadSupported === false && nfcSupported !== false && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] font-black leading-snug sm:text-[10px]",
            "border-slate-200 bg-slate-50 text-slate-700"
          )}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
          <span>NDEFReader 없음 — UID 수동 입력·도움말</span>
        </div>
      )}

      {originMismatchNotice ? (
        <div
          className={cn(
            "flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] font-semibold leading-snug sm:text-[10px] sm:font-black",
            "border-amber-200 bg-amber-50 text-amber-950"
          )}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
          <span>{originMismatchNotice}</span>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="nfc-tag-uid" className="text-[11px] font-black uppercase tracking-widest text-slate-500 sm:text-[10px]">
          태그 UID
        </Label>
        <Input
          id="nfc-tag-uid"
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
          placeholder="태그 뒷면 UID"
          disabled={busy}
          autoCapitalize="characters"
          autoCorrect="off"
          className={cn(
            adminUi.input,
            "min-h-[48px] rounded-2xl font-mono text-base shadow-inner focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 sm:h-12 sm:text-sm"
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={readBusy || busy || nfcReadSupported === false}
          onClick={() => {
            setHint(null);
            setReadBusy(true);
            void readNfcTagUidOnce().then((r) => {
              setReadBusy(false);
              if (r.ok) {
                setTagId(r.uid);
                setHint(`UID를 읽었습니다: ${r.uid}`);
                void recordNfcWebReadAudit({ success: true, source: "write_card", tagId: r.uid });
              } else {
                setHint(r.error);
                void recordNfcWebReadAudit({ success: false, source: "write_card", clientError: r.error });
              }
            });
          }}
          className="min-h-[52px] rounded-2xl border-slate-200 text-[14px] font-black touch-manipulation sm:h-12 sm:text-xs"
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
          disabled={busy || nfcSupported === false}
          className={cn(
            "min-h-[52px] rounded-2xl text-[14px] font-black touch-manipulation sm:h-12 sm:text-xs",
            adminUi.darkButton
          )}
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
              기록 중...
            </>
          ) : (
            "NFC 태그에 URL 기록"
          )}
        </Button>
      </div>

      {SHOW_NFC_NATIVE_HANDOFF ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => void onOpenNativeApp()}
          disabled={nativeBusy || busy}
          className="min-h-[52px] w-full rounded-2xl border-slate-200 text-[14px] font-black touch-manipulation sm:h-11 sm:w-auto sm:text-xs"
        >
          {nativeBusy ? (
            <>
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              앱 실행 준비 중...
            </>
          ) : (
            "전용 앱에서 쓰기 열기 (선택)"
          )}
        </Button>
      ) : null}

      {hint && (
        <p className="text-[14px] font-semibold leading-relaxed text-slate-600 whitespace-pre-wrap sm:text-[11px] sm:font-bold">
          {hint}
        </p>
      )}
    </AdminCard>
  );
}
