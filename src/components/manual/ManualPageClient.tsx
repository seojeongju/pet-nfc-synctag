"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Download,
  Home,
  Link2,
  MapPin,
  MessageCircle,
  Phone,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { FlowTopNav, type FlowTopNavSession } from "@/components/layout/FlowTopNav";
import { cn } from "@/lib/utils";
import {
  MANUAL_FAQ,
  MANUAL_INTRO,
  MANUAL_PDF_FILENAME,
  MANUAL_PDF_PATH,
  MANUAL_SECTIONS,
  MANUAL_SUPPORT,
  MANUAL_TOC,
} from "@/lib/manual/content";

type Props = {
  session: FlowTopNavSession;
  isAdmin: boolean;
  orgManageHref?: string | null;
};

const registerStepIcons = [ScanLine, UserPlus, ShieldCheck, Link2, Sparkles] as const;

export function ManualPageClient({ session, isAdmin, orgManageHref = null }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-slate-50 font-outfit">
      <FlowTopNav variant="landing" session={session} isAdmin={isAdmin} orgManageHref={orgManageHref} />

      <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 min-[430px]:px-5 sm:pt-8">
        <header className="rounded-[28px] border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-700">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            User Manual
          </div>
          <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{MANUAL_INTRO.title}</h1>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">{MANUAL_INTRO.lead}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <a
              href={MANUAL_PDF_PATH}
              download={MANUAL_PDF_FILENAME}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-teal-700"
            >
              <Download className="h-4 w-4" aria-hidden />
              PDF 다운로드
            </a>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <Home className="h-4 w-4 text-teal-600" aria-hidden />
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

        <div className="mt-4 space-y-5">
          {MANUAL_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-28 rounded-[24px] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 className="text-lg font-black text-slate-900">{section.title}</h2>
              {section.subtitle ? (
                <p className="mt-1 text-sm font-semibold text-slate-500">{section.subtitle}</p>
              ) : null}

              {section.paragraphs?.map((p) => (
                <p key={p} className="mt-3 text-sm font-medium leading-relaxed text-slate-700">
                  {p}
                </p>
              ))}

              {section.bullets ? (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-sm font-medium leading-relaxed text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {section.numbered ? (
                <ol className="mt-4 space-y-3">
                  {section.numbered.map((step, index) => {
                    const Icon = registerStepIcons[index] ?? ScanLine;
                    return (
                      <li
                        key={step}
                        className="flex gap-3 rounded-2xl border border-teal-50 bg-teal-50/40 px-3.5 py-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-teal-600">
                            {index + 1}단계
                          </p>
                          <p className="mt-0.5 text-sm font-semibold leading-relaxed text-slate-800">{step}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : null}

              {section.tips ? (
                <div className="mt-4 space-y-3">
                  {section.tips.map((tip) => (
                    <div key={tip.title} className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                      <p className="text-sm font-black text-amber-900">{tip.title}</p>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-amber-950/80">{tip.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ))}

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
                    <a href={item.href} className="font-semibold text-teal-700 underline decoration-teal-200 underline-offset-2">
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
