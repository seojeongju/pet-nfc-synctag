import { getCfRequestContext } from "@/lib/cf-request-context";
import { notFound } from "next/navigation";
import { getWarrantyByPublicId } from "@/lib/jewelry-warranty-db";
import type { JewelryWarrantyProductSnapshot } from "@/types/warranty";
import { ShieldCheck, ShieldOff } from "lucide-react";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function parseSnapshot(json: string): JewelryWarrantyProductSnapshot | null {
  try {
    const o = JSON.parse(json) as JewelryWarrantyProductSnapshot;
    if (!o || typeof o.issuerName !== "string" || typeof o.petName !== "string") return null;
    return o;
  } catch {
    return null;
  }
}

export default async function WarrantyPublicVerifyPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  if (!publicId?.trim()) notFound();

  const context = getCfRequestContext();
  const row = await getWarrantyByPublicId(context.env.DB, publicId.trim());
  if (!row) {
    notFound();
  }

  const snap = parseSnapshot(row.product_snapshot_json);
  if (!snap) notFound();

  const active = row.status === "active";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-lg">
        <div
          className={
            active
              ? "flex items-center gap-2 text-emerald-700 mb-4"
              : "flex items-center gap-2 text-amber-800 mb-4"
          }
        >
          {active ? (
            <ShieldCheck className="w-8 h-8 shrink-0" />
          ) : (
            <ShieldOff className="w-8 h-8 shrink-0" />
          )}
          <div>
            <h1 className="text-lg font-black tracking-tight">
              {active ? "전자 보증서 확인" : "보증서가 유효하지 않습니다"}
            </h1>
            <p className="text-xs font-bold opacity-80">
              {active
                ? "Pet-ID Connect에 등록된 발급 정보와 일치합니다."
                : "폐지되었거나 식별자가 올바르지 않을 수 있어요."}
            </p>
          </div>
        </div>

        <article className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                제조 / 발급
              </dt>
              <dd className="font-black text-slate-900 mt-0.5">{snap.issuerName}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                보증서 번호
              </dt>
              <dd className="font-mono font-bold text-slate-800 break-all mt-0.5">
                {row.certificate_no}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">품목</dt>
              <dd className="font-bold text-slate-800 mt-0.5">
                {snap.productLine} · {snap.petName}
                {snap.breed ? ` (${snap.breed})` : ""}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  발급일
                </dt>
                <dd className="font-bold text-slate-700 mt-0.5">
                  {row.issued_at?.slice(0, 10) ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  유효 만료
                </dt>
                <dd className="font-bold text-slate-700 mt-0.5">
                  {row.valid_until ? row.valid_until.slice(0, 10) : "—"}
                </dd>
              </div>
            </div>
            {!active && row.revoke_reason && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200/60 px-3 py-2">
                <p className="text-[10px] font-black text-amber-900/70 uppercase tracking-widest">
                  사유
                </p>
                <p className="text-sm font-bold text-amber-950 mt-0.5">{row.revoke_reason}</p>
              </div>
            )}
          </dl>

          <p className="text-xs font-bold text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
            {snap.warrantyScopeSummary}
          </p>
        </article>

        <p className="text-[10px] text-center text-slate-400 font-bold mt-6">
          링크유 · Pet-ID Connect — 공개 진위 조회
        </p>
      </div>
    </div>
  );
}
