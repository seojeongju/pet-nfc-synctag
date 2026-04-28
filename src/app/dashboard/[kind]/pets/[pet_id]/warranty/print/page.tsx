import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getPet } from "@/app/actions/pet";
import { getWarrantyByIdForOwner } from "@/lib/jewelry-warranty-db";
import { parseSubjectKind } from "@/lib/subject-kind";
import type { JewelryWarrantyProductSnapshot } from "@/types/warranty";
import type { SubjectKind } from "@/lib/subject-kind";
import { WarrantyPrintToolbar } from "@/components/pet/WarrantyPrintToolbar";

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

export default async function JewelryWarrantyPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; pet_id: string }>;
  searchParams: Promise<{ cert?: string; tenant?: string }>;
}) {
  const { kind: kindParam, pet_id } = await params;
  const { cert: certId, tenant: tenantParam } = await searchParams;

  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const subjectKind = parseSubjectKind(kindParam) as SubjectKind;
  if (subjectKind !== "gold") notFound();

  const pet = (await getPet(pet_id)) as {
    owner_id: string;
    subject_kind?: string | null;
    tenant_id?: string | null;
  } | null;
  if (!pet || pet.owner_id !== session.user.id) notFound();

  const petSubject = parseSubjectKind(pet.subject_kind ?? kindParam);
  if (petSubject !== "gold") notFound();

  if (!certId?.trim()) notFound();

  const row = await getWarrantyByIdForOwner(
    context.env.DB,
    certId.trim(),
    session.user.id
  );
  if (!row || row.pet_id !== pet_id) notFound();

  const snap = parseSnapshot(row.product_snapshot_json);
  if (!snap) notFound();

  const statusLabel =
    row.status === "active" ? "유효" : row.status === "revoked" ? "폐지됨" : row.status;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const verifyPath = `/warranty/verify/${row.public_verify_id}`;
  const verifyAbsolute = host
    ? `${proto}://${host}${verifyPath}`
    : verifyPath;

  const resolvedTenantId =
    typeof pet.tenant_id === "string" && pet.tenant_id.trim()
      ? pet.tenant_id.trim()
      : typeof tenantParam === "string" && tenantParam.trim()
        ? tenantParam.trim()
        : null;
  const tenantQs = resolvedTenantId
    ? `?tenant=${encodeURIComponent(resolvedTenantId)}`
    : "";
  const backHref = `/dashboard/gold/pets/${pet_id}${tenantQs}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white print:min-h-0">
      <div className="max-w-3xl mx-auto px-4 py-6 print:py-8 print:max-w-none print:px-8">
        <WarrantyPrintToolbar backHref={backHref} />

        <article className="bg-white border-2 border-amber-200/80 rounded-2xl shadow-sm print:shadow-none print:border-slate-300 p-8 sm:p-10 space-y-6 print:rounded-none">
          <header className="text-center border-b border-amber-200/60 pb-6">
            <p className="text-xs font-black tracking-[0.2em] text-amber-800 uppercase">
              Linkyo Gold · Jewelry
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
              전자 보증서
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">{snap.issuerName}</p>
          </header>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                보증서 번호
              </dt>
              <dd className="font-black text-slate-800 mt-0.5 break-all">{row.certificate_no}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">상태</dt>
              <dd className="font-black text-slate-800 mt-0.5">{statusLabel}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">발급일</dt>
              <dd className="font-bold text-slate-700 mt-0.5">
                {row.issued_at?.slice(0, 10) ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                유효기간 만료
              </dt>
              <dd className="font-bold text-slate-700 mt-0.5">
                {row.valid_until ? row.valid_until.slice(0, 10) : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                품목 / 관리명
              </dt>
              <dd className="font-black text-slate-800 mt-0.5">
                {snap.productLine} · {snap.petName}
                {snap.breed ? ` (${snap.breed})` : ""}
              </dd>
            </div>
            {snap.orderId && (
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  연결 주문 ID
                </dt>
                <dd className="font-mono text-xs font-bold text-slate-600 break-all">{snap.orderId}</dd>
              </div>
            )}
          </dl>

          <section className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm leading-relaxed">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              보증 범위
            </p>
            <p className="font-bold text-slate-700 whitespace-pre-wrap">{snap.warrantyScopeSummary}</p>
          </section>

          <footer className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center leading-relaxed">
            본 전자문서는 Pet-ID Connect에 등록된 링크유 골드 관리 대상에 대해 발급되었습니다. 진위
            확인은 아래 공개 검증 URL로 할 수 있습니다.
            <p className="mt-2 font-mono text-[10px] break-all text-slate-600">{verifyAbsolute}</p>
          </footer>
        </article>
      </div>
    </div>
  );
}
