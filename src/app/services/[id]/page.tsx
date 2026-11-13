import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Nfc, PenTool } from "lucide-react";
import { PlatformTopNav } from "@/components/platform/PlatformTopNav";
import { platformServiceIcons } from "@/components/platform/service-icons";
import { getLandingSessionState } from "@/lib/landing-session";
import { formFactorsForService } from "@/lib/platform/form-factors";
import { getPlatformService, platformServiceStatusLabel } from "@/lib/platform/services";
import { buildPublicMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const runtime = "edge";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const service = getPlatformService(id);
  if (!service) return {};
  return buildPublicMetadata({
    title: `${service.name} | 링크유 Link-U`,
    description: service.description,
    path: `/services/${service.id}`,
  });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params;
  const service = getPlatformService(id);
  if (!service) notFound();

  const { session } = await getLandingSessionState();
  const Icon = platformServiceIcons[service.id];
  const live = service.status === "live";
  const formFactors = formFactorsForService(service.id);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-rose-50/45 via-amber-50/35 to-slate-50 font-outfit">
      <PlatformTopNav isLoggedIn={Boolean(session)} />
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-rose-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-[15%] h-64 w-64 rounded-full bg-teal-200/30 blur-3xl" />

      <main className="relative z-10 mx-auto flex w-full max-w-screen-sm flex-col gap-5 px-4 pb-10 pt-7 min-[430px]:px-5 lg:grid lg:max-w-6xl lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-8 lg:px-8 lg:pb-16 lg:pt-12">
        <section className="rounded-[32px] border border-rose-100/80 bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.10)] min-[390px]:p-6 lg:rounded-[40px] lg:p-10">
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                live ? "bg-teal-500 text-white" : "bg-teal-50 text-teal-600"
              )}
            >
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black",
                live ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"
              )}
            >
              {platformServiceStatusLabel[service.status]}
            </span>
          </div>
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">링크유 서비스</p>
          <h1 className="mt-1 text-[26px] font-black leading-tight tracking-tight text-slate-900 break-keep [word-break:keep-all] lg:text-[40px]">
            {service.name}
          </h1>
          <p className="mt-1 text-sm font-black text-teal-600">{service.tagline}</p>
          <p className="mt-3 text-[13px] font-semibold leading-relaxed text-slate-600 break-keep [word-break:keep-all]">
            {service.description}
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {service.examples.map((ex) => (
              <li key={ex} className="rounded-full bg-teal-50/70 px-2.5 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-teal-100">
                {ex}
              </li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-1 gap-2 lg:mt-8 lg:flex lg:flex-wrap lg:gap-3">
            {service.entryPath ? (
              <Link
                href={service.entryPath}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
              >
                서비스 시작하기
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
            {service.customizable ? (
              <Link
                href={`/studio?service=${service.id}`}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-black shadow-sm transition active:scale-[0.98]",
                  service.entryPath
                    ? "border border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-teal-700"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                )}
              >
                <PenTool className="h-4 w-4" aria-hidden />
                이 서비스로 태그 만들기
              </Link>
            ) : null}
          </div>
          {!live ? (
            <p className="mt-3 text-center text-[11px] font-semibold text-slate-400 break-keep [word-break:keep-all]">
              서비스 화면은 준비 중입니다. 태그 디자인과 제작 요청은 먼저 받아 두고, 서비스가 열리면 태그에 기능을 연결해 드립니다.
            </p>
          ) : null}
        </section>

        <div className="flex flex-col gap-5 lg:sticky lg:top-24">
        {formFactors.length > 0 ? (
          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-[18px] shadow-sm min-[390px]:p-5">
            <p className="text-[11px] font-black tracking-wider text-teal-600">제작 가능한 태그</p>
            <ul className="mt-3 grid grid-cols-1 gap-2">
              {formFactors.map((f) => (
                <li key={f.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <Nfc className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900">{f.name}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500 break-keep [word-break:keep-all]">
                      {f.widthMm}×{f.heightMm}×{f.thicknessMm}mm · {f.chip.type} · {f.basePriceKrw.toLocaleString("ko-KR")}원부터
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-[26px] border border-teal-100/90 bg-gradient-to-br from-teal-50/95 to-white p-[18px] min-[390px]:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">이렇게 사용해요</p>
          <ol className="mt-3 space-y-2">
            {["서비스에 맞는 태그 모양을 고르고 디자인합니다.", "3D로 미리 보고 견적을 받아 제작을 요청합니다.", "태그를 받으면 휴대폰을 대어 바로 사용합니다."].map(
              (t) => (
                <li key={t} className="flex items-start gap-2 text-[12px] font-semibold text-slate-600 break-keep [word-break:keep-all]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" aria-hidden />
                  {t}
                </li>
              )
            )}
          </ol>
        </section>
        </div>
      </main>
    </div>
  );
}
