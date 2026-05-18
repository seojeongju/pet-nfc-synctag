import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { requireTenantMember, getMembership } from "@/lib/tenant-membership";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import { getTenantStatus } from "@/lib/tenant-status";
import { isWayfinderEnabled } from "@/lib/wayfinder/feature";
import { canMutateWayfinderSpot, getWayfinderSpotForDashboard } from "@/lib/wayfinder-spots-db";
import { WayfinderSpotQuickEdit } from "@/components/wayfinder/WayfinderSpotQuickEdit";
import { companionWayfinderPath } from "@/lib/companion/dashboard-paths";
import { WfIconNavButton } from "@/components/wayfinder/wayfinder-dashboard-ui";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function CompanionWayfinderSpotEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ spotId: string }>;
  searchParams: Promise<{ tenant?: string; err?: string }>;
}) {
  const { spotId } = await params;
  const { tenant: tenantParam, err } = await searchParams;

  const tenantId = typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;
  const wayfinderBeta = isWayfinderEnabled();

  const errMsg =
    err === "invalid"
      ? "입력을 확인해 주세요."
      : err === "forbidden"
        ? "권한이 없습니다."
        : err === "tenant_suspended"
          ? "조직 이용 제한"
          : err === "db"
            ? "저장 실패"
            : null;

  try {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/login");

    if (tenantId) {
      try {
        await requireTenantMember(context.env.DB, session.user.id, tenantId);
      } catch {
        notFound();
      }
    }

    const tenantStatus = tenantId ? await getTenantStatus(context.env.DB, tenantId) : null;
    const writeLocked = tenantStatus === "suspended";

    if (!wayfinderBeta || writeLocked) {
      redirect(`${companionWayfinderPath(tenantId)}`);
    }

    const spot = await getWayfinderSpotForDashboard(
      context.env.DB,
      spotId,
      session.user.id,
      tenantId ?? undefined
    );
    if (!spot) {
      notFound();
    }

    const tenantRole = tenantId ? await getMembership(context.env.DB, session.user.id, tenantId) : null;
    const canEdit = canMutateWayfinderSpot(session.user.id, spot, tenantId, tenantRole);
    const listHref = `${companionWayfinderPath(tenantId)}`;

    return (
      <div className="relative min-h-0 w-full min-w-0 overflow-x-hidden bg-[#F8FAFC] pb-8 font-outfit">
        <div className="pointer-events-none absolute left-0 top-0 h-[200px] w-full bg-gradient-to-b from-indigo-500/10 to-transparent" aria-hidden />
        <div className="relative mx-auto w-full min-w-0 max-w-lg space-y-4 px-4 pt-6 sm:px-5 sm:pt-8">
          <nav className="flex items-center gap-2">
            <WfIconNavButton href={listHref} icon={ArrowLeft} label="목록으로" tone="slate" />
          </nav>

          {errMsg ? (
            <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-700" role="alert">
              {errMsg}
            </p>
          ) : null}

          <WayfinderSpotQuickEdit spot={spot} tenantId={tenantId} listHref={listHref} canEdit={canEdit} />
        </div>
      </div>
    );
  } catch (e: unknown) {
    rethrowNextControlFlowErrors(e);
    console.error("wayfinder spot edit page error:", e);
    redirect(`${companionWayfinderPath(tenantId)}`);
  }
}
