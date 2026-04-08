import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PawPrint, UserRound, Baby, Briefcase, Gem, ChevronRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { resolveDeviceAssignedKind } from "@/lib/device-mode";
import { listTenantsForUser } from "@/lib/tenant-membership";
import { resolvePersonalPlan } from "@/lib/plan-resolution";
import { getTenantPlanUsageSummary } from "@/lib/tenant-quota";

export const runtime = "edge";

const hubIcons: Record<SubjectKind, typeof PawPrint> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

function limitText(used: number, limit: number | null): string {
  return `${used}/${limit == null ? "∞" : limit}`;
}

export default async function HubPage({
  searchParams,
}: {
  searchParams: Promise<{ device?: string; uid?: string }>;
}) {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const sp = await searchParams;
  const deviceHint =
    (typeof sp.device === "string" && sp.device.trim()) ||
    (typeof sp.uid === "string" && sp.uid.trim()) ||
    "";
  if (deviceHint) {
    const kind = await resolveDeviceAssignedKind(context.env.DB, deviceHint);
    if (kind) {
      redirect(`/dashboard?kind=${encodeURIComponent(kind)}`);
    }
  }

  const db = context.env.DB;
  const roleRow = await db
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  const isAdmin = roleRow?.role === "admin";

  const tenants = await listTenantsForUser(db, session.user.id).catch(() => []);
  const personalPlan = await resolvePersonalPlan(db, session.user.id).catch(() => null);

  const tenantUsageEntries = await Promise.all(
    tenants.map(async (t) => {
      const usage = await getTenantPlanUsageSummary(db, t.id).catch(() => null);
      return [t.id, usage] as const;
    })
  );
  const tenantUsageMap = Object.fromEntries(tenantUsageEntries) as Record<
    string,
    Awaited<ReturnType<typeof getTenantPlanUsageSummary>>
  >;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit px-5 py-10 pb-24">
      <div className="max-w-md mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">
            링크유 Link-U
          </p>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            어떤 동행으로
            <br />
            <span className="text-teal-500">시작할까요?</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            돌봄과 연결을 위해 맞춤 화면이 달라요. 나중에 언제든 바꿀 수 있어요.
          </p>
          {personalPlan && (
            <p className="text-[11px] font-bold text-slate-400">
              개인 플랜: <span className="text-slate-600">{personalPlan.plan.name}</span>
              {personalPlan.source === "subscription" ? " · 구독" : " · 계정 설정"}
            </p>
          )}
          <Link
            href="/hub/org/new"
            className="inline-flex items-center gap-1 text-xs font-black text-teal-600 hover:text-teal-700"
          >
            조직 만들기 (B2B)
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        {tenants.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              소속 조직 (B2B)
            </p>
            <div className="space-y-2">
              {tenants.map((t) => {
                const usage = tenantUsageMap[t.id] ?? null;
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-900 truncate">{t.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {t.role === "owner" ? "소유자" : t.role === "admin" ? "관리자" : "멤버"}
                      </p>
                      {usage ? (
                        <p className="text-[10px] font-bold text-teal-700 mt-0.5">
                          {usage.planName} · 펫 {limitText(usage.petUsed, usage.petLimit)} · 태그 {limitText(usage.tagUsed, usage.tagLimit)}
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold text-amber-600 mt-0.5">활성 조직 플랜 없음</p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard?kind=pet&tenant=${encodeURIComponent(t.id)}`}
                      className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black text-white hover:bg-teal-600"
                    >
                      대시보드
                    </Link>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              조직 대시보드에서는 등록 데이터가 <code className="text-[9px]">tenant_id</code>로 묶입니다.
              (개인 대시보드와 목록이 분리됩니다.)
            </p>
          </section>
        )}

        <nav className="space-y-3">
          {SUBJECT_KINDS.map((kind) => {
            const meta = subjectKindMeta[kind];
            const Icon = hubIcons[kind];
            return (
              <Link
                key={kind}
                href={`/dashboard?kind=${kind}`}
                className={cn(
                  "flex items-center gap-4 rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm",
                  "transition-all hover:border-teal-200 hover:shadow-md active:scale-[0.99]"
                )}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-slate-900">{meta.label}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{meta.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <Link
            href="/admin"
            className="block rounded-2xl border border-slate-900 bg-slate-900 px-5 py-4 text-center text-sm font-black text-white"
          >
            관리자 콘솔
          </Link>
        )}

        <p className="text-center text-[10px] text-slate-400 font-bold">
          로그아웃은 각 모드 대시보드 하단에서 할 수 있어요.
        </p>
      </div>
    </div>
  );
}
