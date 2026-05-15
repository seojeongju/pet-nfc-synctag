import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { requireTenantMember } from "@/lib/tenant-membership";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import { canUseModeFeature } from "@/lib/mode-visibility";
import { getTenantStatus } from "@/lib/tenant-status";
import Link from "next/link";
import { ArrowLeft, Navigation2 } from "lucide-react";
import { linkuCompanionMenuTitle, linkuCompanionServiceDescription } from "@/lib/wayfinder/copy";
import { isWayfinderEnabled } from "@/lib/wayfinder/feature";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function DashboardWayfinderPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { kind: kindParam } = await params;
  const { tenant: tenantParam } = await searchParams;

  const subjectKind = parseSubjectKind(kindParam);
  const tenantId = typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;
  const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
  const meta = subjectKindMeta[subjectKind];
  const wayfinderBeta = isWayfinderEnabled();

  try {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/login");
    }

    try {
      if (tenantId) {
        await requireTenantMember(context.env.DB, session.user.id, tenantId);
      }

      const roleRow = await context.env.DB
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(session.user.id)
        .first<{ role?: string | null }>();
      const isAdmin = isPlatformAdminRole(roleRow?.role);
      const modeFeatureEnabled = await canUseModeFeature(
        context.env.DB,
        session.user.id,
        subjectKind,
        { isPlatformAdmin: isAdmin, tenantId }
      );
      const tenantStatus = tenantId ? await getTenantStatus(context.env.DB, tenantId) : null;
      const writeLocked = tenantStatus === "suspended" || !modeFeatureEnabled;

      return (
        <div className="relative min-h-0 w-full min-w-0 overflow-x-hidden bg-[#F8FAFC] pb-8 font-outfit">
          <div className="pointer-events-none absolute left-0 top-0 h-[240px] w-full bg-gradient-to-b from-indigo-500/10 to-transparent" />
          <div className="relative mx-auto w-full min-w-0 max-w-lg space-y-6 px-4 pt-6 sm:px-5 sm:pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <Link
                href={`/dashboard/${subjectKind}${tenantQs}`}
                className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/80 hover:text-indigo-800"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                대시보드 홈
              </Link>
            </div>

            <header className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black tracking-wider text-indigo-700">
                <Navigation2 className="h-3.5 w-3.5" aria-hidden />
                {linkuCompanionMenuTitle}
              </div>
              <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-[26px]">
                {linkuCompanionServiceDescription}
              </h1>
              <p className="text-sm font-semibold leading-relaxed text-slate-600">
                {meta.label} 모드 진입입니다. 공개 스팟 URL은{" "}
                <span className="font-mono text-xs text-slate-500">/wayfinder</span> 입니다.
              </p>
            </header>

            {!wayfinderBeta ? (
              <section
                className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm"
                aria-label={`${linkuCompanionMenuTitle} 준비 안내`}
              >
                <p className="text-sm font-black text-amber-900">기능 점진 오픈 중</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-950/90">
                  상세 개발·베타 화면은 배포 환경에서{" "}
                  <span className="font-mono text-xs">NEXT_PUBLIC_WAYFINDER_ENABLED=true</span>일 때 확장됩니다.
                  허브에서는 항상 6번째 타일로 안내합니다.
                </p>
              </section>
            ) : null}

            {writeLocked ? (
              <section
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                aria-label="이용 제한"
              >
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                  현재 모드 이용이 제한되었거나 조직이 정지된 상태입니다. 관리자에게 문의하세요.
                </p>
              </section>
            ) : null}

            {wayfinderBeta && !writeLocked ? (
              <>
                <section
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  aria-label={`${linkuCompanionMenuTitle} 상태`}
                >
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                    다음으로 D1 스팟 스키마·읽기 API·공개 스팟 페이지를 순서대로 붙입니다. 설정·문구는 프로필(휠체어·시각
                    등)별로 확장합니다.
                  </p>
                </section>

                <section
                  className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm"
                  aria-label="개발 로드맵"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">진행 예정</p>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm font-semibold text-slate-700">
                    <li>시설·스팟 메타데이터 (D1 마이그레이션)</li>
                    <li>공개 스팟 뷰 + Web Speech API 안내</li>
                    <li>이 화면에서 스팟 목록·문구 편집(권한 연동)</li>
                  </ol>
                </section>
              </>
            ) : null}
          </div>
        </div>
      );
    } catch (dataError: unknown) {
      rethrowNextControlFlowErrors(dataError);
      console.error("linku-companion dashboard page data error:", dataError);
      redirect(`/dashboard/${subjectKind}${tenantQs}`);
    }
  } catch (error: unknown) {
    rethrowNextControlFlowErrors(error);
    console.error("linku-companion dashboard page auth error:", error);
    redirect("/login");
  }
}
