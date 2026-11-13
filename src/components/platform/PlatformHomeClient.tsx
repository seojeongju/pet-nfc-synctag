"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  BookOpen,
  Box,
  Briefcase,
  Calculator,
  Gem,
  Layers,
  type LucideIcon,
  Navigation2,
  Nfc,
  PawPrint,
  PenTool,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformTopNav } from "@/components/platform/PlatformTopNav";
import { platformServiceIcons } from "@/components/platform/service-icons";
import {
  LINKU_HOME_PATH,
  PLATFORM_SERVICES,
  platformServiceStatusLabel,
  type PlatformService,
} from "@/lib/platform/services";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { linkuCompanionMenuTitle } from "@/lib/wayfinder/copy";

const makeSteps: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Layers, title: "서비스 선택", body: "안심·명함·Wi-Fi·매장 등 태그에 담을 기능을 고릅니다." },
  { icon: PenTool, title: "모양·디자인", body: "키링·펜던트·스탠드 중 고르고 이름·문구·색을 넣습니다." },
  { icon: Box, title: "3D 미리보기", body: "실제 크기와 재질로 돌려 보며 디자인을 확인합니다." },
  { icon: Calculator, title: "견적·제작", body: "WOW3D 자동견적으로 가격을 확인하고 제작을 요청합니다." },
];

const modeIcons: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

type PlatformHomeClientProps = {
  isLoggedIn: boolean;
  userName: string | null;
  isAdmin: boolean;
};

/**
 * 플랫폼 메인 랜딩. 휴대폰은 Link-U 웹앱과 같은 카드형(max-w-screen-sm),
 * PC(lg 이상)는 넓은 웹 레이아웃. 색·카드·서체는 Link-U 기준 그대로.
 */
