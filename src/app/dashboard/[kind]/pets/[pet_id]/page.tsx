import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getPet } from "@/app/actions/pet";
import { getPetTags } from "@/app/actions/tag";
import { listRecentHealthRecordsForPet, healthRecordTypeLabel, healthRecordTypeColor } from "@/lib/health-records-db";
import type { HealthRecordType } from "@/lib/health-records-db";
import { getScanLogsWithDb } from "@/lib/scan-logs-db";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { getTenantStatus } from "@/lib/tenant-status";
import { LostModeToggle } from "@/components/pet/LostModeToggle";
import {
  ArrowLeft, PawPrint, Edit3, Heart, Activity,
  Nfc, Stethoscope, Clock, AlertTriangle, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type ScanLogRow = {
  id: string | number;
  pet_name?: string | null;
  scanned_at: string;
};


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
  emergency_contact?: string | null;
  medical_info?: string | null;
  is_lost?: number | null;
};

export default async function PetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; pet_id: string }>;
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { kind: kindParam, pet_id } = await params;
  const { tenant: tenantParam } = await searchParams;

  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const pet = (await getPet(pet_id)) as PetRow | null;
  if (!pet) notFound();
  
  const subjectKind = parseSubjectKind(pet.subject_kind ?? kindParam);

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
  const kindQs = tenantQs;
  const dashboardLink = `/dashboard/${subjectKind}${tenantQs}`;
  const listLink = `/dashboard/${subjectKind}/pets${tenantQs}`;
  const scansLink = `/dashboard/${subjectKind}/scans${tenantQs}`;

  const meta = subjectKindMeta[subjectKind];
  const isLost = Boolean(pet.is_lost);

  const tenantSuspended = tenantId
    ? (await getTenantStatus(context.env.DB, tenantId)) === "suspended"
    : false;

  // 병렬 데이터 로드
  const [tags, recentHealth, recentScansRaw] = await Promise.all([
    getPetTags(pet.id, tenantId).catch(() => []),
    listRecentHealthRecordsForPet(context.env.DB, pet.id, 3),
    getScanLogsWithDb(context.env.DB, session.user.id, subjectKind, tenantId ?? undefined)
      .then((logs) => logs.slice(0, 3))
      .catch(() => []),
  ]);
  // D1 결과를 타입 안전하게 캐스팅
  const recentScans = recentScansRaw as ScanLogRow[];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit pb-28">
      {/* 히어로 헤더 */}
      <div className="relative bg-white">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={cn(
            "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30",
            isLost ? "bg-rose-400" : "bg-teal-400"
          )} />
        </div>

        <div className="relative z-10 px-5 pt-8 pb-6">
          {/* 상단 내비 */}
          <div className="flex items-center justify-between mb-6">
            <a href={listLink}>
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </div>
            </a>
            <a href={`/dashboard/${subjectKind}/pets/${pet.id}/edit${kindQs}`}>
              <div className={cn(
                "flex items-center gap-1.5 px-4 h-10 rounded-2xl font-black text-xs transition-colors",
                tenantSuspended
                  ? "bg-slate-100 text-slate-400 pointer-events-none"
                  : "bg-slate-900 text-white hover:bg-teal-600"
              )}>
                <Edit3 className="w-4 h-4" />
                편집
              </div>
            </a>
          </div>

          {/* 펫 프로필 */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-[24px] overflow-hidden bg-teal-50 border-4 border-white shadow-xl">
                {pet.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-teal-300">
                    <PawPrint className="w-9 h-9" />
                  </div>
                )}
              </div>
              {isLost && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 truncate">{pet.name}</h1>
                {isLost && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    실종
                  </span>
                )}
              </div>
              {pet.breed && (
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {pet.breed}
                </p>
              )}
              <p className="text-[10px] font-bold text-teal-600 mt-1">{meta.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="px-5 pt-6 space-y-5">

        {/* 실종 모드 토글 */}
        <section>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">실종 신고</p>
          <LostModeToggle
            petId={pet.id}
            petName={pet.name}
            initialIsLost={isLost}
            writeLocked={tenantSuspended}
          />
        </section>

        {/* NFC 태그 섹션 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[10px] bg-teal-50 flex items-center justify-center text-teal-500">
                  <Nfc className="w-4 h-4" />
                </div>
                <p className="text-sm font-black text-slate-800">NFC 태그</p>
              </div>
              <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                {tags.length}개 연결
              </span>
            </div>

            {tags.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 py-4 text-center">
                <p className="text-xs font-bold text-slate-500">연결된 태그가 없어요</p>
                <a
                  href={dashboardLink}
                  className="mt-1 inline-block text-[11px] font-black text-teal-600 hover:underline"
                >
                  대시보드에서 태그 연결하기 →
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {tags.slice(0, 3).map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-[14px] bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        tag.is_active ? "bg-teal-400" : "bg-slate-300"
                      )} />
                      <span className="text-xs font-black text-slate-700 font-mono">{tag.id.slice(0, 16)}{tag.id.length > 16 ? "…" : ""}</span>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wide",
                      tag.is_active ? "text-teal-500" : "text-slate-400"
                    )}>
                      {tag.is_active ? "활성" : "비활성"}
                    </span>
                  </div>
                ))}
                {tags.length > 3 && (
                  <p className="text-[10px] font-bold text-slate-400 text-center">
                    +{tags.length - 3}개 더
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 최근 스캔 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[10px] bg-rose-50 flex items-center justify-center text-rose-400">
                  <Activity className="w-4 h-4" />
                </div>
                <p className="text-sm font-black text-slate-800">최근 스캔</p>
              </div>
              <a
                href={scansLink}
                className="text-[10px] font-black text-teal-600 flex items-center gap-0.5 hover:underline"
              >
                전체 보기 <ChevronRight className="w-3 h-3" />
              </a>
            </div>

            {recentScans.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 py-4 text-center">
                <p className="text-xs font-bold text-slate-500">아직 스캔 기록이 없어요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] bg-slate-50 border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-700 truncate">{scan.pet_name}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                        <Clock className="w-3 h-3" />
                        {new Date(scan.scanned_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 건강 기록 요약 */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[10px] bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <p className="text-sm font-black text-slate-800">건강 기록</p>
              </div>
              <a
                href={`/dashboard/${subjectKind}/pets/${pet.id}/health${kindQs}`}
                className="text-[10px] font-black text-teal-600 flex items-center gap-0.5 hover:underline"
              >
                전체 관리 <ChevronRight className="w-3 h-3" />
              </a>
            </div>

            {recentHealth.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 py-4 text-center">
                <p className="text-xs font-bold text-slate-500">기록된 건강 정보가 없어요</p>
                <a
                  href={`/dashboard/${subjectKind}/pets/${pet.id}/health${kindQs}`}
                  className="mt-1 inline-block text-[11px] font-black text-teal-600 hover:underline"
                >
                  건강 기록 추가하기 →
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {recentHealth.map((rec) => {
                  const color = healthRecordTypeColor[rec.type as HealthRecordType] ?? healthRecordTypeColor.note;
                  const label = healthRecordTypeLabel[rec.type as HealthRecordType] ?? rec.type;
                  return (
                    <div key={rec.id} className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] bg-slate-50 border border-slate-100">
                      <span className={cn("text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-full border", color.bg, color.text, color.border)}>
                        {label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-700 truncate">{rec.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{rec.record_date.slice(0, 10)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 응급 연락처 */}
        {pet.emergency_contact && (
          <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">비상 연락처</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">{pet.emergency_contact}</p>
            </div>
            <a
              href={`tel:${pet.emergency_contact}`}
              className="w-12 h-12 rounded-[16px] bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-200 transition-transform active:scale-90"
            >
              <Heart className="w-5 h-5" />
            </a>
          </section>
        )}
      </div>
    </div>
  );
}
