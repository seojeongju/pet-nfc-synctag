"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Download,
  Home,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { FlowTopNav, type FlowTopNavSession } from "@/components/layout/FlowTopNav";
import { ManualStepVisual } from "@/components/manual/ManualVisualMock";
import { cn } from "@/lib/utils";
import {
  MANUAL_FAQ,
  MANUAL_FINDER_FEATURES,
  MANUAL_INFOGRAPHIC_IMAGE,
  MANUAL_INFOGRAPHIC_STEPS,
  MANUAL_INTRO,
  MANUAL_NFC_CHECKS,
  MANUAL_PDF_FILENAME,
  MANUAL_PDF_PATH,
  MANUAL_PRODUCT_LINES,
  MANUAL_SUPPORT,
  MANUAL_TOC,
  MANUAL_USAGE_TIPS,
} from "@/lib/manual/content";

type Props = {
  session: FlowTopNavSession;
  isAdmin: boolean;
  orgManageHref?: string | null;
};

export function ManualPageClient({ session, isAdmin, orgManageHref = null }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-rose-50/30 font-outfit">
      <FlowTopNav variant="landing" session={session} isAdmin={isAdmin} orgManageHref={orgManageHref} />

      <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 min-[430px]:px-5 sm:pt-8">
        <header className="rounded-[28px] border border-teal-200/80 bg-gradient-to-br from-teal-600 to-teal-700 p-6 text-white shadow-lg sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Infographic Guide
          </div>
          <h1 className="text-2xl font-black leading-tight sm:text-3xl">{MANUAL_INTRO.title}</h1>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-teal-50/95">{MANUAL_INTRO.lead}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <a
              href={MANUAL_PDF_PATH}
              download={MANUAL_PDF_FILENAME}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-teal-800 shadow-sm transition hover:bg-teal-50"
            >
              <Download className="h-4 w-4" aria-hidden />
              PDF 다운로드
            </a>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/20"
            >
              <Home className="h-4 w-4" aria-hidden />
              모드 선택으로
            </Link>
          </div>
        </header>

        <nav
          className="sticky top-[calc(env(safe-area-inset-top,0px)+3.25rem)] z-30 -mx-1 mt-5 overflow-x-auto px-1 py-2"
          aria-label="설명서 목차"
        >
          <ul className="flex w-max min-w-full gap-2">
            {MANUAL_TOC.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="whitespace-nowrap rounded-full border border-teal-100 bg-white px-3.5 py-1.5 text-[11px] font-black text-teal-800 shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-4 space-y-6">
          <section
            id="overview"
            className="scroll-mt-28 overflow-hidden rounded-[28px] border border-teal-100 bg-white shadow-md"
          >
            <div className="border-b border-teal-50 bg-gradient-to-r from-teal-50 to-white px-5 py-4 sm:px-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600">Overview</p>
              <h2 className="mt-1 text-lg font-black text-slate-900">한눈에 보는 사용법</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                아래 인포그래픽으로 전체 흐름을 먼저 확인한 뒤, 단계별 카드에서 자세히 읽어 보세요.
              </p>
            </div>
            <div className="bg-slate-50 p-3 sm:p-4">
              <Image
                src={MANUAL_INFOGRAPHIC_IMAGE.src}
                alt={MANUAL_INFOGRAPHIC_IMAGE.alt}
                width={1200}
                height={4800}
                className="mx-auto h-auto w-full max-w-2xl rounded-2xl border border-white shadow-sm"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </div>
          </section>

          <section id="nfc-check" className="scroll-mt-28 rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600">Before Start</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">시작하기 전 NFC 체크</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {MANUAL_NFC_CHECKS.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-4 text-center shadow-sm"
                >
                  <span className="text-3xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <h3 className="mt-2 text-sm font-black text-slate-900">{item.title}</h3>
                  <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-600">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="steps" className="scroll-mt-28 space-y-4">
            <div className="rounded-[28px] border border-teal-100 bg-gradient-to-r from-teal-50 to-white px-5 py-4 sm:px-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600">4 Steps</p>
              <h2 className="mt-1 text-lg font-black text-slate-900">단계별 등록 가이드</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">보호자가 태그를 처음 설정할 때 따라 할 순서입니다.</p>
            </div>

            <ol className="relative space-y-5 pl-0">
              <span
                aria-hidden
                className="absolute bottom-4 left-[1.65rem] top-4 w-0.5 bg-gradient-to-b from-teal-300 via-teal-200 to-rose-200 sm:left-[1.85rem]"
              />
              {MANUAL_INFOGRAPHIC_STEPS.map((step) => (
                <li
                  key={step.id}
                  className="relative rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex gap-4">
                    <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-lg font-black text-white shadow-md">
                      {step.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-slate-900 sm:text-lg">{step.title}</h3>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-600">{step.summary}</p>
                      {step.checklist ? (
                        <ul className="mt-3 space-y-1.5">
                          {step.checklist.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm font-semibold text-teal-900">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <ManualStepVisual visual={step.visual} />
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="finder" className="scroll-mt-28 rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-cyan-50/40 p-5 shadow-sm sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500">For Finder</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">발견자가 보는 화면</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              태그를 스캔한 분은 별도 앱 설치 없이 웹 화면에서 아래 기능을 사용할 수 있습니다.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {MANUAL_FINDER_FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-indigo-100 bg-white/90 p-4 text-center shadow-sm"
                >
                  <span className="text-3xl" aria-hidden>
                    {feature.emoji}
                  </span>
                  <h3 className="mt-2 text-sm font-black text-slate-900">{feature.title}</h3>
                  <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-600">{feature.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            id="tips"
            className="scroll-mt-28 rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50/80 via-white to-amber-50/40 p-5 shadow-sm sm:p-6"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500">Tips</p>
            <h2 className="mt-1 text-lg font-black text-slate-900">사용 팁</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {MANUAL_USAGE_TIPS.map((tip) => (
                <article
                  key={tip.title}
                  className="rounded-2xl border border-rose-100 bg-white/90 p-4 text-center shadow-sm"
                >
                  <span className="text-3xl" aria-hidden>
                    {tip.emoji}
                  </span>
                  <h3 className="mt-2 text-sm font-black text-rose-950">{tip.title}</h3>
                  <p className="mt-1.5 text-xs font-semibold leading-relaxed text-rose-900/75">{tip.body}</p>
                </article>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl bg-teal-700 px-4 py-3 text-center">
              {MANUAL_PRODUCT_LINES.map((line, index) => (
                <span key={line} className="inline-flex items-center gap-2">
                  {index > 0 ? <span className="text-teal-400/80" aria-hidden>|</span> : null}
                  <span className="text-[11px] font-black text-teal-50">{line}</span>
                </span>
              ))}
            </div>
          </section>

          <section id="faq" className="scroll-mt-28 rounded-[24px] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-slate-900">자주 묻는 질문 (FAQ)</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {MANUAL_FAQ.map((item, index) => {
                const open = openFaq === index;
                return (
                  <div key={item.question}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : index)}
                      aria-expanded={open}
                      className="flex w-full items-start justify-between gap-3 py-3.5 text-left"
                    >
                      <span className="text-sm font-black text-slate-900">{item.question}</span>
                      <ChevronDown
                        className={cn("mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition", open && "rotate-180")}
                        aria-hidden
                      />
                    </button>
                    {open ? (
                      <p className="pb-3.5 text-sm font-medium leading-relaxed text-slate-600">{item.answer}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section
            id="support"
            className="scroll-mt-28 rounded-[24px] border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="text-lg font-black text-slate-900">{MANUAL_SUPPORT.title}</h2>
            <p className="mt-2 text-sm font-medium text-slate-600">{MANUAL_SUPPORT.body}</p>
            <ul className="mt-4 space-y-2.5">
              {MANUAL_SUPPORT.items.map((item) => (
                <li key={item.label} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-3">
                  <span className="w-28 shrink-0 font-black text-slate-500">{item.label}</span>
                  {"href" in item && item.href ? (
                    <a
                      href={item.href}
                      className="font-semibold text-teal-700 underline decoration-teal-200 underline-offset-2"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-800">{item.value}</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2 text-slate-500">
              <Phone className="h-4 w-4" aria-hidden />
              <MessageCircle className="h-4 w-4" aria-hidden />
              <MapPin className="h-4 w-4" aria-hidden />
            </div>
          </section>

          <div className="rounded-[24px] border border-teal-100 bg-teal-50/50 p-5 text-center sm:p-6">
            <p className="text-sm font-black text-teal-900">소중한 인연을 안전하게 지키세요!</p>
            <a
              href={MANUAL_PDF_PATH}
              download={MANUAL_PDF_FILENAME}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-teal-200 bg-white px-4 text-xs font-black text-teal-800 transition hover:bg-teal-50"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              설명서 PDF 저장
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
