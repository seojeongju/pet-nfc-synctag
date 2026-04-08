import { getPets } from "@/app/actions/pet";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRequestContext } from "@cloudflare/next-on-pages";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { parseSubjectKind } from "@/lib/subject-kind";
import { listVisibleAnnouncementsForGuardian } from "@/app/actions/mode-announcements";
import { requireTenantMember } from "@/lib/tenant-membership";
import { getTenantPlanUsageSummary, type TenantPlanUsageSummary } from "@/lib/tenant-quota";
import { getTenantStatus } from "@/lib/tenant-status";

export const runtime = "edge";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; tenant?: string }>;
}) {
  const { kind: kindParam, tenant: tenantParam } = await searchParams;
  const subjectKind = parseSubjectKind(kindParam);
  const tenantId = typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;
  const context = getRequestContext();
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

    const [pets, roleRow, announcements, tenantUsage, tenantStatus] = await Promise.all([
      getPets(session.user.id, subjectKind, tenantId ?? undefined),
      context.env.DB
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(session.user.id)
        .first<{ role?: string | null }>(),
      listVisibleAnnouncementsForGuardian(session.user.id, subjectKind),
      tenantId ? getTenantPlanUsageSummary(context.env.DB, tenantId) : Promise.resolve<TenantPlanUsageSummary | null>(null),
      tenantId ? getTenantStatus(context.env.DB, tenantId) : Promise.resolve<"active" | "suspended" | null>(null),
    ]);

    const isAdmin = roleRow?.role === "admin";

    return (
      <DashboardClient
        session={session}
        pets={(pets as any) || []}
        isAdmin={isAdmin}
        subjectKind={subjectKind}
        modeAnnouncements={announcements}
        tenantId={tenantId}
        tenantUsage={tenantUsage}
        tenantSuspended={tenantStatus === "suspended"}
      />
    );
  } catch (error: unknown) {
    const redirectError = error as { digest?: string };
    if (redirectError.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Dashboard data fetch error:", error);

    return (
      <DashboardClient
        session={session}
        pets={[]}
        isAdmin={false}
        subjectKind={subjectKind}
        modeAnnouncements={[]}
        tenantId={tenantId}
        tenantUsage={null}
        tenantSuspended={false}
      />
    );
  }
}
