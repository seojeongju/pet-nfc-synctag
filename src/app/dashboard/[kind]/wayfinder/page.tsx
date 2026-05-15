import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { parseSubjectKind } from "@/lib/subject-kind";
import { requireTenantMember } from "@/lib/tenant-membership";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import { canUseModeFeature } from "@/lib/mode-visibility";
import { getTenantStatus } from "@/lib/tenant-status";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  LayoutGrid,
  Lock,
  Power,
} from "lucide-react";
import { isWayfinderEnabled } from "@/lib/wayfinder/feature";
import { listWayfinderSpotsForDashboard, type WayfinderSpotRow } from "@/lib/wayfinder-spots-db";
import { getMembership } from "@/lib/tenant-membership";
import { WayfinderDashboardSpotSection } from "@/components/wayfinder/WayfinderDashboardSpotSection";
import { WayfinderDashboardHeader } from "@/components/wayfinder/WayfinderDashboardHeader";
import { WfAlertBanner } from "@/components/wayfinder/wayfinder-dashboard-ui";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function DashboardWayfinderPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ tenant?: string; err?: string; register?: string }>;
}) {
  const { kind: kindParam } = await params;
  const { tenant: tenantParam, err, register } = await searchParams;

  const subjectKind = parseSubjectKind(kindParam);
  const tenantId = typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;
  const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
  const wayfinderBeta = isWayfinderEnabled();

  const errMsg =
    err === "invalid"
      ? "입력값을 확인해 주세요."
      : err === "invalid_slug"
        ? "주소(slug)는 영문 소문자·숫자·하이픈만, 3~64자로 입력해 주세요."
        : err === "slug_taken"
          ? "이미 사용 중인 주소(slug)입니다. 다른 값을 입력해 주세요."
          : err === "forbidden"
            ? "권한이 없거나 해당 스팟을 찾을 수 없습니다."
            : err === "tenant_suspended"
              ? "중지된 조직에서는 변경할 수 없습니다."
              : err === "db"
                ? "저장에 실패했습니다. D1 마이그레이션(wayfinder_spots) 적용 여부를 확인해 주세요."
                : null;

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

      let spots: WayfinderSpotRow[] = [];
      let spotsLoadError: string | null = null;
      let tenantRole: Awaited<ReturnType<typeof getMembership>> = null;
      if (tenantId) {
        tenantRole = await getMembership(context.env.DB, session.user.id, tenantId);
      }
      if (wayfinderBeta && !writeLocked) {
        try {
          spots = await listWayfinderSpotsForDashboard(
            context.env.DB,
            session.user.id,
            subjectKind,
            tenantId ?? undefined
          );
        } catch (e: unknown) {
          console.error("wayfinder spots list error:", e);
          spotsLoadError =
            "스팟 목록을 불러오지 못했습니다. D1 마이그레이션 0033_wayfinder_spots.sql · 0035_wayfinder_spot_contact_phone.sql 적용 여부를 확인해 주세요.";
        }
      }

      const publicSpotPageBase = "/wayfinder/s";
      const spotSectionExpanded = register === "1" || Boolean(err);
      const publishedCount = spots.filter((s) => s.is_published).length;

      return (
        <div className="relative min-h-0 w-full min-w-0 overflow-x-hidden bg-[#F8FAFC] pb-8 font-outfit">
          <div className="pointer-events-none absolute left-0 top-0 h-[280px] w-full bg-gradient-to-b from-indigo-500/12 via-violet-500/5 to-transparent" />
          <div className="relative mx-auto w-full min-w-0 max-w-lg space-y-5 px-4 pt-6 sm:px-5 sm:pt-8">
            <nav className="flex flex-wrap gap-2" aria-label="빠른 이동">
              <Link
                href="/hub"
                className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50/90 px-3 py-2 text-xs font-black text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
              >
                <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                허브·모드
              </Link>
              <Link
                href={`/dashboard/${subjectKind}${tenantQs}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/80 hover:text-indigo-800"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                대시보드 홈
              </Link>
            </nav>

            <WayfinderDashboardHeader
              spotCount={spots.length}
              publishedCount={publishedCount}
              publicSpotPageBase={publicSpotPageBase}
            />

            {!wayfinderBeta ? (
              <WfAlertBanner variant="warning" icon={Power} title="링크유-동행이 꺼져 있습니다">
                운영·빌드 환경에서{" "}
                <span className="font-mono text-xs">NEXT_PUBLIC_WAYFINDER_ENABLED</span>가{" "}
                <span className="font-mono text-xs">false</span>이면 스팟 관리를 쓸 수 없습니다. 값을 제거하거나{" "}
                <span className="font-mono text-xs">true</span>로 설정한 뒤 다시 배포하세요.
              </WfAlertBanner>
            ) : null}

            {writeLocked ? (
              <WfAlertBanner variant="warning" icon={Lock} title="이용이 제한되었습니다">
                현재 모드 이용이 제한되었거나 조직이 정지된 상태입니다. 관리자에게 문의하세요.
              </WfAlertBanner>
            ) : null}

            {errMsg ? (
              <WfAlertBanner variant="error" icon={AlertCircle} title="저장·입력 오류">
                {errMsg}
              </WfAlertBanner>
            ) : null}

            {wayfinderBeta && !writeLocked ? (
              <WayfinderDashboardSpotSection
                subjectKind={subjectKind}
                tenantId={tenantId}
                tenantQs={tenantQs}
                spots={spots}
                spotsLoadError={spotsLoadError}
                sessionUserId={session.user.id}
                tenantRole={tenantRole}
                defaultExpanded={spotSectionExpanded}
                publicSpotPageBase={publicSpotPageBase}
              />
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
