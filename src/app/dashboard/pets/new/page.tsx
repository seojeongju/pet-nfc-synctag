import { PetForm } from "@/components/PetForm";
import { ArrowLeft, PawPrint, UserRound, Baby, Briefcase, Gem } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { redirect } from "next/navigation";
import { parseSubjectKind, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { requireTenantMember } from "@/lib/tenant-membership";
import { getTenantStatus } from "@/lib/tenant-status";

export const runtime = "edge";

const headerIcons: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

export default async function NewPetPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; tenant?: string }>;
}) {
  const { kind: kindParam, tenant: tenantParam } = await searchParams;
  const subjectKind = parseSubjectKind(kindParam);
  const meta = subjectKindMeta[subjectKind];
  const tenantId =
    typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;
  const qs = new URLSearchParams({ kind: subjectKind });
  if (tenantId) qs.set("tenant", tenantId);
  const kindQs = `?${qs.toString()}`;
  const HeaderIcon = headerIcons[subjectKind];

  const context = getRequestContext();
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
  const tenantSuspended = tenantId
    ? (await getTenantStatus(context.env.DB, tenantId)) === "suspended"
    : false;

  const ownerId = session.user.id;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit pb-12">
      <div className="bg-white px-6 pt-10 pb-12 rounded-b-[48px] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between mb-8">
          <Link href={`/dashboard/pets${kindQs}`}>
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-800 hover:bg-teal-50 hover:text-teal-600 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </div>
          </Link>
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
            writeLocked={tenantSuspended}
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
}
