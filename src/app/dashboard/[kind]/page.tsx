import { getPetsWithDb } from "@/lib/pets-db";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { parseSubjectKind } from "@/lib/subject-kind";
import { fetchVisibleAnnouncementsForGuardianWithDb } from "@/lib/mode-announcements-guardian";
import { requireTenantMember } from "@/lib/tenant-membership";
import { getTenantPlanUsageSummary, type TenantPlanUsageSummary } from "@/lib/tenant-quota";
import { getTenantStatus } from "@/lib/tenant-status";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import {
  getEffectiveAllowedSubjectKinds,
  isSubjectKindAllowedForTenant,
} from "@/lib/mode-visibility";
import { getScanLogsCountWithDb } from "@/lib/scan-logs-db";
import type { SubjectKind } from "@/lib/subject-kind";
import type { D1Database } from "@cloudflare/workers-types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

async function getLinkedTagCountByScope(
  db: D1Database,
  ownerId: string,
  subjectKind: SubjectKind,
  tenantId?: string | null
): Promise<number> {
  const tenant = (tenantId ?? "").trim();
  const query = tenant
    ? `SELECT COUNT(*) AS count
       FROM tags t
       INNER JOIN pets p ON p.id = t.pet_id
       WHERE p.owner_id = ?
         AND p.tenant_id = ?
         AND COALESCE(p.subject_kind, 'pet') = ?
         AND t.pet_id IS NOT NULL`
    : `SELECT COUNT(*) AS count
       FROM tags t
       INNER JOIN pets p ON p.id = t.pet_id
       WHERE p.owner_id = ?
         AND p.tenant_id IS NULL
         AND COALESCE(p.subject_kind, 'pet') = ?
         AND t.pet_id IS NOT NULL`;

  const row = await (tenant
    ? db.prepare(query).bind(ownerId, tenant, subjectKind)
    : db.prepare(query).bind(ownerId, subjectKind)
  ).first<{ count?: number | string | null }>();

  const count = Number(row?.count ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export default async function DashboardKindPage({
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

      if (!isAdmin) {
        const allowed = await getEffectiveAllowedSubjectKinds(context.env.DB, session.user.id, {
          isPlatformAdmin: false,
        });
        if (!allowed.includes(subjectKind)) {
          redirect("/hub");
        }
        if (tenantId) {
          const tenantOk = await isSubjectKindAllowedForTenant(
            context.env.DB,
            tenantId,
            subjectKind
          );
          if (!tenantOk) {
            redirect("/hub");
          }
        }
      }

      const [pets, announcements, tenantUsage, tenantStatus] = await Promise.all([
        getPetsWithDb(context.env.DB, session.user.id, subjectKind, tenantId ?? undefined),
        fetchVisibleAnnouncementsForGuardianWithDb(
          context.env.DB,
          session.user.id,
          subjectKind,
          tenantId ?? undefined
        ),
        tenantId ? getTenantPlanUsageSummary(context.env.DB, tenantId) : Promise.resolve<TenantPlanUsageSummary | null>(null),
        tenantId ? getTenantStatus(context.env.DB, tenantId) : Promise.resolve<"active" | "suspended" | null>(null),
      ]);
      const [linkedTagCount, petScanLogCount] = await Promise.all([
        getLinkedTagCountByScope(context.env.DB, session.user.id, subjectKind, tenantId),
        subjectKind === "pet"
          ? getScanLogsCountWithDb(
              context.env.DB,
              session.user.id,
              "pet",
              tenantId ?? undefined
            )
          : Promise.resolve(0),
      ]);

      return (
        <DashboardClient
          session={session}
          pets={pets}
          isAdmin={isAdmin}
          subjectKind={subjectKind}
          modeAnnouncements={announcements}
          tenantId={tenantId}
          tenantUsage={tenantUsage}
          tenantSuspended={tenantStatus === "suspended"}
          linkedTagCount={linkedTagCount}
          petScanLogCount={petScanLogCount}
        />
      );
    } catch (dataError: unknown) {
      rethrowNextControlFlowErrors(dataError);
      console.error("Dashboard kind data fetch error:", dataError);
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
          linkedTagCount={0}
          petScanLogCount={0}
        />
      );
    }
  } catch (error: unknown) {
    rethrowNextControlFlowErrors(error);
    console.error("Dashboard kind auth / init error:", error);
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center font-outfit">
        <p className="text-lg font-black text-slate-900">대시보드를 불러오지 못했습니다</p>
        <p className="text-sm leading-relaxed text-slate-600">
          잠시 후 다시 시도하거나 로그인 화면으로 돌아가 주세요.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href={`/dashboard/${subjectKind}${tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : ""}`}
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
