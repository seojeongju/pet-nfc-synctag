"use client";

import { useCallback, useEffect, useState } from "react";
import { prepareNfcTagWrite, recordNfcWebWriteAudit } from "@/app/actions/admin";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, Loader2, AlertTriangle } from "lucide-react";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    setNfcSupported(!!getNdefWriterClass());
  }, []);

  const onWrite = useCallback(async () => {
    setHint(null);
    const Writer = getNdefWriterClass();
    if (!Writer) {
      setHint(
        "Web NFC (NDEFWriter) is not available. Use Android Chrome over HTTPS, or write the same URL with a desktop NFC tool. See docs/NFC_BLE_WEB_WRITING.md"
      );
      return;
    }
    const trimmed = tagId.trim();
    if (!trimmed) {
      setHint("Enter tag UID.");
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
        setHint("Done. Audit log recorded.");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        await recordNfcWebWriteAudit({
          tagId: prep.tagId,
          url: prep.url,
          success: false,
          clientError: msg,
        });
        setHint(`Write failed: ${msg}`);
      }
    } finally {
      setBusy(false);
    }
  }, [tagId]);

  return (
    <AdminCard variant="section" className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5" />
        </div>
        <div className="space-y-1 min-w-0">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Web NFC URL write</h2>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            Writes NDEF URL for registered tags: NEXT_PUBLIC_APP_URL + /t/UID. Requires Android Chrome, HTTPS, and a user tap.
          </p>
        </div>
      </div>

      {nfcSupported === false && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-2xl border px-4 py-3 text-[11px] font-bold",
            "border-amber-200 bg-amber-50 text-amber-900"
          )}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>NDEFWriter not supported in this browser.</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nfc-tag-uid" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Tag UID
        </Label>
        <Input
          id="nfc-tag-uid"
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
          placeholder="UID on tag back"
          disabled={busy}
          className={cn(adminUi.input, "h-12 rounded-2xl font-mono text-sm")}
        />
      </div>

      <Button
        type="button"
        onClick={() => void onWrite()}
        disabled={busy || nfcSupported === false}
        className={cn("w-full h-12 rounded-2xl font-black", adminUi.darkButton)}
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
            Writing...
          </>
        ) : (
          "Write URL to NFC tag"
        )}
      </Button>

      {hint && (
        <p className="text-[11px] font-bold text-slate-600 whitespace-pre-wrap leading-relaxed">{hint}</p>
      )}
    </AdminCard>
  );
}