export default function PlatformHomeClient({ isLoggedIn, userName, isAdmin }: PlatformHomeClientProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-rose-50/45 via-amber-50/35 to-slate-50 font-outfit">
      <PlatformTopNav isLoggedIn={isLoggedIn} />
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-rose-300/30 blur-3xl lg:h-[28rem] lg:w-[28rem]" />
      <div className="pointer-events-none absolute -left-20 top-[35%] h-64 w-64 rounded-full bg-amber-200/35 blur-3xl lg:h-[26rem] lg:w-[26rem]" />
      <div className="pointer-events-none absolute -bottom-16 right-[15%] h-64 w-64 rounded-full bg-teal-200/30 blur-3xl lg:h-[30rem] lg:w-[30rem]" />

      <main className="relative z-10 mx-auto flex w-full max-w-screen-sm flex-col gap-5 px-4 pb-9 pt-7 min-[390px]:gap-6 min-[390px]:pb-10 min-[390px]:pt-8 min-[430px]:px-5 lg:max-w-6xl lg:gap-16 lg:px-8 lg:pb-16 lg:pt-12">
        {/* 히어로 */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[36px] border border-rose-100/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)] lg:rounded-[44px]"
        >
          <Image src="/images/hero-bg.png" alt="" fill priority className="object-cover opacity-35" />
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,247,237,0.92),rgba(236,253,245,0.9))]" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="px-5 pb-6 pt-6 min-[390px]:px-6 min-[390px]:pb-7 min-[390px]:pt-7 lg:px-14 lg:py-16">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-3 py-1.5 shadow-sm lg:mb-6">
                <Sparkles className="h-3.5 w-3.5 text-teal-500" aria-hidden />
                <span className="text-[10px] font-extrabold tracking-[0.1em] text-teal-700 lg:text-[11px]">링크유 · NFC 통합 서비스 플랫폼</span>
              </div>
              <h1 className="text-[25px] font-black leading-[1.22] tracking-tight text-slate-900 break-keep [word-break:keep-all] min-[390px]:text-[27px] min-[430px]:text-[28px] lg:text-[52px] lg:leading-[1.12]">
                태그 하나에 필요한 연결을 담다,
                <br />
                <span className="text-teal-500">Link-U</span>
              </h1>
              <p className="mt-2.5 text-[12px] font-semibold leading-relaxed text-slate-600 break-keep [word-break:keep-all] min-[390px]:mt-3 min-[390px]:text-[13px] lg:mt-6 lg:max-w-lg lg:text-[17px]">
                위치·안심 서비스부터 디지털 명함, Wi-Fi, 매장 안내까지.
                <br />
                쓰임새를 고르고, 원하는 모양으로 디자인해 3D 프린팅으로 받아 보세요.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 lg:mt-9 lg:flex lg:gap-3">
                <Link
                  href="/studio"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] lg:h-14 lg:px-8 lg:text-base"
                >
                  <PenTool className="h-4 w-4" aria-hidden />
                  나만의 태그 만들기
                </Link>
                <a
                  href="#services"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-teal-200 hover:text-teal-700 lg:h-14 lg:px-8 lg:text-base"
                >
                  서비스 둘러보기
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
              <dl className="mt-10 hidden max-w-md grid-cols-3 gap-4 lg:grid">
                {[
                  ["6+", "NFC 서비스"],
                  ["3종", "맞춤 태그 모양"],
                  ["앱 설치 없이", "휴대폰을 대면 바로"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dt className="sr-only">{l}</dt>
                    <dd className="text-xl font-black text-slate-900">{v}</dd>
                    <dd className="mt-0.5 text-[12px] font-bold text-slate-500">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <HeroTagVisual />
          </div>
        </motion.section>

        {/* Link-U 안심 */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.45 }}
          className="rounded-[26px] border border-teal-100/90 bg-gradient-to-br from-teal-50/95 to-white p-[18px] shadow-[0_12px_30px_rgba(15,23,42,0.05)] min-[390px]:rounded-[28px] min-[390px]:p-5 lg:rounded-[36px] lg:p-10"
        >
          <div className="lg:grid lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-10">
            <div>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm lg:h-14 lg:w-14">
                  <ShieldCheck className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">링크유 안심</p>
                  <h2 className="mt-1 text-lg font-black leading-snug text-slate-900 break-keep [word-break:keep-all] lg:text-3xl">
                    Link-U 태그를 갖고 계신가요?
                  </h2>
                  <p className="mt-2 text-[12px] font-semibold leading-relaxed text-slate-600 break-keep [word-break:keep-all] lg:mt-3 lg:text-[15px]">
                    발견자는 앱 설치 없이 태그를 스캔해 보호자에게 연락하고, 동의하면 위치를 보냅니다. 모드를 선택하고 태그를
                    연결하세요.
                  </p>
                </div>
              </div>
              <Link href={LINKU_HOME_PATH} className="mt-4 block lg:mt-7 lg:inline-block">
                <span className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-teal-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] lg:h-12 lg:w-auto lg:px-8">
                  링크유 안심 모드 선택
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </div>
            <ul className="mt-6 hidden grid-cols-3 gap-3 lg:mt-0 lg:grid">
              {SUBJECT_KINDS.map((k) => {
                const Icon = modeIcons[k];
                return (
                  <li key={k}>
                    <Link
                      href={`/${k}`}
                      className="group flex h-full flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="text-sm font-black text-slate-900">{subjectKindMeta[k].label}</span>
                      <span className="line-clamp-2 text-[11px] font-semibold leading-snug text-slate-500 break-keep [word-break:keep-all]">
                        {subjectKindMeta[k].description}
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href={LINKU_HOME_PATH}
                  className="flex h-full flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Navigation2 className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-black text-slate-900">{linkuCompanionMenuTitle}</span>
                  <span className="text-[11px] font-semibold leading-snug text-slate-500">교통약자 이동 안내</span>
                </Link>
              </li>
            </ul>
          </div>
        </motion.section>

        {/* 서비스 */}
        <section id="services" className="scroll-mt-20">
          <div className="hidden lg:mb-8 lg:flex lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">NFC 서비스</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">쓰임새에 맞는 서비스를 고르세요</h2>
              <p className="mt-2 text-[15px] font-semibold text-slate-500">서비스를 고르면 그 기능이 담긴 태그를 바로 제작할 수 있습니다.</p>
            </div>
            <p className="text-sm font-bold text-slate-400">{PLATFORM_SERVICES.length}가지 서비스</p>
          </div>

          {/* 휴대폰: 앱형 목록 */}
          <div className="rounded-[30px] border border-slate-200/80 bg-white/90 p-3.5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur min-[390px]:rounded-[32px] min-[390px]:p-4 lg:hidden">
            <div className="mb-2.5 flex items-center justify-between px-1 min-[390px]:mb-3">
              <p className="text-[11px] font-black tracking-wider text-teal-600">NFC 서비스 선택</p>
              <p className="text-[11px] font-bold text-slate-400">{PLATFORM_SERVICES.length}가지 서비스</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PLATFORM_SERVICES.map((s) => (
                <ServiceRow key={s.id} service={s} />
              ))}
            </div>
          </div>

          {/* PC: 카드 그리드 */}
          <div className="hidden grid-cols-3 gap-5 lg:grid">
            {PLATFORM_SERVICES.map((s, i) => (
              <ServiceCard key={s.id} service={s} index={i} />
            ))}
          </div>
        </section>

        {/* 태그 제작 */}
        <section
          id="make"
          className="scroll-mt-20 rounded-[26px] border border-slate-200/80 bg-white/90 p-[18px] shadow-sm min-[390px]:rounded-[28px] min-[390px]:p-5 lg:rounded-[40px] lg:p-12 lg:shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
        >
          <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">커스텀 태그 제작</p>
              <h2 className="mt-1 text-lg font-black leading-snug text-slate-900 break-keep [word-break:keep-all] lg:mt-2 lg:text-3xl">
                원하는 모양으로 직접 만드는 NFC 태그
              </h2>
              <p className="mt-2 hidden text-[15px] font-semibold text-slate-500 lg:block">
                디자인부터 3D 미리보기, 견적, 제작까지 한 흐름으로 이어집니다.
              </p>
            </div>
            <Link href="/studio" className="hidden shrink-0 lg:block">
              <span className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-900 px-7 text-sm font-black text-white shadow-sm transition hover:bg-slate-800">
                <Nfc className="h-4 w-4 text-teal-300" aria-hidden />
                태그 스튜디오 시작
              </span>
            </Link>
          </div>
          <ol className="mt-4 grid grid-cols-1 gap-2 min-[430px]:grid-cols-2 lg:mt-10 lg:grid-cols-4 lg:gap-5">
            {makeSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="relative flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 lg:flex-col lg:gap-4 lg:rounded-3xl lg:p-6"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 lg:h-12 lg:w-12 lg:rounded-2xl">
                    <Icon className="h-4 w-4 lg:h-5 lg:w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900 lg:text-base">
                      <span className="mr-1 text-teal-600">{i + 1}.</span>
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-500 break-keep [word-break:keep-all] lg:mt-1.5 lg:text-[13px] lg:leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                  {i < makeSteps.length - 1 ? (
                    <ArrowRight className="absolute -right-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-teal-300 lg:block" aria-hidden />
                  ) : null}
                </li>
              );
            })}
          </ol>
          <Link href="/studio" className="mt-4 block lg:hidden">
            <span className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]">
              <Nfc className="h-4 w-4 text-teal-300" aria-hidden />
              태그 스튜디오 시작
            </span>
          </Link>
        </section>

        {/* 바로가기 (휴대폰) */}
        <section className="space-y-3 rounded-[26px] border border-slate-200/80 bg-white/90 p-[18px] shadow-sm min-[390px]:rounded-[28px] min-[390px]:p-5 lg:hidden">
          <div className="flex flex-col items-center gap-3">
            <div className="grid w-full grid-cols-2 gap-2">
              <Link
                href="/manual"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                <BookOpen className="h-4 w-4 text-teal-600" aria-hidden />
                사용 설명서
              </Link>
              <AdminEntryLink isAdmin={isAdmin} />
            </div>
            {isLoggedIn && userName ? <LoggedInBadge userName={userName} /> : null}
          </div>
        </section>

        <PlatformFooter isAdmin={isAdmin} isLoggedIn={isLoggedIn} userName={userName} />
      </main>
    </div>
  );
}

