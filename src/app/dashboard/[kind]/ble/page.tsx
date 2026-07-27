import { getPetsWithDb } from "@/lib/pets-db";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { requireTenantMember } from "@/lib/tenant-membership";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import { canUseModeFeature } from "@/lib/mode-visibility";
import { getTenantStatus } from "@/lib/tenant-status";
import {
  getDashboardBlePageDescription,
  getDashboardBlePageTitle,
} from "@/lib/dashboard-ble-nav-label";
import { isBleCompanionEnabled } from "@/lib/ble-companion-feature";
import { listGuardianBleCompanionTargets } from "@/app/actions/tag";
import { DashboardBleCompanionCard } from "@/components/dashboard/DashboardBleCompanionCard";
import Link from "next/link";
import { ArrowLeft, Bluetooth } from "lucide-react";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function DashboardBleCompanionPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ tenant?: string }>;
}) {
  if (!isBleCompanionEnabled()) {
    notFound();
  }

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

    const [pets, tenantStatus, targets] = await Promise.all([
      getPetsWithDb(context.env.DB, session.user.id, subjectKind, tenantId ?? undefined),
      tenantId ? getTenantStatus(context.env.DB, tenantId) : Promise.resolve<"active" | "suspended" | null>(null),
      listGuardianBleCompanionTargets(subjectKind, tenantId),
    ]);

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
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">
              <Bluetooth className="h-3.5 w-3.5" aria-hidden />
              BLE
            </div>
            <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-[26px]">
              {getDashboardBlePageTitle()}
            </h1>
            <p className="text-sm font-semibold leading-relaxed text-slate-600">
              {getDashboardBlePageDescription(meta.label)}
            </p>
          </header>

          <DashboardBleCompanionCard
            subjectKind={subjectKind}
            subjects={pets.map((p) => ({ id: p.id, name: p.name }))}
            targets={targets}
            tenantId={tenantId}
            tenantSuspended={writeLocked}
            emptyRegisterHint={meta.emptyRegisterHint}
          />
        </div>
      </div>
    );
  } catch (e) {
    rethrowNextControlFlowErrors(e);
    throw e;
  }
}
