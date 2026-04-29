import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { redirect } from "next/navigation";
import { FlowTopNav } from "@/components/layout/FlowTopNav";
import {
  PawPrint,
  UserRound,
  Baby,
  Briefcase,
  Gem,
  ChevronRight,
  Building2,
  CheckCircle2,
  CircleDashed,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { resolveDeviceAssignedKind } from "@/lib/device-mode";
import { listTenantsForUser } from "@/lib/tenant-membership";
import { resolvePersonalPlan } from "@/lib/plan-resolution";
import { getTenantPlanUsageSummary } from "@/lib/tenant-quota";
import {
  getUserStorageQuotaSummary,
  listActiveStorageAddonProducts,
  listUserStorageAddonSubscriptions,
} from "@/lib/storage-quota";
import { requestStorageAddonCheckout } from "@/app/actions/storage-billing";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { getUserConsentStatus } from "@/lib/privacy-consent";
import { getDashboardPathForUserTenant } from "@/lib/mode-visibility";
import type { D1Database } from "@cloudflare/workers-types";
import { isPasswordChangeRequired } from "@/lib/password-change";

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

function formatQuotaLabel(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    const text = Number.isInteger(gb) ? `${gb}` : gb.toFixed(1);
    return `${text}GB`;
  }
  return `${mb}MB`;
}

function formatKrw(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function formatSubscriptionStatus(status: "active" | "trialing" | "past_due" | "cancelled"): string {
  switch (status) {
    case "active":
      return "정상 이용중";
    case "trialing":
      return "체험중";
    case "past_due":
      return "결제 필요";
    case "cancelled":
      return "해지됨";
  }
}

async function getPersonalOnboardingProgress(
  db: D1Database,
  ownerId: string,
  subjectKind: SubjectKind | null
): Promise<{ subjectCount: number; linkedTagCount: number }> {
  if (!subjectKind) {
    return { subjectCount: 0, linkedTagCount: 0 };
  }

  const subjectRow = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM pets
       WHERE owner_id = ?
         AND tenant_id IS NULL
         AND COALESCE(subject_kind, 'pet') = ?`
    )
    .bind(ownerId, subjectKind)
    .first<{ count?: number | string | null }>();

  const linkedTagRow = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM tags t
       INNER JOIN pets p ON p.id = t.pet_id
       WHERE p.owner_id = ?
         AND p.tenant_id IS NULL
         AND COALESCE(p.subject_kind, 'pet') = ?
         AND t.pet_id IS NOT NULL`
    )
    .bind(ownerId, subjectKind)
    .first<{ count?: number | string | null }>();

  const subjectCount = Number(subjectRow?.count ?? 0);
  const linkedTagCount = Number(linkedTagRow?.count ?? 0);
  return {
    subjectCount: Number.isFinite(subjectCount) ? subjectCount : 0,
    linkedTagCount: Number.isFinite(linkedTagCount) ? linkedTagCount : 0,
  };
}

