import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Database,
  Globe2,
  Layers,
  PenTool,
  ReceiptText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { platformServiceIcons } from "@/components/platform/service-icons";
import { resolveAdminScope } from "@/lib/admin-authz";
import { getPlatformOverview } from "@/lib/admin-platform-data";
import { getDB } from "@/lib/db";
import { PLATFORM_SERVICES, platformServiceStatusLabel } from "@/lib/platform/services";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

export const runtime = "edge";

export default async function AdminIntegratedDashboardPage() {
  const scope = await resolveAdminScope("admin");
  if (!scope.actor.isPlatformAdmin) {
    redirect("/admin/shop/orders");
  }
  const o = await getPlatformOverview(getDB());

  const kpis: Array<{ label: string; value: number; sub: string; icon: LucideIcon; href: string; accent: string }> = [
    { label: "전체 사용자", value: o.users, sub: "가입 계정", icon: Users, href: "/admin/users", accent: "text-sky-600 bg-sky-50" },
    {
      label: "NFC 태그",
      value: o.tags.total,
      sub: `활성 ${o.tags.active.toLocaleString()} · 미판매 ${o.tags.unsold.toLocaleString()}`,
      icon: Database,
      href: "/admin/nfc-tags/inventory",
      accent: "text-amber-600 bg-amber-50",
    },
    {
      label: "Link-U 관리 대상",
      value: o.linkuSubjects,
      sub: "펫·메모리·키즈·러기지·골드",
      icon: ShieldCheck,
      href: "/admin/linku",
      accent: "text-teal-600 bg-teal-50",
    },
    {
      label: "대기 주문",
      value: o.shop.pendingOrders,
      sub: `전체 ${o.shop.totalOrders.toLocaleString()}건`,
      icon: ReceiptText,
      href: "/admin/shop/orders",
      accent: "text-violet-600 bg-violet-50",
    },
  ];

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe)}>
      <AdminPageIntro
        title="Link-U 통합 대시보드"
        subtitle="모든 NFC 서비스와 태그·스튜디오·주문 현황을 한곳에서 확인합니다."
        crumbs={[{ label: "통합 관리자" }]}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link key={k.label} href={k.href} prefetch={false} className={cn(adminUi.kpiCard, "group border transition hover:border-teal-200")}>
              <div className="flex items-center justify-between">
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", k.accent)}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-teal-500" aria-hidden />
              </div>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{k.label}</p>
              <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-slate-900 sm:text-3xl">{k.value.toLocaleString()}</p>
              <p className="mt-1 truncate text-[11px] font-bold text-slate-500">{k.sub}</p>
            </Link>
          );
        })}
      </section>

      <section className={cn(adminUi.sectionCard, "border p-5 sm:p-8")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/20">
              <Globe2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">서비스 현황</h2>
              <p className="text-[11px] font-bold text-slate-500">플랫폼에 등록된 NFC 서비스</p>
            </div>
          </div>
          <Link
            href="/admin/platform/services"
            prefetch={false}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 hover:border-teal-200 hover:text-teal-700"
          >
            <Layers className="h-3.5 w-3.5" aria-hidden />
            서비스 관리
          </Link>
        </div>
        <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_SERVICES.map((s) => {
            const Icon = platformServiceIcons[s.id];
            const live = s.status === "live";
            const href = s.id === "linku" ? "/admin/linku" : "/admin/platform/services";
            return (
              <li key={s.id}>
                <Link
                  href={href}
                  prefetch={false}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/50"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      live ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-black text-slate-900">{s.name}</span>
                    <span className="block truncate text-[11px] font-bold text-slate-400">{s.tagline}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black",
                      live ? adminUi.successBadge : adminUi.neutralBadge
                    )}
                  >
                    {platformServiceStatusLabel[s.status]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={cn(adminUi.sectionCard, "border p-5 sm:p-8")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <PenTool className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">태그 스튜디오</h2>
              <p className="text-[11px] font-bold text-slate-500">고객 커스텀 태그 디자인·제작 요청</p>
            </div>
          </div>
          <Link
            href="/admin/platform/studio"
            prefetch={false}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 hover:border-teal-200 hover:text-teal-700"
          >
            전체 보기
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {o.studio ? (
          <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["draft", "작성 중"],
                ["ready", "디자인 완료"],
                ["requested", "제작 요청"],
                ["locked", "제작 중"],
              ] as const
            ).map(([key, label]) => (
              <Link
                key={key}
                href={`/admin/platform/studio?status=${key}`}
                prefetch={false}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition hover:border-teal-200"
              >
                <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</dt>
                <dd className="mt-1 text-xl font-black tabular-nums text-slate-900">{o.studio![key].toLocaleString()}</dd>
              </Link>
            ))}
          </dl>
        ) : (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold text-amber-800">
            스튜디오 테이블이 아직 없습니다. 운영 DB에 <code className="font-mono">npm run d1:apply:tag-designs</code>를 적용해 주세요.
          </p>
        )}
      </section>
    </div>
  );
}
