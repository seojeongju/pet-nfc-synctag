import { PetForm } from "@/components/PetForm";
import { ArrowLeft, PawPrint, UserRound, Baby, Briefcase, Gem } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { redirect } from "next/navigation";
import { parseSubjectKind, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { requireTenantMember } from "@/lib/tenant-membership";
import { isTenantSuspendedSafe } from "@/lib/tenant-status";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { canUseModeFeature } from "@/lib/mode-visibility";
import { isPlatformAdminRole } from "@/lib/platform-admin";

export const runtime = "edge";

const headerIcons: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

function newPetLoadFailed(kindQs: string, dashboardLink: string, listLink: string, Icon: LucideIcon) {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-2 py-16 text-center font-outfit">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-400">
        <Icon className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-black text-slate-900">등록 화면을 불러오지 못했어요</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          잠시 후 다시 시도해 주세요. 문제가 계속되면 Worker 로그와 D1 상태를 확인해 주세요.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href={dashboardLink}
          className={cn(
            buttonVariants({}),
            "rounded-full bg-teal-500 font-bold shadow-lg shadow-teal-100 hover:bg-teal-600"
          )}
        >
          대시보드로
        </a>
        <a
          href={listLink}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-full border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
          )}
        >
          목록으로
        </a>
      </div>
    </div>
  );
}

export default async function NewPetPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ tenant?: string }>;
}) {
  let kindQs = "?kind=pet";
  let dashboardLink = "/dashboard/pet";
  let listLink = "/dashboard/pet/pets";
  let HeaderIcon: LucideIcon = PawPrint;

  try {
    const { kind: kindParam } = await params;
    const { tenant: tenantParam } = await searchParams;
    const subjectKind = parseSubjectKind(kindParam);
    const meta = subjectKindMeta[subjectKind];
    const tenantId =
      typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;
    
    const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
    kindQs = tenantQs;
    dashboardLink = `/dashboard/${subjectKind}${tenantQs}`;
    listLink = `/dashboard/${subjectKind}/pets${tenantQs}`;

    HeaderIcon = headerIcons[subjectKind];

    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/login");
    }

    if (tenantId) {
      try {
        await requireTenantMember(context.env.DB, session.user.id, tenantId);
      } catch {
        return (
          <div className="mx-auto max-w-lg space-y-6 px-2 py-16 text-center font-outfit">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <HeaderIcon className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900">이 조직에 접근할 수 없어요</h1>
              <p className="text-sm leading-relaxed text-slate-600">
                초대·멤버십을 확인하거나 다른 모드로 이동해 주세요.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={dashboardLink}
                className={cn(
                  buttonVariants({}),
                  "rounded-full bg-teal-500 font-bold shadow-lg shadow-teal-100 hover:bg-teal-600"
                )}
              >
                대시보드로
              </a>
            </div>
          </div>
        );
      }
    }

    const tenantSuspended = await isTenantSuspendedSafe(context.env.DB, tenantId);
    const roleRow = await context.env.DB
      .prepare("SELECT role FROM user WHERE id = ?")
      .bind(session.user.id)
      .first<{ role?: string | null }>();
    const modeWriteLocked =
      !(await canUseModeFeature(context.env.DB, session.user.id, subjectKind, {
        isPlatformAdmin: isPlatformAdminRole(roleRow?.role),
        tenantId,
      }));
    const writeLocked = tenantSuspended || modeWriteLocked;
    const ownerId = session.user.id;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-outfit pb-12">
        <div className="bg-white px-6 pt-10 pb-12 rounded-b-[48px] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between mb-8">
            <a href={listLink}>
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-800 hover:bg-teal-50 hover:text-teal-600 transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </div>
            </a>
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-200">
              <HeaderIcon className="w-6 h-6" />
            </div>
          </div>

          <div className="relative z-10 space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900">{meta.registerTitle}</h1>
            <p className="text-slate-400 font-medium">{meta.registerSubtitle}</p>
          </div>
        </div>

        <div className="flex-1 container max-w-sm mx-auto mt-8 px-4">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50">
            <PetForm
              ownerId={ownerId}
              subjectKind={subjectKind}
              tenantId={tenantId}
              writeLocked={writeLocked}
            />
          </div>

          <div className="mt-8 text-center px-6">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed">
              정보를 정확하게 입력하시면 발견 시 <br /> 훨씬 더 빠르게 연락을 받으실 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error: unknown) {
    rethrowNextControlFlowErrors(error);
    console.error("[dashboard/pets/new] unexpected:", error);
    return newPetLoadFailed(kindQs, dashboardLink, listLink, HeaderIcon);
  }
}