export default async function HubPage({
  searchParams,
}: {
  searchParams: Promise<{
    device?: string;
    uid?: string;
    onboarding?: string;
    kind?: string;
    billing_msg?: string;
  }>;
}) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }
  if (await isPasswordChangeRequired(context.env.DB, session.user.id)) {
    redirect("/force-password");
  }
  const consent = await getUserConsentStatus(session.user.id);
  if (!consent.hasRequired) {
    redirect(`/consent?next=${encodeURIComponent("/hub")}`);
  }

  const sp = await searchParams;
  const db = context.env.DB;
  const roleRow = await db
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  const isPlatformAdmin = isPlatformAdminRole(roleRow?.role);
  /** 정책: 모든 보호자에게 5개 모드 노출 */
  const hubVisibleKinds: SubjectKind[] = [...SUBJECT_KINDS];

  const isWelcomeOnboarding = sp.onboarding === "welcome";
  const billingMessage =
    typeof sp.billing_msg === "string" && sp.billing_msg.trim()
      ? decodeURIComponent(sp.billing_msg.trim())
      : null;
  const deviceHint =
    (typeof sp.device === "string" && sp.device.trim()) ||
    (typeof sp.uid === "string" && sp.uid.trim()) ||
    "";
  if (deviceHint) {
    const kind = await resolveDeviceAssignedKind(context.env.DB, deviceHint);
    if (kind) {
      redirect(`/dashboard/${encodeURIComponent(kind)}`);
    }
  }

  const tenants = await listTenantsForUser(db, session.user.id).catch(() => []);
  const personalPlan = await resolvePersonalPlan(db, session.user.id).catch(() => null);
  const storageQuota = await getUserStorageQuotaSummary(db, session.user.id).catch(() => null);
  const storageAddonProducts = await listActiveStorageAddonProducts(db).catch(() => []);
  const storageAddonSubscriptions = await listUserStorageAddonSubscriptions(db, session.user.id).catch(
    () => []
  );

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
  const tenantDashboardHrefs: Record<string, string> = Object.fromEntries(
    await Promise.all(
      tenants.map(async (t) => {
        const href = await getDashboardPathForUserTenant(db, session.user.id, t.id, {
          isPlatformAdmin,
        });
        return [t.id, href] as const;
      })
    )
  );
  let onboardingKind: SubjectKind | null =
    typeof sp.kind === "string" && (SUBJECT_KINDS as readonly string[]).includes(sp.kind)
      ? (sp.kind as SubjectKind)
      : null;
  const defaultOnboardingKind = hubVisibleKinds[0] ?? "pet";
  const onboardingDashboardHref = onboardingKind
    ? `/dashboard/${onboardingKind}`
    : `/dashboard/${defaultOnboardingKind}`;
  const onboardingRegisterHref = onboardingKind
    ? `/dashboard/${onboardingKind}/pets/new`
    : `/dashboard/${defaultOnboardingKind}/pets/new`;
  const onboardingProgress = await getPersonalOnboardingProgress(db, session.user.id, onboardingKind);
  const onboardingSteps = [
    {
      id: "mode",
      title: "모드 선택",
      done: Boolean(onboardingKind),
      href: "/hub",
      cta: "모드 고르기",
    },
    {
      id: "subject",
      title: "대상 등록",
      done: onboardingProgress.subjectCount > 0,
      href: onboardingRegisterHref,
      cta: "등록하기",
    },
    {
      id: "tag",
      title: "태그 연결",
      done: onboardingProgress.linkedTagCount > 0,
      href: onboardingDashboardHref + "?onboarding=nfc",
      cta: "연결하기",
    },
  ] as const;
  const onboardingDoneCount = onboardingSteps.filter((step) => step.done).length;

  async function requestAddonCheckoutAction(formData: FormData) {
    "use server";
    const productId = String(formData.get("product_id") ?? "").trim();
    if (!productId) {
      redirect("/hub?billing_msg=" + encodeURIComponent("상품 정보가 올바르지 않습니다."));
    }
    try {
      const result = await requestStorageAddonCheckout(productId);
      redirect(
        "/hub?billing_msg=" +
          encodeURIComponent(`구매 요청이 접수되었습니다. 요청 ID: ${result.intentId}`)
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "구매 요청 접수에 실패했습니다.";
      redirect("/hub?billing_msg=" + encodeURIComponent(message));
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      <FlowTopNav variant="landing" session={session} isAdmin={isPlatformAdmin} />
      <div className="px-4 min-[430px]:px-5 py-6 min-[430px]:py-8 pb-20">
      <div className="w-full max-w-none lg:max-w-screen-sm mx-auto space-y-6 min-[430px]:space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">
            링크유 Link-U
          </p>
          <h1 className="text-[30px] font-black text-slate-900 leading-tight tracking-tight">
            어떤 동행으로
            <br />
            <span className="text-teal-500">시작할까요?</span>
          </h1>
          <p className="text-base text-slate-500 font-medium leading-relaxed">
            돌봄과 연결을 위해 맞춤 화면이 달라요. 나중에 언제든 바꿀 수 있어요.
          </p>
          {personalPlan && (
            <p className="text-[11px] font-bold text-slate-400">
              개인 플랜: <span className="text-slate-600">{personalPlan.plan.name}</span>
              {personalPlan.source === "subscription" ? " · 구독" : " · 계정 설정"}
            </p>
          )}
          {storageQuota && (
            <p className="text-[11px] font-bold text-slate-400">
              앨범 저장공간:{" "}
              <span className="text-slate-600">
                {storageQuota.usedQuotaMb}MB / {storageQuota.effectiveQuotaMb}MB
              </span>
              {storageQuota.extraQuotaMb > 0 ? ` (추가 ${storageQuota.extraQuotaMb}MB)` : " (기본 512MB)"}
            </p>
          )}
        </header>

        {isWelcomeOnboarding && (
          <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 space-y-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">
              회원가입 완료
            </p>
            <h2 className="text-base font-black text-slate-900">
              환영합니다! 이제 첫 설정을 시작해 볼까요?
            </h2>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              먼저 모드를 선택하고, 대시보드에서 관리 대상을 등록한 뒤 NFC 태그를 연결하면 바로 사용할 수 있어요.
            </p>
            <div className="rounded-xl border border-teal-100 bg-white/90 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-slate-800">온보딩 진행도</p>
                <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-black text-teal-700">
                  {onboardingDoneCount}/3 완료
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${(onboardingDoneCount / 3) * 100}%` }}
                />
              </div>
              <div className="space-y-1.5">
                {onboardingSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {step.done ? (
                        <span
                          className="inline-flex shrink-0 origin-center animate-in fade-in zoom-in-95 duration-400"
                          style={{ animationDelay: `${index * 75}ms` }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                        </span>
                      ) : (
                        <CircleDashed className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      )}
                      <p className={`text-[11px] font-black ${step.done ? "text-teal-700" : "text-slate-700"}`}>
                        {step.done ? "완료" : "대기"} · {step.title}
                      </p>
                    </div>
                    {!step.done ? (
                      <a
                        href={step.href}
                        className="text-[10px] font-black text-teal-600 underline underline-offset-2"
                      >
                        {step.cta}
                      </a>
                    ) : (
                      <span className="text-[10px] font-black text-teal-600">완료</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={onboardingDashboardHref}
                className="rounded-xl bg-teal-600 px-4 py-2 text-[11px] font-black text-white hover:bg-teal-500"
              >
                대시보드로 이동
              </a>
              <a
                href={onboardingRegisterHref}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50"
              >
                첫 대상 등록하기
              </a>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 space-y-2">
          <p className="text-[10px] font-black uppercase text-teal-600">이용 순서</p>
          <ol className="text-xs font-semibold text-slate-600 space-y-1 list-decimal list-inside leading-relaxed">
            <li>
              아래에서 사용할 <strong className="text-slate-800">모드</strong>를 고릅니다.
            </li>
            <li>대시보드에서 관리 대상을 등록하고 NFC 태그를 연결합니다.</li>
            <li>조직(B2B)은 소속 조직 카드에서 관리·대시보드로 이동할 수 있습니다.</li>
          </ol>
        </section>

        <a
          href={`/shop?kind=${encodeURIComponent(hubVisibleKinds[0] ?? "pet")}`}
          className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-gradient-to-r from-white to-teal-50/90 p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
            <Store className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">스토어</p>
            <p className="text-[14px] font-black text-slate-900 leading-snug">모드 맞춤 상품 둘러보기</p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500 leading-snug">
              모드별 맞춤 상품을 볼 수 있어요.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
        </a>

        {billingMessage && (
          <section className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 shadow-sm">
            <p className="text-[12px] font-black text-teal-800 break-words">{billingMessage}</p>
          </section>
        )}

        {storageQuota && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">전자앨범 저장공간</p>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
                {storageQuota.usagePercent}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-out",
                  storageQuota.usagePercent >= 90
                    ? "bg-rose-500"
                    : storageQuota.usagePercent >= 75
                      ? "bg-amber-500"
                      : "bg-teal-500"
                )}
                style={{ width: `${storageQuota.usagePercent}%` }}
              />
            </div>
            <p className="text-[12px] font-semibold text-slate-600 leading-relaxed">
              사용량 {storageQuota.usedQuotaMb}MB / 총 {storageQuota.effectiveQuotaMb}MB · 남은 용량{" "}
              {storageQuota.freeQuotaMb}MB
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-700">
                기본 제공: {storageQuota.baseQuotaMb}MB
              </span>
              <span className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-1.5 text-[11px] font-black text-teal-700">
                추가 구매: {storageQuota.extraQuotaMb}MB
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
              전자앨범 업로드 시 사용량이 증가합니다. 추후 결제 연동 후 추가 용량 상품(+1GB/+3GB/+10GB)을 여기에서 구매할 수 있습니다.
            </p>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">내 추가 용량 구독</p>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
              {storageAddonSubscriptions.filter((s) => s.status === "active" || s.status === "trialing").length}건
            </span>
          </div>
          {storageAddonSubscriptions.length === 0 ? (
            <p className="text-[11px] font-bold text-slate-500">현재 활성/대기 중인 추가 용량 구독이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {storageAddonSubscriptions.map((sub) => {
                const isActive = sub.status === "active" || sub.status === "trialing";
                return (
                  <div
                    key={sub.id}
                    className={cn(
                      "rounded-xl border px-3 py-3",
                      isActive ? "border-teal-200 bg-teal-50/60" : "border-slate-200 bg-slate-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-black text-slate-800 break-words">{sub.productName}</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                          +{formatQuotaLabel(sub.extraQuotaMb)} · 월 {formatKrw(sub.monthlyPriceKrw)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-[10px] font-black",
                          sub.status === "active"
                            ? "bg-teal-100 text-teal-700"
                            : sub.status === "trialing"
                              ? "bg-indigo-100 text-indigo-700"
                              : sub.status === "past_due"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-200 text-slate-600"
                        )}
                      >
                        {formatSubscriptionStatus(sub.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold text-slate-500">
                      다음 갱신/종료 예정: {formatDateTime(sub.currentPeriodEnd)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">추가 용량 상품</p>
            <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-black text-teal-700">
              준비중
            </span>
          </div>
          <p className="text-[12px] font-semibold text-slate-600 leading-relaxed">
            기본 제공량 이후 더 저장하려면 월 구독으로 용량을 확장할 수 있습니다. 결제 연동 전 단계에서는 상품 확인만 가능합니다.
          </p>
          {storageAddonProducts.length === 0 ? (
            <p className="text-[11px] font-bold text-slate-500">등록된 추가 용량 상품이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {storageAddonProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-slate-800 break-words">{product.name}</p>
                    <p className="text-[10px] font-bold text-slate-500">
                      추가 {formatQuotaLabel(product.extraQuotaMb)} · 월 {formatKrw(product.monthlyPriceKrw)}
                    </p>
                  </div>
                  <form action={requestAddonCheckoutAction}>
                    <input type="hidden" name="product_id" value={product.id} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-[10px] font-black text-teal-700 hover:bg-teal-50"
                    >
                      구매 요청
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        {tenants.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              소속 조직 (B2B)
            </p>
            {(() => {
              const primaryTenant = tenants[0]!;
              const usage = tenantUsageMap[primaryTenant.id] ?? null;
              return (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 truncate">{primaryTenant.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {primaryTenant.role === "owner"
                        ? "소유자"
                        : primaryTenant.role === "admin"
                        ? "관리자"
                        : "멤버"}
                    </p>
                    {usage ? (
                      <p className="text-[10px] font-bold text-teal-700 mt-0.5">
                        {usage.planName} · 펫 {limitText(usage.petUsed, usage.petLimit)} · 태그{" "}
                        {limitText(usage.tagUsed, usage.tagLimit)}
                      </p>
                    ) : (
                      <p className="text-[10px] font-bold text-amber-600 mt-0.5">활성 조직 플랜 없음</p>
                    )}
                    {tenants.length > 1 ? (
                      <p className="text-[10px] font-bold text-teal-700 mt-1">
                        여러 조직에 소속된 경우, 각 조직에서 발급한 태그를 한 계정으로 함께 사용할 수 있어요.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {(primaryTenant.role === "owner" || primaryTenant.role === "admin") && (
                      <a
                        href="/hub/org/manage"
                        className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-[10px] font-black text-teal-700 hover:bg-teal-100"
                      >
                        조직 관리
                      </a>
                    )}
                    <a
                      href={
                        tenantDashboardHrefs[primaryTenant.id] ??
                        `/dashboard/pet?tenant=${encodeURIComponent(primaryTenant.id)}`
                      }
                      className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black text-white hover:bg-teal-600"
                    >
                      대시보드
                    </a>
                  </div>
                </div>
              );
            })()}
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              조직 대시보드에서는 등록 데이터가 <code className="text-[9px]">tenant_id</code>로 묶입니다.
              (개인 대시보드와 목록이 분리됩니다.)
            </p>
          </section>
        )}

        <nav className="space-y-3">
          {hubVisibleKinds.map((kind) => {
            const meta = subjectKindMeta[kind];
            const Icon = hubIcons[kind];
            return (
              <a
                key={kind}
                href={`/dashboard/${kind}`}
                className={cn(
                  "flex items-center gap-4 rounded-[24px] border border-slate-100 bg-white p-4 min-[430px]:p-5 shadow-sm",
                  "transition-all hover:border-teal-200 hover:shadow-md active:scale-[0.99]"
                )}
              >
                <div className="flex h-12 w-12 min-[430px]:h-14 min-[430px]:w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <Icon className="h-6 w-6 min-[430px]:h-7 min-[430px]:w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-slate-900 text-[15px] min-[430px]:text-base">{meta.label}</p>
                  <p className="text-[13px] text-slate-500 font-medium mt-0.5 leading-snug">{meta.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
              </a>
            );
          })}
        </nav>

        {isPlatformAdmin && (
          <a
            href="/admin"
            className="block rounded-2xl border border-slate-900 bg-slate-900 px-5 py-4 text-center text-sm font-black text-white"
          >
            플랫폼 관리자 콘솔
          </a>
        )}

        <p className="text-center text-[10px] text-slate-400 font-bold">
          로그아웃은 각 모드 대시보드 하단에서 할 수 있어요.
        </p>
      </div>
      </div>
    </div>
  );
}
