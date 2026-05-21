import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { requireTenantMember } from "@/lib/tenant-membership";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import { getTenantStatus } from "@/lib/tenant-status";
import { AlertCircle, LayoutGrid, Lock, Power, TrainFront } from "lucide-react";
import { WfIconNavButton } from "@/components/wayfinder/wayfinder-dashboard-ui";
import { isWayfinderEnabled } from "@/lib/wayfinder/feature";
import { listWayfinderSpotsForDashboard, type WayfinderSpotRow } from "@/lib/wayfinder-spots-db";
import { getMembership } from "@/lib/tenant-membership";
import { WayfinderDashboardSpotSection } from "@/components/wayfinder/WayfinderDashboardSpotSection";
import { WayfinderDashboardHeader } from "@/components/wayfinder/WayfinderDashboardHeader";
import { WfAlertBanner } from "@/components/wayfinder/wayfinder-dashboard-ui";
import { companionDashboardBase } from "@/lib/companion/dashboard-paths";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function CompanionWayfinderDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; err?: string; register?: string }>;
}) {
  const { tenant: tenantParam, err, register } = await searchParams;

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

      const tenantStatus = tenantId ? await getTenantStatus(context.env.DB, tenantId) : null;
      const writeLocked = tenantStatus === "suspended";

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
            tenantId ?? undefined
          );
        } catch (e: unknown) {
          console.error("wayfinder spots list error:", e);
          spotsLoadError =
            "스팟 목록을 불러오지 못했습니다. D1 마이그레이션 0033_wayfinder_spots.sql · 0041_wayfinder_spots_companion_scope.sql 적용 여부를 확인해 주세요.";
        }
      }

      const registerMode = register === "1" || Boolean(err);
      const publishedCount = spots.filter((s) => s.is_published).length;

      return (
        <div className="relative min-h-0 w-full min-w-0 overflow-x-hidden bg-[#F8FAFC] pb-8 font-outfit">
          <div className="pointer-events-none absolute left-0 top-0 h-[280px] w-full bg-gradient-to-b from-indigo-500/12 via-violet-500/5 to-transparent" aria-hidden />
          <div className="relative mx-auto w-full min-w-0 max-w-lg space-y-5 px-4 pt-6 sm:px-5 sm:pt-8">
            <nav className="flex items-center gap-2" aria-label="빠른 이동">
              <WfIconNavButton href="/hub" icon={LayoutGrid} label="허브·모드" tone="violet" />
              <WfIconNavButton href="/wayfinder" icon={TrainFront} label="공개 동행 안내" tone="indigo" external />
            </nav>

            {!registerMode ? (
              <WayfinderDashboardHeader spotCount={spots.length} publishedCount={publishedCount} />
            ) : null}

            {!wayfinderBeta ? (
              <WfAlertBanner variant="warning" icon={Power} compact title="동행 OFF">
                NEXT_PUBLIC_WAYFINDER_ENABLED=false
              </WfAlertBanner>
            ) : null}

            {writeLocked ? (
              <WfAlertBanner variant="warning" icon={Lock} compact>
                조직 이용 제한
              </WfAlertBanner>
            ) : null}

            {errMsg ? (
              <WfAlertBanner variant="error" icon={AlertCircle} compact title="오류">
                {errMsg}
              </WfAlertBanner>
            ) : null}

            {wayfinderBeta && !writeLocked ? (
              <WayfinderDashboardSpotSection
                tenantId={tenantId}
                tenantQs={tenantQs}
                spots={spots}
                spotsLoadError={spotsLoadError}
                sessionUserId={session.user.id}
                tenantRole={tenantRole}
                registerMode={registerMode}
              />
            ) : null}
          </div>
        </div>
      );
    } catch (dataError: unknown) {
      rethrowNextControlFlowErrors(dataError);
      console.error("linku-companion dashboard page data error:", dataError);
      redirect(`${companionDashboardBase()}${tenantQs}`);
    }
  } catch (error: unknown) {
    rethrowNextControlFlowErrors(error);
    console.error("linku-companion dashboard page auth error:", error);
    redirect("/login");
  }
}
