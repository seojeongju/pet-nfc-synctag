"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  BookOpen,
  Briefcase,
  Check,
  Gem,
  type LucideIcon,
  Minus,
  Navigation2,
  PawPrint,
  PenTool,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformTopNav } from "@/components/platform/PlatformTopNav";
import { HeroPhoneDemo } from "@/components/platform/landing/HeroPhoneDemo";
import { HowItWorksFlow } from "@/components/platform/landing/HowItWorksFlow";
import { ServicesBento } from "@/components/platform/landing/ServicesBento";
import { StudioShowcase } from "@/components/platform/landing/StudioShowcase";
import { CountUp, Reveal, SectionHeading } from "@/components/platform/landing/motion-utils";
import { SeoFaq } from "@/components/seo/SeoFaq";
import { LINKU_HOME_PATH, PLATFORM_SERVICES } from "@/lib/platform/services";
import { FORM_FACTORS } from "@/lib/platform/form-factors";
import { PLATFORM_FAQS } from "@/lib/seo-content";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { linkuCompanionMenuTitle } from "@/lib/wayfinder/copy";

const modeIcons: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

/** 비교표: 기존 인식표·명함 vs Link-U NFC 태그 (기능 사실만) */
const COMPARE_ROWS: Array<{ label: string; legacy: boolean; linku: boolean }> = [
  { label: "앱 설치 없이 휴대폰을 대면 바로 열림", legacy: false, linku: true },
  { label: "정보를 바꾸면 태그 교체 없이 즉시 반영", legacy: false, linku: true },
  { label: "스캔 시 보호자에게 실시간 알림", legacy: false, linku: true },
  { label: "발견자가 동의하면 위치 전달", legacy: false, linku: true },
  { label: "원하는 모양·색·문구로 맞춤 제작", legacy: false, linku: true },
  { label: "전원·충전 필요 없음", legacy: true, linku: true },
];

type PlatformHomeClientProps = {
  isLoggedIn: boolean;
  userName: string | null;
  isAdmin: boolean;
};

/**
 * 플랫폼 메인 랜딩. 휴대폰은 Link-U 웹앱 톤의 카드형, PC(lg 이상)는 넓은 웹 레이아웃.
 * 섹션마다 동작하는 인포그래픽(components/platform/landing/*)을 둔다.
 */
