import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getPet } from "@/app/actions/pet";
import { listHealthRecordsForPet } from "@/lib/health-records-db";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { getTenantStatus } from "@/lib/tenant-status";
import { HealthRecordForm } from "@/components/pet/HealthRecordForm";
import { HealthRecordTimeline } from "@/components/pet/HealthRecordTimeline";
import { ArrowLeft, Heart, Stethoscope } from "lucide-react";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import { cn } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type PetRow = {
  id: string;
  owner_id: string;
  tenant_id?: string | null;
  subject_kind?: string | null;
  name: string;
  breed?: string | null;
  photo_url?: string | null;
};

export default async function PetHealthPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; pet_id: string }>;
  searchParams: Promise<{ tenant?: string }>;
}) {
  let kindQs = "?kind=pet";
  let subjectKind: string = "pet";

  try {
    const { kind: kindParam, pet_id } = await params;
    const { tenant: tenantParam } = await searchParams;

    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/login");

    const pet = (await getPet(pet_id)) as PetRow | null;
    if (!pet) notFound();
    
    subjectKind = parseSubjectKind(pet.subject_kind ?? kindParam);

    if (pet.owner_id !== session.user.id) {
       redirect(`/dashboard/${subjectKind}`);
    }

    const tenantId =
      typeof pet.tenant_id === "string" && pet.tenant_id.trim()
        ? pet.tenant_id.trim()
        : typeof tenantParam === "string" && tenantParam.trim()
        ? tenantParam.trim()
        : null;

    const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
    kindQs = tenantQs;

    const meta = subjectKindMeta[subjectKind as SubjectKind];
    const tenantSuspended = tenantId
      ? (await getTenantStatus(context.env.DB, tenantId)) === "suspended"
      : false;

    const records = await listHealthRecordsForPet(context.env.DB, pet.id);

    const vaccineCnt = records.filter((r) => r.type === "vaccine").length;
    const medicalCnt = records.filter((r) => r.type === "medical").length;

    return (
      <div className="min-h-screen bg-[#F8FAFC] font-outfit pb-28">
        {/* 헤더 */}
        <div className="bg-white border-b border-slate-100 px-5 pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <a href={`/dashboard/${subjectKind}/pets/${pet.id}${kindQs}`}>
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </div>
            </a>
            <div className="w-10 h-10 rounded-[14px] bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900">{pet.name}의 건강 기록</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{meta.label}</p>
          </div>

          {/* 통계 뱃지 */}
          <div className="flex gap-3 mt-5">
            <div className="flex-1 rounded-[16px] bg-emerald-50 border border-emerald-100 px-4 py-3 text-center">
              <p className="text-2xl font-black text-emerald-600">{vaccineCnt}</p>
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">예방접종</p>
            </div>
            <div className="flex-1 rounded-[16px] bg-rose-50 border border-rose-100 px-4 py-3 text-center">
              <p className="text-2xl font-black text-rose-500">{medicalCnt}</p>
              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">진료</p>
            </div>
            <div className="flex-1 rounded-[16px] bg-slate-50 border border-slate-100 px-4 py-3 text-center">
              <p className="text-2xl font-black text-slate-700">{records.length}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">전체</p>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-5 pt-6 space-y-5">

          {/* 중지 조직 경고 */}
          {tenantSuspended && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-bold text-amber-700">
              조직이 중지된 상태라 기록 추가/삭제가 잠겨 있습니다.
            </div>
          )}

          {/* 기록 추가 폼 */}
          {!tenantSuspended && (
            <section>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">기록 추가</p>
              <HealthRecordForm petId={pet.id} />
            </section>
          )}

          {/* 타임라인 */}
          <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm px-5 pt-5 pb-4">
            <div className={cn("flex items-center gap-2 mb-4")}>
              <Heart className="w-4 h-4 text-rose-400" />
              <p className="text-sm font-black text-slate-800">전체 기록</p>
            </div>
            <HealthRecordTimeline
              records={records}
              allowDelete={!tenantSuspended}
            />
          </section>
        </div>
      </div>
    );
  } catch (error: unknown) {
    rethrowNextControlFlowErrors(error);
    return (
      <div className="flex min-h-screen items-center justify-center text-center font-outfit px-6">
        <div className="space-y-4">
          <p className="text-lg font-black text-slate-900">건강 기록을 불러오지 못했어요</p>
          <p className="text-sm text-slate-500">잠시 후 다시 시도해 주세요.</p>
          <a href={`/dashboard/${subjectKind}${kindQs}`} className="inline-block mt-2 text-sm font-bold text-teal-600 hover:underline">
            대시보드로 돌아가기
          </a>
        </div>
      </div>
    );
  }
}
