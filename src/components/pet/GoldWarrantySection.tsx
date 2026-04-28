"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { issueJewelryWarrantyCertificate } from "@/app/actions/warranty";
import { Gem, Printer, Link2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMonthDayTimeKoSeoul } from "@/lib/format-datetime-ko-seoul";

type Initial = {
  id: string;
  certificate_no: string;
  public_verify_id: string;
  issued_at: string;
  valid_until: string | null;
} | null;

function buildPrintHref(
  subjectKind: "gold",
  petId: string,
  certId: string,
  tenantId: string | null
) {
  const q = new URLSearchParams();
  q.set("cert", certId);
  if (tenantId) q.set("tenant", tenantId);
  return `/dashboard/${subjectKind}/pets/${petId}/warranty/print?${q.toString()}`;
}

export function GoldWarrantySection({
  petId,
  subjectKind,
  tenantId,
  initial,
  writeLocked,
}: {
  petId: string;
  subjectKind: "gold";
  tenantId: string | null;
  initial: Initial;
  writeLocked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [verifyUrlDisplay, setVerifyUrlDisplay] = useState("");

  useEffect(() => {
    if (!initial?.public_verify_id) return;
    setVerifyUrlDisplay(
      typeof window !== "undefined"
        ? `${window.location.origin}/warranty/verify/${initial.public_verify_id}`
        : ""
    );
  }, [initial?.public_verify_id]);

  const printHref = initial
    ? buildPrintHref(subjectKind, petId, initial.id, tenantId)
    : null;

  const verifyPath = initial
    ? `/warranty/verify/${encodeURIComponent(initial.public_verify_id)}`
    : null;

  const copyVerifyUrl = () => {
    if (!verifyPath || typeof window === "undefined") return;
    const full = `${window.location.origin}${verifyPath}`;
    void navigator.clipboard.writeText(full);
  };

  return (
    <section className="bg-gradient-to-br from-amber-50/80 to-amber-100/40 rounded-[28px] border border-amber-200/80 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-[10px] bg-amber-200/60 flex items-center justify-center text-amber-800 shrink-0">
              <Gem className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-800">주얼리 전자 보증서</p>
              <p className="text-[10px] font-bold text-amber-900/70">링크유 골드 · WOW3D PRO (주)와우쓰리디</p>
            </div>
          </div>
        </div>

        {err && (
          <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {err}
          </p>
        )}
        {writeLocked && (
          <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            현재 계정 상태에서는 보증서 발급 기능을 사용할 수 없습니다. 조회만 가능합니다.
          </p>
        )}

        {!initial ? (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
              발급일 기준 1년간 제조·소재 결함에 대해 제조자 보증이 적용됩니다. 유효 보증서는 대당 1건만
              유지됩니다.
            </p>
            <button
              type="button"
              disabled={writeLocked || pending}
              onClick={() => {
                setErr(null);
                startTransition(async () => {
                  const r = await issueJewelryWarrantyCertificate(petId);
                  if (!r.ok) {
                    setErr(r.error);
                    return;
                  }
                  router.refresh();
                });
              }}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition",
                writeLocked
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-amber-800 text-amber-50 shadow-md shadow-amber-900/10 hover:bg-amber-900"
              )}
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  발급 중…
                </>
              ) : (
                "전자 보증서 발급"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/80 border border-amber-200/60 px-4 py-3 space-y-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">보증서 번호</p>
              <p className="text-sm font-black text-slate-800 tracking-tight break-all">
                {initial.certificate_no}
              </p>
              <p className="text-[10px] font-bold text-slate-500">
                발급 {formatMonthDayTimeKoSeoul(initial.issued_at)}
                {initial.valid_until && (
                  <span> · 유효 ~ {initial.valid_until.slice(0, 10)}</span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {printHref && (
                <a
                  href={printHref}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800"
                >
                  <Printer className="w-3.5 h-3.5" />
                  인쇄용 보기
                </a>
              )}
              {verifyPath && (
                <button
                  type="button"
                  onClick={copyVerifyUrl}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-amber-300/80 bg-white text-amber-950 text-xs font-black hover:bg-amber-50"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  검증 링크 복사
                </button>
              )}
            </div>
            <a
              href={verifyPath ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[10px] font-bold text-amber-800/80 hover:underline break-all"
            >
              {verifyUrlDisplay || "공개 검증 페이지 열기 →"}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
