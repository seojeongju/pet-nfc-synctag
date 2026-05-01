import { getPetsWithDb } from "@/lib/pets-db";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { requireTenantMember } from "@/lib/tenant-membership";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import type { SubjectKind } from "@/lib/subject-kind";
import type { D1Database } from "@cloudflare/workers-types";
import { canUseModeFeature } from "@/lib/mode-visibility";
import { getTenantStatus } from "@/lib/tenant-status";
import { DashboardNfcQuickRegisterCard } from "@/components/dashboard/DashboardNfcQuickRegisterCard";
import Link from "next/link";
import { ArrowLeft, NotebookPen } from "lucide-react";

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
         AND p.subject_kind = ?
         AND t.pet_id IS NOT NULL`
    : `SELECT COUNT(*) AS count
       FROM tags t
       INNER JOIN pets p ON p.id = t.pet_id
       WHERE p.owner_id = ?
         AND p.tenant_id IS NULL
         AND p.subject_kind = ?
         AND t.pet_id IS NOT NULL`;

  const row = await (tenant
    ? db.prepare(query).bind(ownerId, tenant, subjectKind)
    : db.prepare(query).bind(ownerId, subjectKind)
  ).first<{ count?: number | string | null }>();

  const count = Number(row?.count ?? 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export default async function DashboardNfcDiaryPage({
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

      const [pets, tenantStatus] = await Promise.all([
        getPetsWithDb(context.env.DB, session.user.id, subjectKind, tenantId ?? undefined),
        tenantId ? getTenantStatus(context.env.DB, tenantId) : Promise.resolve<"active" | "suspended" | null>(null),
      ]);
      const linkedTagCount = await getLinkedTagCountByScope(
        context.env.DB,
        session.user.id,
        subjectKind,
        tenantId
      );

      const writeLocked = tenantStatus === "suspended" || !modeFeatureEnabled;

      return (
        <div className="relative min-h-0 w-full min-w-0 overflow-x-hidden bg-[#F8FAFC] pb-8 font-outfit">
          <div className="pointer-events-none absolute left-0 top-0 h-[240px] w-full bg-gradient-to-b from-teal-500/10 to-transparent" />
          <div className="relative mx-auto w-full min-w-0 max-w-lg space-y-6 px-4 pt-6 sm:px-5 sm:pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <Link
                href={`/dashboard/${subjectKind}${tenantQs}`}
                className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/80 hover:text-teal-800"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                대시보드 홈
              </Link>
            </div>

            <header className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-teal-700">
                <NotebookPen className="h-3.5 w-3.5" aria-hidden />
                NFC
              </div>
              <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-[26px]">NFC일기</h1>
              <p className="text-sm font-semibold leading-relaxed text-slate-600">
                {meta.label} 모드에서 태그 UID를 맞추고 프로필에 연결합니다. 모바일·데스크톱 너비에 맞춰 한 화면에서 진행해요.
              </p>
            </header>

            <DashboardNfcQuickRegisterCard
              subjectKind={subjectKind}
              subjects={pets}
              tenantId={tenantId}
              tenantSuspended={writeLocked}
              linkedTagCount={linkedTagCount}
              emptyRegisterHint={meta.emptyRegisterHint}
              subtitle="태그를 스캔하거나 UID를 입력해 연결하고, 태그 주소 기록까지 한 번에 진행해요."
            />
          </div>
        </div>
      );
    } catch (dataError: unknown) {
      rethrowNextControlFlowErrors(dataError);
      console.error("NFC diary page data error:", dataError);
      redirect(`/dashboard/${subjectKind}${tenantQs}`);
    }
  } catch (error: unknown) {
    rethrowNextControlFlowErrors(error);
    console.error("NFC diary page auth error:", error);
    redirect("/login");
  }
}
