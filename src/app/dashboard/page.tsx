import { getPetsWithDb } from "@/lib/pets-db";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
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
    } catch (dataError: unknown) {
      if (isNextRedirectError(dataError)) {
        throw dataError;
      }
      console.error("Dashboard data fetch error:", dataError);
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
  } catch (error: unknown) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("Dashboard auth / init error:", error);

    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center font-outfit">
        <p className="text-lg font-black text-slate-900">대시보드를 불러오지 못했습니다</p>
        <p className="text-sm leading-relaxed text-slate-600">
          잠시 후 다시 시도하거나 로그인 화면으로 돌아가 주세요. 문제가 이어지면 Cloudflare 로그와{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">/api/diag</code> 응답을 확인해 주세요.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href={`/dashboard?kind=${subjectKind}${tenantId ? `&tenant=${encodeURIComponent(tenantId)}` : ""}`}
            className="rounded-full bg-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-100 hover:bg-teal-600"
          >
            다시 시도
          </a>
          <a
            href="/login"
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            로그인
          </a>
        </div>
      </div>
    );
  }
}
