"use client";

import { useCallback, useEffect, useState } from "react";
import { prepareNfcTagWrite, recordNfcWebReadAudit, recordNfcWebWriteAudit } from "@/app/actions/admin";
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

export function AdminNfcWriteCard() {
  const [tagId, setTagId] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [nfcReadSupported, setNfcReadSupported] = useState<boolean | null>(null);
  const [readBusy, setReadBusy] = useState(false);

  useEffect(() => {
    setNfcSupported(!!getNdefWriterClass());
    setNfcReadSupported(isWebNfcReadSupported());
  }, []);

  const onWrite = useCallback(async () => {
    setHint(null);
    const Writer = getNdefWriterClass();
    if (!Writer) {
      setHint(
        "현재 브라우저에서는 Web NFC(NDEFWriter)를 사용할 수 없습니다. Android Chrome(HTTPS)에서 실행하거나, 데스크톱 NFC 도구로 동일한 URL을 기록해 주세요. 자세한 내용은 docs/NFC_BLE_WEB_WRITING.md를 확인하세요."
      );
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

  return (
    <AdminCard id="nfc-url-write" variant="section" className="space-y-4 scroll-mt-24">
      {/* 페이지 상단(AdminPageIntro)과 중복되지 않도록 시각적 제목은 숨김 */}
      <h2 className="sr-only">NDEF URL 기록 폼</h2>

      {nfcSupported === false && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-2xl border px-4 py-3 text-[11px] font-bold",
            "border-amber-200 bg-amber-50 text-amber-900"
          )}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>이 브라우저는 NDEFWriter를 지원하지 않습니다.</span>
        </div>
      )}

      {nfcReadSupported === false && nfcSupported !== false && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-2xl border px-4 py-3 text-[11px] font-bold",
            "border-slate-200 bg-slate-50 text-slate-700"
          )}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>NDEFReader(UID 읽기)는 이 환경에서 쓸 수 없습니다. UID는 수동 입력하세요.</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nfc-tag-uid" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          태그 UID
        </Label>
        <Input
          id="nfc-tag-uid"
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
          placeholder="태그 뒷면 UID"
          disabled={busy}
          className={cn(adminUi.input, "h-12 rounded-2xl font-mono text-sm")}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
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
          className="h-12 rounded-2xl border-slate-200 font-black text-xs"
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
          className={cn("h-12 rounded-2xl font-black", adminUi.darkButton)}
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

      {hint && (
        <p className="text-[11px] font-bold text-slate-600 whitespace-pre-wrap leading-relaxed">{hint}</p>
      )}
    </AdminCard>
  );
}
