import Link from "next/link";
import { ArrowRight, Check, LayoutTemplate, PenTool, Trash2 } from "lucide-react";
import { PlatformTopNav } from "@/components/platform/PlatformTopNav";
import { platformServiceIcons } from "@/components/platform/service-icons";
import { createTagDesignFromTemplateAction, deleteTagDesignAction, listMyTagDesigns } from "@/app/actions/studio";
import { getLandingSessionState } from "@/lib/landing-session";
import { getDB } from "@/lib/db";
import { getFormFactor } from "@/lib/platform/form-factors";
import { PLATFORM_SERVICES, getPlatformService } from "@/lib/platform/services";
import { listTemplatesForService } from "@/lib/platform/tag-templates-store";
import { formatDateTimeKoSeoul } from "@/lib/format-datetime-ko-seoul";
import { buildPublicMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const runtime = "edge";

export const metadata = buildPublicMetadata({
  title: "태그 스튜디오 | 링크유 Link-U",
  description: "서비스를 고르고 템플릿으로 나만의 NFC 태그를 디자인하세요. 문구·이미지·색을 바꾸며 3D로 확인합니다.",
  path: "/studio",
});

const statusLabel: Record<string, string> = {
  draft: "작성 중",
  ready: "디자인 완료",
  requested: "제작 요청됨",
  locked: "제작 중",
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; template?: string; form?: string }>;
}) {
  const sp = await searchParams;
  const { session } = await getLandingSessionState();
  const selectedService = sp.service ? getPlatformService(sp.service) : null;
  const templates = selectedService ? await listTemplatesForService(getDB(), selectedService.id).catch(() => []) : [];
  const myDesigns = session ? await listMyTagDesigns().catch(() => []) : [];
  const step: 1 | 2 | 3 | 4 = selectedService ? 2 : 1;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-rose-50/45 via-amber-50/35 to-slate-50 font-outfit">
      <PlatformTopNav isLoggedIn={Boolean(session)} />
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-rose-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-[40%] h-64 w-64 rounded-full bg-amber-200/35 blur-3xl" />

      <main className="relative z-10 mx-auto flex w-full max-w-screen-sm flex-col gap-5 px-4 pb-10 pt-7 min-[430px]:px-5 lg:max-w-4xl lg:gap-6 lg:px-8 lg:pt-12">
        <header className="rounded-3xl border border-teal-100 bg-gradient-to-br from-white via-teal-50/45 to-white px-5 py-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">링크유 태그 스튜디오</p>
          <h1 className="mt-1 text-[28px] font-black leading-tight tracking-tight text-slate-900">
            어떤 태그를
            <br />
            <span className="text-teal-500">만들어 볼까요?</span>
          </h1>
          <p className="mt-2 text-[13px] font-semibold leading-relaxed text-slate-600 break-keep [word-break:keep-all]">
            서비스를 고르면 맞는 템플릿이 나옵니다. 템플릿을 고른 뒤 문구·이미지·색을 바꾸며 3D로 확인하세요.
          </p>
          <StepIndicator step={step} />
        </header>

        <section className="rounded-[30px] border border-slate-200/80 bg-white/90 p-3.5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] min-[390px]:p-4">
          <p className="mb-2.5 px-1 text-[11px] font-black tracking-wider text-teal-600">① 서비스 선택</p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-3">
            {PLATFORM_SERVICES.filter((s) => s.customizable).map((s) => {
              const Icon = platformServiceIcons[s.id];
              const active = selectedService?.id === s.id;
              return (
                <Link
                  key={s.id}
                  href={`/studio?service=${s.id}`}
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "relative flex flex-col gap-2 rounded-2xl border bg-white px-3 py-3 transition",
                    active ? "border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-md" : "border-slate-200 hover:border-teal-200"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      active ? "bg-teal-500 text-white" : "bg-teal-50 text-teal-600"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-[13px] font-black leading-snug text-slate-900 break-keep [word-break:keep-all]">{s.name}</span>
                  {active ? <Check className="absolute right-3 top-3 h-4 w-4 text-teal-600" aria-hidden /> : null}
                </Link>
              );
            })}
          </div>
        </section>

        {selectedService ? (
          <section id="templates" className="rounded-[30px] border border-slate-200/80 bg-white/90 p-3.5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] min-[390px]:p-4">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <p className="text-[11px] font-black tracking-wider text-teal-600">② 템플릿 선택 · {selectedService.name}</p>
              <p className="text-[10px] font-bold text-slate-400">{templates.length}개</p>
            </div>
            {templates.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[12px] font-semibold text-slate-500">
                이 서비스용 템플릿이 아직 없습니다. 관리자에서 템플릿을 추가해 주세요.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {templates.map((t) => {
                  const ff = getFormFactor(t.formFactorId);
                  const highlight = sp.template === t.id;
                  const thumb = t.previewImage;
                  return (
                    <form key={t.id} action={createTagDesignFromTemplateAction}>
                      <input type="hidden" name="serviceId" value={selectedService.id} />
                      <input type="hidden" name="templateId" value={t.id} />
                      <button
                        type="submit"
                        className={cn(
                          "group flex w-full flex-col gap-2 overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md",
                          highlight ? "border-teal-300 ring-2 ring-teal-400/30" : "border-slate-200"
                        )}
                      >
                        {thumb ? (
                          <span className="relative block aspect-[86/54] w-full bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                            <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-black text-slate-600 shadow-sm">
                              {t.source === "builtin" ? "기본" : "추가"}
                            </span>
                          </span>
                        ) : null}
                        <span className={cn("flex flex-col gap-2", thumb ? "px-3.5 pb-3" : "px-3.5 py-3")}>
                          <span className="flex items-start justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2.5">
                              {!thumb ? (
                                <span
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-slate-200"
                                  style={{ backgroundColor: (t.defaultSpec.bodyColor as string) || "#00A896" }}
                                  aria-hidden
                                >
                                  <LayoutTemplate className="h-4 w-4 text-white drop-shadow" />
                                </span>
                              ) : null}
                              <span className="min-w-0">
                                <span className="block text-[13px] font-black text-slate-900">{t.name}</span>
                                <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-slate-500 break-keep [word-break:keep-all]">
                                  {t.description}
                                </span>
                              </span>
                            </span>
                            {!thumb ? (
                              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-500">
                                {t.source === "builtin" ? "기본" : "추가"}
                              </span>
                            ) : null}
                          </span>
                          <span className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                            <span className="text-[10px] font-bold text-slate-400">
                              {ff?.name ?? t.formFactorId} · {t.previewHint}
                              {ff ? ` · ${ff.basePriceKrw.toLocaleString("ko-KR")}원~` : ""}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-black text-teal-700">
                              디자인
                              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                            </span>
                          </span>
                        </span>
                      </button>
                    </form>
                  );
                })}
              </div>
            )}
            {!session ? (
              <p className="mt-3 px-1 text-[11px] font-semibold text-slate-400 break-keep [word-break:keep-all]">
                디자인을 저장하려면 로그인이 필요합니다. 템플릿을 고르면 로그인 화면으로 이동한 뒤 이어서 진행됩니다.
              </p>
            ) : null}
          </section>
        ) : null}

        {myDesigns.length > 0 ? (
          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-[18px] shadow-sm min-[390px]:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black tracking-wider text-teal-600">내 디자인</p>
              <p className="text-[11px] font-bold text-slate-400">{myDesigns.length}개</p>
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-2">
              {myDesigns.map((d) => {
                const editable = d.status === "draft" || d.status === "ready";
                return (
                  <li key={d.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                    <span className="h-8 w-8 shrink-0 rounded-xl ring-1 ring-slate-200" style={{ backgroundColor: d.spec.bodyColor }} aria-hidden />
                    <Link href={`/studio/${d.id}`} className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-black text-slate-900">{d.title}</span>
                      <span className="block text-[10px] font-bold text-slate-400">
                        {statusLabel[d.status] ?? d.status} · {formatDateTimeKoSeoul(d.updatedAt)}
                      </span>
                    </Link>
                    {editable ? (
                      <form action={deleteTagDesignAction}>
                        <input type="hidden" name="designId" value={d.id} />
                        <button
                          type="submit"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`${d.title} 삭제`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </form>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {!selectedService ? (
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold text-slate-400">
            <PenTool className="h-3.5 w-3.5" aria-hidden />
            서비스를 고르면 맞는 템플릿이 나타납니다.
          </p>
        ) : null}
      </main>
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  const steps = ["서비스", "템플릿", "디자인", "견적·제작"];
  return (
    <ol className="mt-4 grid grid-cols-4 gap-1.5" aria-label="제작 단계">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <li key={label} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "h-1.5 w-full rounded-full",
                done ? "bg-teal-500" : current ? "bg-teal-300" : "bg-slate-200"
              )}
            />
            <span className={cn("text-[10px] font-black", current ? "text-teal-700" : done ? "text-teal-600" : "text-slate-400")}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