/** PC 히어로 오른쪽: 태그 실물 사진이 준비되기 전까지 CSS로 구성한 태그 목업 */
function HeroTagVisual() {
  return (
    <div className="relative hidden h-full min-h-[480px] items-center justify-center lg:flex" aria-hidden>
      <div className="absolute h-[360px] w-[360px] rounded-full bg-gradient-to-br from-teal-100/80 via-white to-rose-100/70" />
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute h-[230px] w-[230px] rounded-full border border-teal-300/60"
          animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: i * 1 }}
        />
      ))}
      {/* 원형 키링 */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        animate={{ y: [0, -10, 0], rotate: [-4, 2, -4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="h-12 w-12 rounded-full border-[10px] border-teal-500 bg-transparent shadow-sm" />
        <span className="-mt-2 flex h-[200px] w-[200px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-[0_30px_60px_rgba(0,134,120,0.35)] ring-8 ring-white/70">
          <Nfc className="h-10 w-10 opacity-90" />
          <span className="mt-2 text-2xl font-black tracking-tight">LINK-U</span>
          <span className="mt-0.5 text-[11px] font-bold tracking-[0.2em] text-teal-50/90">TAP TO CONNECT</span>
        </span>
      </motion.div>
      {/* 뼈다귀 펜던트 */}
      <motion.div
        className="absolute bottom-16 left-10 z-20 flex items-center"
        animate={{ y: [0, 8, 0], rotate: [-12, -8, -12] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      >
        <span className="flex h-[64px] w-[150px] items-center justify-center rounded-[32px] bg-amber-300 text-[13px] font-black text-amber-900 shadow-[0_18px_36px_rgba(180,83,9,0.25)] ring-4 ring-white/80">
          <PawPrint className="mr-1.5 h-4 w-4" />
          COCO
        </span>
      </motion.div>
      {/* 스탠드 플레이트 */}
      <motion.div
        className="absolute right-10 top-14 z-20"
        animate={{ y: [0, -6, 0], rotate: [8, 5, 8] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      >
        <span className="flex h-[150px] w-[118px] flex-col items-center justify-center gap-2 rounded-[22px] bg-white text-slate-800 shadow-[0_18px_40px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-500">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-[13px] font-black">FREE Wi-Fi</span>
          <span className="text-[10px] font-bold text-slate-400">휴대폰을 대세요</span>
        </span>
      </motion.div>
    </div>
  );
}

function AdminEntryLink({ isAdmin, className }: { isAdmin: boolean; className?: string }) {
  return (
    <Link
      href={isAdmin ? "/admin" : "/admin/login"}
      prefetch={false}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black shadow-sm",
        isAdmin ? "bg-slate-900 text-white hover:bg-slate-800" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        className
      )}
    >
      <ShieldCheck className={cn("h-4 w-4", isAdmin ? "text-teal-300" : "text-slate-500")} aria-hidden />
      {isAdmin ? "관리자 센터" : "관리자 로그인"}
    </Link>
  );
}

function LoggedInBadge({ userName }: { userName: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-1.5 text-[11px] font-black text-teal-700">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
      {userName}님 로그인 상태
    </div>
  );
}

function PlatformFooter({ isAdmin, isLoggedIn, userName }: { isAdmin: boolean; isLoggedIn: boolean; userName: string | null }) {
  const company = (
    <div className="space-y-1 text-[10px] font-bold leading-relaxed text-slate-400 lg:text-[12px]">
      <p>© 2026 WOW3D PRO. (주)와우쓰리디. All rights reserved.</p>
      <p>대표 전화: 02-3144-3137 / 054-464-3144</p>
      <p>이메일 문의: wow3d16@naver.com</p>
      <p>사업자등록번호: 849-88-01659</p>
    </div>
  );
  return (
    <footer className="pt-1">
      <div className="text-center lg:hidden">{company}</div>
      <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 border-t border-slate-200/80 pt-10 lg:grid">
        <div>
          <p className="text-xl font-black italic tracking-tighter text-slate-900">Link-U</p>
          <p className="mt-2 text-[13px] font-semibold text-slate-500">NFC 태그의 연결·관리·제작을 한곳에서.</p>
          <div className="mt-5">{company}</div>
        </div>
        <FooterCol
          title="서비스"
          links={PLATFORM_SERVICES.slice(0, 4).map((s) => ({ href: `/services/${s.id}`, label: s.name }))}
        />
        <FooterCol
          title="태그 제작"
          links={[
            { href: "/studio", label: "태그 스튜디오" },
            { href: "/shop", label: "스토어" },
            { href: "/manual", label: "사용 설명서" },
          ]}
        />
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">계정</p>
          <div className="mt-4 flex flex-col items-start gap-3">
            {isLoggedIn && userName ? <LoggedInBadge userName={userName} /> : null}
            <Link
              href={isLoggedIn ? "/hub" : `/login?callbackUrl=${encodeURIComponent("/hub")}`}
              prefetch={false}
              className="text-[13px] font-bold text-slate-600 hover:text-teal-700"
            >
              {isLoggedIn ? "내 허브" : "로그인"}
            </Link>
            <AdminEntryLink isAdmin={isAdmin} className="h-10" />
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

function ServiceRow({ service }: { service: PlatformService }) {
  const Icon = platformServiceIcons[service.id];
  const live = service.status === "live";
  return (
    <Link
      href={`/services/${service.id}`}
      className="group relative flex min-h-12 items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md min-[390px]:px-4 min-[390px]:py-3"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl min-[390px]:h-9 min-[390px]:w-9",
            live ? "bg-teal-500 text-white" : "bg-teal-50 text-teal-600"
          )}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[13px] font-black leading-snug text-slate-900 break-keep [word-break:keep-all] min-[390px]:text-sm">
            {service.name}
            <StatusBadge service={service} />
          </p>
          <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-500 break-keep [word-break:keep-all]">{service.tagline}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-500" aria-hidden />
    </Link>
  );
}

function ServiceCard({ service, index }: { service: PlatformService; index: number }) {
  const Icon = platformServiceIcons[service.id];
  const live = service.status === "live";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Link
        href={`/services/${service.id}`}
        className={cn(
          "group flex h-full flex-col rounded-[32px] border bg-white/95 p-7 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.10)]",
          live ? "border-teal-200" : "border-slate-200/80 hover:border-teal-200"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              live ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" : "bg-teal-50 text-teal-600"
            )}
          >
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <StatusBadge service={service} />
        </div>
        <p className="mt-5 text-xl font-black text-slate-900">{service.name}</p>
        <p className="mt-0.5 text-[13px] font-black text-teal-600">{service.tagline}</p>
        <p className="mt-3 flex-1 text-[13px] font-semibold leading-relaxed text-slate-500 break-keep [word-break:keep-all]">
          {service.description}
        </p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {service.examples.slice(0, 4).map((ex) => (
            <li key={ex} className="rounded-full bg-teal-50/70 px-2.5 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-teal-100">
              {ex}
            </li>
          ))}
        </ul>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-teal-700">
          {service.entryPath ? "자세히 보기" : "태그 만들기"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Link>
    </motion.div>
  );
}

function StatusBadge({ service }: { service: PlatformService }) {
  const live = service.status === "live";
  return (
    <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black lg:px-2.5 lg:py-1 lg:text-[10px]", live ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500")}>
      {platformServiceStatusLabel[service.status]}
    </span>
  );
}
