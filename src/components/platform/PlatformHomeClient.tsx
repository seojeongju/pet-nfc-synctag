"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Box,
  Calculator,
  Layers,
  type LucideIcon,
  Nfc,
  PenTool,
  ShieldCheck,
  Sparkles,
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

const makeSteps: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Layers, title: "서비스 선택", body: "안심·명함·Wi-Fi·매장 등 태그에 담을 기능을 고릅니다." },
  { icon: PenTool, title: "모양·디자인", body: "키링·펜던트·스탠드 중 고르고 이름·문구·색을 넣습니다." },
  { icon: Box, title: "3D 미리보기", body: "실제 크기와 재질로 돌려 보며 디자인을 확인합니다." },
  { icon: Calculator, title: "견적·제작", body: "WOW3D 자동견적으로 가격을 확인하고 제작을 요청합니다." },
];

type PlatformHomeClientProps = {
  isLoggedIn: boolean;
  userName: string | null;
  isAdmin: boolean;
};

export default function PlatformHomeClient({ isLoggedIn, userName, isAdmin }: PlatformHomeClientProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-rose-50/45 via-amber-50/35 to-slate-50 font-outfit">
      <PlatformTopNav isLoggedIn={isLoggedIn} />
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-rose-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-[35%] h-64 w-64 rounded-full bg-amber-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-[15%] h-64 w-64 rounded-full bg-teal-200/30 blur-3xl" />

      <main className="relative z-10 mx-auto flex w-full max-w-screen-sm flex-col gap-5 px-4 pb-9 pt-7 min-[390px]:gap-6 min-[390px]:pb-10 min-[390px]:pt-8 min-[430px]:px-5">
        {/* 히어로 */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[36px] border border-rose-100/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
        >
          <Image src="/images/hero-bg.png" alt="" fill priority className="object-cover opacity-35" />
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,247,237,0.92),rgba(236,253,245,0.9))]" />
          <div className="relative z-10 px-5 pb-6 pt-6 min-[390px]:px-6 min-[390px]:pb-7 min-[390px]:pt-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-3 py-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-teal-500" aria-hidden />
              <span className="text-[10px] font-extrabold tracking-[0.1em] text-teal-700">링크유 · NFC 통합 서비스 플랫폼</span>
            </div>
            <h1 className="text-[25px] font-black leading-[1.22] tracking-tight text-slate-900 break-keep [word-break:keep-all] min-[390px]:text-[27px] min-[430px]:text-[28px]">
              태그 하나에 필요한 연결을 담다,
              <br />
              <span className="text-teal-500">Link-U</span>
            </h1>
            <p className="mt-2.5 text-[12px] font-semibold leading-relaxed text-slate-600 break-keep [word-break:keep-all] min-[390px]:mt-3 min-[390px]:text-[13px]">
              위치·안심 서비스부터 디지털 명함, Wi-Fi, 매장 안내까지.
              <br />
              쓰임새를 고르고, 원하는 모양으로 디자인해 3D 프린팅으로 받아 보세요.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
              <Link
                href="/studio"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
              >
                <PenTool className="h-4 w-4" aria-hidden />
                나만의 태그 만들기
              </Link>
              <a
                href="#services"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-teal-200 hover:text-teal-700"
              >
                서비스 둘러보기
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </motion.section>

        {/* Link-U 안심 — 기존 태그 구매자 바로가기 */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.45 }}
          className="rounded-[26px] border border-teal-100/90 bg-gradient-to-br from-teal-50/95 to-white p-[18px] shadow-[0_12px_30px_rgba(15,23,42,0.05)] min-[390px]:rounded-[28px] min-[390px]:p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">링크유 안심</p>
              <h2 className="mt-1 text-lg font-black leading-snug text-slate-900 break-keep [word-break:keep-all]">
                Link-U 태그를 갖고 계신가요?
              </h2>
              <p className="mt-2 text-[12px] font-semibold leading-relaxed text-slate-600 break-keep [word-break:keep-all]">
                반려동물·어르신·아이·수하물·주얼리·동행 안내. 모드를 선택하고 태그를 연결하세요.
              </p>
            </div>
          </div>
          <Link href={LINKU_HOME_PATH} className="mt-4 block">
            <span className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-teal-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]">
              링크유 안심 모드 선택
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        </motion.section>

        {/* 서비스 */}
        <section
          id="services"
          className="scroll-mt-20 rounded-[30px] border border-slate-200/80 bg-white/90 p-3.5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur min-[390px]:rounded-[32px] min-[390px]:p-4"
        >
          <div className="mb-2.5 flex items-center justify-between px-1 min-[390px]:mb-3">
            <p className="text-[11px] font-black tracking-wider text-teal-600">NFC 서비스 선택</p>
            <p className="text-[11px] font-bold text-slate-400">{PLATFORM_SERVICES.length}가지 서비스</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {PLATFORM_SERVICES.map((s) => (
              <ServiceRow key={s.id} service={s} />
            ))}
          </div>
        </section>

        {/* 태그 제작 */}
        <section
          id="make"
          className="scroll-mt-20 rounded-[26px] border border-slate-200/80 bg-white/90 p-[18px] shadow-sm min-[390px]:rounded-[28px] min-[390px]:p-5"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">커스텀 태그 제작</p>
          <h2 className="mt-1 text-lg font-black leading-snug text-slate-900 break-keep [word-break:keep-all]">
            원하는 모양으로 직접 만드는 NFC 태그
          </h2>
          <ol className="mt-4 grid grid-cols-1 gap-2 min-[430px]:grid-cols-2">
            {makeSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900">
                      <span className="mr-1 text-teal-600">{i + 1}.</span>
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-500 break-keep [word-break:keep-all]">
                      {step.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          <Link href="/studio" className="mt-4 block">
            <span className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]">
              <Nfc className="h-4 w-4 text-teal-300" aria-hidden />
              태그 스튜디오 시작
            </span>
          </Link>
        </section>

        <section className="space-y-3 rounded-[26px] border border-slate-200/80 bg-white/90 p-[18px] shadow-sm min-[390px]:rounded-[28px] min-[390px]:p-5">
          <div className="flex flex-col items-center gap-3">
            <div className="grid w-full grid-cols-2 gap-2">
              <Link
                href="/manual"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                <BookOpen className="h-4 w-4 text-teal-600" aria-hidden />
                사용 설명서
              </Link>
              <Link
                href={isAdmin ? "/admin" : "/admin/login"}
                prefetch={false}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black shadow-sm",
                  isAdmin
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <ShieldCheck className={cn("h-4 w-4", isAdmin ? "text-teal-300" : "text-slate-500")} aria-hidden />
                {isAdmin ? "관리자 센터" : "관리자 로그인"}
              </Link>
            </div>
            {isLoggedIn && userName ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-1.5 text-[11px] font-black text-teal-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
                {userName}님 로그인 상태
              </div>
            ) : null}
          </div>
        </section>

        <footer className="pt-1 text-center">
          <div className="space-y-1 text-[10px] font-bold leading-relaxed text-slate-400">
            <p>© 2026 WOW3D PRO. (주)와우쓰리디. All rights reserved.</p>
            <p>대표 전화: 02-3144-3137 / 054-464-3144</p>
            <p>이메일 문의: wow3d16@naver.com</p>
            <p>사업자등록번호: 849-88-01659</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ServiceRow({ service }: { service: PlatformService }) {
  const Icon = platformServiceIcons[service.id];
  const live = service.status === "live";
  return (
    <Link
      href={`/services/${service.id}`}
      className={cn(
        "group relative flex min-h-12 items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-left transition min-[390px]:px-4 min-[390px]:py-3",
        "hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
      )}
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
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-black",
                live ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"
              )}
            >
              {platformServiceStatusLabel[service.status]}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-500 break-keep [word-break:keep-all]">
            {service.tagline}
          </p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-500" aria-hidden />
    </Link>
  );
}