export default function PlatformHomeClient({ isLoggedIn, userName, isAdmin }: PlatformHomeClientProps) {
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FBFAF8] font-outfit">
      <PlatformTopNav isLoggedIn={isLoggedIn} />

      {/* 배경 오로라 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1100px] overflow-hidden" aria-hidden>
        <motion.div
          className="absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-rose-200/45 blur-[110px]"
          animate={reduce ? undefined : { x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -left-40 top-40 h-[520px] w-[520px] rounded-full bg-amber-100/70 blur-[110px]"
          animate={reduce ? undefined : { x: [0, 50, 0], y: [0, -20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/3 top-[420px] h-[560px] w-[560px] rounded-full bg-teal-200/40 blur-[120px]"
          animate={reduce ? undefined : { x: [0, 30, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(15,23,42,0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-screen-sm flex-col gap-14 px-4 pb-10 pt-8 min-[430px]:px-5 lg:max-w-6xl lg:gap-28 lg:px-8 lg:pb-20 lg:pt-16">
        {/* ── 히어로 ─────────────────────────────────── */}
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
          <div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-500" aria-hidden />
              <span className="text-[11px] font-extrabold tracking-[0.08em] text-teal-700">링크유 · NFC 통합 서비스 플랫폼</span>
            </motion.div>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 text-[34px] font-black leading-[1.14] tracking-[-0.03em] text-slate-900 break-keep [word-break:keep-all] min-[390px]:text-[38px] lg:mt-7 lg:text-[64px] lg:leading-[1.06]"
            >
              태그 하나에
              <br />
              필요한 연결을 담다,
              <br />
              <span className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-500 bg-clip-text text-transparent">Link-U</span>
            </motion.h1>
            <motion.p
              data-seo-summary
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-5 max-w-lg text-[14px] font-semibold leading-relaxed text-slate-500 break-keep [word-break:keep-all] lg:mt-7 lg:text-[18px]"
            >
              링크유(Link-U)는 NFC 태그의 연결·관리·맞춤 제작 플랫폼입니다. 위치·안심 서비스부터 디지털 명함, Wi-Fi, 매장 안내까지 쓰임새를 고르고, 원하는 모양으로 디자인해 3D로 미리 본 뒤 제작할 수 있습니다.
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.26 }}
              className="mt-7 grid grid-cols-1 gap-2.5 min-[390px]:grid-cols-2 lg:mt-10 lg:flex lg:gap-3"
            >
              <Link
                href="/studio"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(15,23,42,0.22)] transition hover:bg-teal-700 active:scale-[0.98] lg:h-14 lg:px-8 lg:text-base"
              >
                <PenTool className="h-4 w-4" aria-hidden />
                나만의 태그 만들기
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href={LINKU_HOME_PATH}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-teal-200 bg-white/90 px-6 text-sm font-black text-teal-700 shadow-sm backdrop-blur transition hover:bg-teal-50 lg:h-14 lg:px-8 lg:text-base"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Link-U 안심 시작
              </Link>
            </motion.div>
            <motion.ul
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 flex flex-wrap gap-x-5 gap-y-2 lg:mt-9"
            >
              {["앱 설치 없음", "동의 기반 위치 전달", "3D 프린팅 맞춤 제작"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-500 lg:text-[13px]">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={4} aria-hidden />
                  </span>
                  {t}
                </li>
              ))}
            </motion.ul>
          </div>
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroPhoneDemo className="h-[460px] w-full max-w-[420px] lg:h-[560px] lg:max-w-[520px]" />
          </motion.div>
        </section>

        {/* ── 수치 띠 ─────────────────────────────────── */}
        <Reveal>
          <section className="grid grid-cols-2 overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/80 shadow-[0_14px_40px_rgba(15,23,42,0.06)] backdrop-blur lg:grid-cols-4 lg:rounded-[32px]">
            {[
              { value: <CountUp to={PLATFORM_SERVICES.length} suffix="가지" />, label: "NFC 서비스" },
              { value: <CountUp to={FORM_FACTORS.length} suffix="종" />, label: "맞춤 태그 모양" },
              { value: <CountUp to={0} suffix="개" />, label: "설치할 앱" },
              { value: <CountUp to={30} suffix="종+" />, label: "제작 소재 (WOW3D)" },
            ].map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  "px-5 py-5 lg:px-8 lg:py-8",
                  i % 2 === 1 && "border-l border-slate-100",
                  i >= 2 && "border-t border-slate-100 lg:border-t-0",
                  i === 2 && "lg:border-l"
                )}
              >
                <p className="text-[26px] font-black tracking-tight text-slate-900 lg:text-[40px]">{s.value}</p>
                <p className="mt-1 text-[12px] font-bold text-slate-500 lg:text-[14px]">{s.label}</p>
              </div>
            ))}
          </section>
        </Reveal>

        {/* ── 작동 원리 ─────────────────────────────────── */}
        <section>
          <SectionHeading
            eyebrow="How it works"
            title={
              <>
                휴대폰을 대는 순간,
                <br className="lg:hidden" /> 필요한 화면이 열립니다
              </>
            }
            body="NFC 태그는 전원이 필요 없고, 휴대폰 카메라나 앱도 필요 없습니다. 태그에 담긴 서비스가 바로 이어집니다."
            align="center"
          />
          <div className="mt-8 lg:mt-14">
            <HowItWorksFlow />
          </div>
        </section>

        {/* ── 서비스 ─────────────────────────────────── */}
        <section id="services" className="scroll-mt-24">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Services"
              title="쓰임새에 맞는 서비스를 고르세요"
              body="서비스를 고르면 그 기능이 담긴 태그를 바로 제작할 수 있습니다."
            />
            <Reveal>
              <Link href="/studio" className="inline-flex items-center gap-1 text-sm font-black text-teal-700 hover:text-teal-900">
                태그 만들러 가기 <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Reveal>
          </div>
          <div className="mt-7 lg:mt-12">
            <ServicesBento />
          </div>
        </section>

        {/* ── Link-U 안심 ─────────────────────────────────── */}
        <Reveal>
          <section className="relative overflow-hidden rounded-[32px] border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-rose-50/60 p-6 shadow-[0_20px_60px_rgba(0,134,120,0.08)] lg:rounded-[44px] lg:p-14">
            <div className="lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14">
              <div>
                <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-teal-600">
                  <span className="h-px w-6 bg-teal-400" aria-hidden />
                  Link-U 안심
                </p>
                <h2 className="mt-3 text-[22px] font-black leading-[1.25] tracking-tight text-slate-900 break-keep [word-break:keep-all] lg:text-[36px]">
                  잃어버려도, 발견한 사람이
                  <br />
                  바로 연락할 수 있게
                </h2>
                <p className="mt-3 text-[13px] font-semibold leading-relaxed text-slate-500 break-keep [word-break:keep-all] lg:mt-4 lg:text-[16px]">
                  Link-U 태그를 갖고 계신가요? 모드를 선택하고 태그를 연결하면 바로 사용할 수 있어요.
                </p>
                <Link
                  href={LINKU_HOME_PATH}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-teal-600 px-7 text-sm font-black text-white shadow-[0_14px_30px_rgba(0,134,120,0.25)] transition hover:bg-teal-700 active:scale-[0.98] lg:mt-8 lg:w-auto"
                >
                  링크유 안심 모드 선택
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <ul className="mt-7 grid grid-cols-3 gap-2 lg:mt-0 lg:gap-3">
                {SUBJECT_KINDS.map((k, i) => {
                  const Icon = modeIcons[k];
                  return (
                    <li key={k}>
                      <Reveal delay={i * 0.05}>
                        <Link
                          href={`/${k}`}
                          className="group flex flex-col items-center gap-2 rounded-2xl border border-white bg-white/80 px-2 py-4 text-center shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-md lg:rounded-3xl lg:py-6"
                        >
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 transition group-hover:bg-teal-500 group-hover:text-white lg:h-14 lg:w-14">
                            <Icon className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden />
                          </span>
                          <span className="text-[11px] font-black text-slate-800 lg:text-[13px]">{subjectKindMeta[k].label}</span>
                        </Link>
                      </Reveal>
                    </li>
                  );
                })}
                <li>
                  <Reveal delay={0.25}>
                    <Link
                      href={LINKU_HOME_PATH}
                      className="group flex flex-col items-center gap-2 rounded-2xl border border-white bg-white/80 px-2 py-4 text-center shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-md lg:rounded-3xl lg:py-6"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-500 group-hover:text-white lg:h-14 lg:w-14">
                        <Navigation2 className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden />
                      </span>
                      <span className="text-[11px] font-black text-slate-800 lg:text-[13px]">{linkuCompanionMenuTitle}</span>
                    </Link>
                  </Reveal>
                </li>
              </ul>
            </div>
          </section>
        </Reveal>

        {/* ── 태그 스튜디오 ─────────────────────────────────── */}
        <section id="make" className="scroll-mt-24">
          <SectionHeading
            eyebrow="Custom tag studio"
            title={
              <>
                원하는 모양으로,
                <br className="lg:hidden" /> 직접 만드는 NFC 태그
              </>
            }
            body="모양과 색, 문구를 고르고 실제 크기로 3D 미리보기. 디자인을 마치면 자동견적과 제작까지 이어집니다."
          />
          <div className="mt-7 lg:mt-12">
            <StudioShowcase />
          </div>
        </section>

        {/* ── 비교 ─────────────────────────────────── */}
        <section>
          <SectionHeading eyebrow="Why Link-U" title="평범한 인식표와 무엇이 다를까요?" align="center" />
          <Reveal className="mt-7 lg:mt-12">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_14px_40px_rgba(15,23,42,0.06)] lg:rounded-[36px]">
              <div className="grid grid-cols-[1fr_64px_64px] items-center border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-[11px] font-black text-slate-500 lg:grid-cols-[1fr_140px_140px] lg:px-8 lg:py-4 lg:text-[13px]">
                <span>기능</span>
                <span className="text-center">기존 인식표</span>
                <span className="text-center text-teal-700">Link-U</span>
              </div>
              {COMPARE_ROWS.map((r, i) => (
                <motion.div
                  key={r.label}
                  initial={reduce ? false : { opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="grid grid-cols-[1fr_64px_64px] items-center border-b border-slate-50 px-4 py-3.5 last:border-0 lg:grid-cols-[1fr_140px_140px] lg:px-8 lg:py-5"
                >
                  <span className="text-[12px] font-bold text-slate-700 break-keep [word-break:keep-all] lg:text-[15px]">{r.label}</span>
                  <span className="flex justify-center">
                    {r.legacy ? <YesMark muted /> : <Minus className="h-4 w-4 text-slate-300" aria-label="불가" />}
                  </span>
                  <span className="flex justify-center">{r.linku ? <YesMark /> : <Minus className="h-4 w-4 text-slate-300" aria-label="불가" />}</span>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── FAQ (AEO) ─────────────────────────────────── */}
        <Reveal>
          <SeoFaq items={PLATFORM_FAQS} title="링크유에 대해 자주 묻는 질문" />
        </Reveal>

        {/* ── CTA ─────────────────────────────────── */}
        <Reveal>
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 px-6 py-10 text-center text-white shadow-[0_30px_70px_rgba(0,134,120,0.35)] lg:rounded-[44px] lg:px-16 lg:py-20">
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              {!reduce &&
                [0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25"
                    animate={{ scale: [0.6, 2.6], opacity: [0.5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: i * 1.3, ease: "easeOut" }}
                  />
                ))}
            </div>
            <div className="relative">
              <h2 className="text-[24px] font-black leading-snug tracking-tight break-keep [word-break:keep-all] lg:text-[44px]">
                지금, 나만의 연결을 만들어 보세요
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[13px] font-semibold text-teal-50/90 break-keep [word-break:keep-all] lg:mt-4 lg:text-[17px]">
                서비스를 고르고 태그를 디자인하는 데 몇 분이면 충분합니다.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-2.5 min-[390px]:flex-row lg:mt-10 lg:gap-3">
                <Link
                  href="/studio"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-black text-teal-700 shadow-lg transition hover:bg-teal-50 lg:h-14 lg:px-9 lg:text-base"
                >
                  <PenTool className="h-4 w-4" aria-hidden />
                  태그 만들기
                </Link>
                <Link
                  href="/manual"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-7 text-sm font-black text-white transition hover:bg-white/10 lg:h-14 lg:px-9 lg:text-base"
                >
                  <BookOpen className="h-4 w-4" aria-hidden />
                  사용 설명서
                </Link>
              </div>
            </div>
          </section>
        </Reveal>

        <PlatformFooter isAdmin={isAdmin} isLoggedIn={isLoggedIn} userName={userName} />
      </main>
    </div>
  );
}

function YesMark({ muted = false }: { muted?: boolean }) {
  return (
    <span
      className={cn("flex h-6 w-6 items-center justify-center rounded-full lg:h-7 lg:w-7", muted ? "bg-slate-100 text-slate-400" : "bg-teal-500 text-white shadow-[0_6px_14px_rgba(0,168,150,0.35)]")}
      aria-label="가능"
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
    </span>
  );
}

function AdminEntryLink({ isAdmin, className }: { isAdmin: boolean; className?: string }) {
  return (
    <Link
      href={isAdmin ? "/admin" : "/admin/login"}
      prefetch={false}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-black",
        isAdmin ? "bg-slate-900 text-white hover:bg-slate-800" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
        className
      )}
    >
      <ShieldCheck className={cn("h-4 w-4", isAdmin ? "text-teal-300" : "text-slate-400")} aria-hidden />
      {isAdmin ? "관리자 센터" : "관리자 로그인"}
    </Link>
  );
}

