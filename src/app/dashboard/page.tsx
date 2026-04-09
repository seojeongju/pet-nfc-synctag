import { getPetsWithDb } from "@/app/actions/pet";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { ComponentProps } from "react";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { parseSubjectKind } from "@/lib/subject-kind";
import { fetchVisibleAnnouncementsForGuardianWithDb } from "@/lib/mode-announcements-guardian";
import { requireTenantMember } from "@/lib/tenant-membership";
import { getTenantPlanUsageSummary, type TenantPlanUsageSummary } from "@/lib/tenant-quota";
import { getTenantStatus } from "@/lib/tenant-status";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { isNextRedirectError } from "@/lib/next-redirect-guard";

export const runtime = "edge";
/** 관리자 공지 저장 직후에도 최신 목록이 보이도록 캐시 사용 안 함 */
export const dynamic = "force-dynamic";

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
      getPetsWithDb(context.env.DB, session.user.id, subjectKind, tenantId ?? undefined),
      context.env.DB
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(session.user.id)
        .first<{ role?: string | null }>(),
      fetchVisibleAnnouncementsForGuardianWithDb(
        context.env.DB,
        session.user.id,
        subjectKind,
        tenantId ?? undefined
      ),
      tenantId ? getTenantPlanUsageSummary(context.env.DB, tenantId) : Promise.resolve<TenantPlanUsageSummary | null>(null),
      tenantId ? getTenantStatus(context.env.DB, tenantId) : Promise.resolve<"active" | "suspended" | null>(null),
    ]);

    const isAdmin = isPlatformAdminRole(roleRow?.role);

    return (
      <DashboardClient
        session={session}
        pets={(pets ?? []) as ComponentProps<typeof DashboardClient>["pets"]}
        isAdmin={isAdmin}
        subjectKind={subjectKind}
        modeAnnouncements={announcements}
        tenantId={tenantId}
        tenantUsage={tenantUsage}
        tenantSuspended={tenantStatus === "suspended"}
      />
    );
  } catch (error: unknown) {
    if (isNextRedirectError(error)) {
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