function PlatformFooter({ isAdmin, isLoggedIn, userName }: { isAdmin: boolean; isLoggedIn: boolean; userName: string | null }) {
  return (
    <footer className="border-t border-slate-200/80 pt-8 lg:pt-12">
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
        <div className="col-span-2 lg:col-span-1">
          <p className="text-xl font-black italic tracking-tighter text-slate-900">Link-U</p>
          <p className="mt-2 text-[13px] font-semibold text-slate-500">NFC 태그의 연결·관리·제작을 한곳에서.</p>
          <div className="mt-5 space-y-1 text-[11px] font-bold leading-relaxed text-slate-400 lg:text-[12px]">
            <p>© 2026 WOW3D PRO. (주)와우쓰리디. All rights reserved.</p>
            <p>대표 전화: 02-3144-3137 / 054-464-3144</p>
            <p>이메일 문의: wow3d16@naver.com</p>
            <p>사업자등록번호: 849-88-01659</p>
          </div>
        </div>
        <FooterCol title="서비스" links={PLATFORM_SERVICES.slice(0, 4).map((s) => ({ href: `/services/${s.id}`, label: s.name }))} />
        <FooterCol
          title="태그 제작"
          links={[
            { href: "/studio", label: "태그 스튜디오" },
            { href: "/shop", label: "스토어" },
            { href: "/manual", label: "사용 설명서" },
          ]}
        />
        <div className="col-span-2 lg:col-span-1">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">계정</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 lg:flex-col lg:items-start lg:gap-3">
            {isLoggedIn && userName ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-[11px] font-black text-teal-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
                {userName}님
              </span>
            ) : null}
            <Link
              href={isLoggedIn ? "/hub" : `/login?callbackUrl=${encodeURIComponent("/hub")}`}
              prefetch={false}
              className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-[13px] font-black text-slate-600 hover:bg-slate-50"
            >
              {isLoggedIn ? "내 허브" : "로그인"}
            </Link>
            <AdminEntryLink isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[13px] font-bold text-slate-600 hover:text-teal-700">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
