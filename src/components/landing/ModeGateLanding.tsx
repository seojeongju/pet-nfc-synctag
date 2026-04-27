"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ScanLine,
  UserRoundCheck,
  Link2,
  Home,
  ChevronRight,
  Shield,
  BellRing,
  UserPlus,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubjectKind } from "@/lib/subject-kind";
import { SUBJECT_KINDS, subjectKindMeta } from "@/lib/subject-kind";
import { modeLandingCopy, modeLandingVisual } from "@/lib/mode-landing-content";
import { FlowTopNav } from "@/components/layout/FlowTopNav";
import { saveRecentKind } from "@/lib/recent-kind";

const modePath: Record<SubjectKind, string> = {
  pet: "/pet",
  elder: "/elder",
  child: "/child",
  luggage: "/luggage",
  gold: "/gold",
};

interface ModeGateLandingProps {
  kind: SubjectKind;
  session: { user: { name?: string | null } } | null;
  isAdmin: boolean;
  fromHome?: boolean;
  orgManageHref?: string | null;
}

export default function ModeGateLanding({
  kind,
  session,
  isAdmin,
  fromHome = false,
  orgManageHref = null,
}: ModeGateLandingProps) {
  const visual = modeLandingVisual[kind];
  const copy = modeLandingCopy[kind];
  const meta = subjectKindMeta[kind];
  const Icon = visual.Icon;

  const dashboardUrl = `/dashboard/${encodeURIComponent(kind)}`;
  const registerUrl = `/dashboard/${encodeURIComponent(kind)}/pets/new`;
  const loginUrl = `/login?kind=${encodeURIComponent(kind)}&callbackUrl=${encodeURIComponent(dashboardUrl)}`;

  const guardianEntryLink = session ? (isAdmin ? "/admin" : dashboardUrl) : loginUrl;
  const quickRegisterLink = session ? (isAdmin ? "/admin" : registerUrl) : loginUrl;
  const guardianButtonLabel = session
    ? isAdmin
      ? "관리자 센터 바로가기"
      : `${meta.label} 대시보드`
    : `${meta.label} · 보호자로 시작하기`;

  const otherModes = SUBJECT_KINDS.filter((k) => k !== kind);
  const finderIcons = [ScanLine, UserRoundCheck, Link2] as const;
  const primaryActionType = !session ? "register" : "dashboard";
  const quickActionCards = [
    {
      id: "dashboard",
      href: guardianEntryLink,
      title: "바로 대시보드",
      description: "현재 모드 관리 화면으로 즉시 이동",
      Icon: LayoutDashboard,
      iconWrapClass: cn("bg-gradient-to-br text-white shadow-sm", visual.gradient),
      hoverClass: "hover:border-teal-300 hover:bg-teal-50/40",
      accentClass: "group-hover:text-teal-500",
    },
    {
      id: "register",
      href: quickRegisterLink,
      title: "대상 바로 등록",
      description: "신규 등록부터 시작해서 연결까지 진행",
      Icon: UserPlus,
      iconWrapClass: "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm",
      hoverClass: "hover:border-indigo-300 hover:bg-indigo-50/40",
      accentClass: "group-hover:text-indigo-500",
    },
  ];
  const orderedQuickActionCards = [...quickActionCards].sort((a, b) => {
    if (a.id === primaryActionType) return -1;
    if (b.id === primaryActionType) return 1;
    return 0;
  });
  const quickInfoCards = [
    {
      id: "scan",
      title: "즉시 스캔 인식",
      description: "NFC 태그 터치 시 모드에 맞는 화면으로 빠르게 이동해요.",
      Icon: ScanLine,
    },
    {
      id: "protect",
      title: "보호자 중심 관리",
      description: "등록/수정/알림 흐름을 한 화면에서 간결하게 이어가요.",
      Icon: Shield,
    },
    {
      id: "notify",
      title: "실시간 연결 알림",
      description: "위치·연결 상태를 빠르게 확인하고 대응할 수 있어요.",
      Icon: BellRing,
    },
  ] as const;
  const rememberKind = (value: SubjectKind) => {
    saveRecentKind(value);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit overflow-x-hidden relative">
      <FlowTopNav
        variant="gate"
        session={session}
        isAdmin={isAdmin}
        currentModeLabel={meta.label}
        currentModeDescription={meta.description}
        orgManageHref={orgManageHref}
      />
      <div
        className={cn("absolute top-[-10%] right-[-10%] w-[80%] h-[40%] blur-[120px] rounded-full", visual.blobA)}
      />
      <div
        className={cn("absolute bottom-[-10%] left-[-10%] w-[80%] h-[40%] blur-[120px] rounded-full", visual.blobB)}
      />

      <main className="flex-1 flex flex-col w-full max-w-none lg:max-w-screen-sm mx-auto relative z-10">
        <section className="relative px-4 min-[430px]:px-5 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: fromHome ? 8 : 30, scale: fromHome ? 0.97 : 1 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: fromHome ? 0.45 : 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[4/5] w-full rounded-[48px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-4 border-white"
          >
            {visual.heroImageSrc ? (
              <>
                <Image
                  src={visual.heroImageSrc}
                  alt={visual.heroAlt}
                  fill
                  className="object-cover scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-slate-900/10 z-0" />
              </>
            ) : (
              <div
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br text-white",
                  visual.gradient
                )}
              >
                <Icon className="w-28 h-28 opacity-95 drop-shadow-lg" strokeWidth={1.25} />
                <p className="mt-6 text-sm font-black tracking-tight opacity-90 px-8 text-center">{meta.label}</p>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, x: fromHome ? 6 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: fromHome ? 0.15 : 0.5, duration: 0.45 }}
              className="absolute top-5 right-5 bg-white/95 shadow-xl px-4 py-2 rounded-2xl flex items-center gap-2 border border-slate-200"
            >
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{visual.badge}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: fromHome ? 0.92 : 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: fromHome ? 0.2 : 0.7, type: "spring" }}
              className="absolute bottom-8 left-5 bg-white/95 backdrop-blur-md p-3 rounded-[22px] shadow-2xl flex items-center gap-3 border border-slate-100"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br",
                  visual.gradient
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">
                  {visual.statLabel}
                </p>
                <p className="text-sm font-black text-slate-800">{visual.statValue}</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section className="flex-1 flex flex-col px-5 min-[390px]:px-7 min-[430px]:px-8 pt-7 min-[390px]:pt-8 pb-10 min-[390px]:pb-12 space-y-7 min-[390px]:space-y-8 bg-white/85 backdrop-blur-sm rounded-[34px] min-[390px]:rounded-[40px] border border-slate-100/90 shadow-[0_8px_32px_rgba(15,23,42,0.06)]">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: fromHome ? 0.12 : 0.4 }}
            className="space-y-3"
          >
            <div className={cn("flex items-center gap-2 font-bold text-xs uppercase tracking-widest", visual.sheetAccent)}>
              <Sparkles className="w-4 h-4 shrink-0" />
              {copy.kicker}
            </div>
            <h1 className="text-[22px] min-[360px]:text-[26px] min-[390px]:text-3xl font-black text-slate-900 leading-[1.2] tracking-tight break-words">
              {copy.titleLine1}{" "}
              {copy.titleGradient && (
                <>
                  <br />
                  <span
                    className={cn(
                      "text-transparent bg-clip-text bg-gradient-to-r",
                      visual.titleGradientFrom,
                      visual.titleGradientTo
                    )}
                  >
                    {copy.titleGradient}
                  </span>
                </>
              )}
            </h1>
            <p className="text-slate-600 text-[12px] min-[390px]:text-sm font-semibold leading-relaxed break-words">
              {copy.subline}
            </p>
            <div className="grid grid-cols-1 min-[390px]:grid-cols-3 gap-2">
              {quickInfoCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2.5 shadow-sm"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                        visual.gradient
                      )}
                    >
                      <card.Icon className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-[10px] font-black text-slate-800 leading-tight">{card.title}</p>
                  </div>
                  <p className="mt-1.5 text-[10px] font-semibold text-slate-500 leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
            {!session && (
              <div className={cn("rounded-2xl border px-4 py-3 text-left", visual.finderBoxBorder, visual.finderBoxBg)}>
                <p className={cn("text-[11px] font-black", visual.finderTitleClass)}>{copy.finderTitle}</p>
                <ul className={cn("mt-2 space-y-1.5 text-[10px] font-bold leading-relaxed", visual.finderBodyClass)}>
                  {copy.finderLines.map((line, index) => {
                    const FinderIcon = finderIcons[index] ?? Link2;
                    return (
                      <li key={line} className="flex items-start gap-1.5">
                        <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-white/70 text-teal-700">
                          <FinderIcon className="h-2.5 w-2.5" />
                        </span>
                        <span className="min-w-0">{line}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: fromHome ? 0.18 : 0.6 }}
            className="w-full space-y-6 pt-2"
          >
            <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-2.5">
              {orderedQuickActionCards.map((card, index) => (
                <Link
                  key={card.id}
                  href={card.href}
                  onClick={() => rememberKind(kind)}
                  className={cn(
                    "group rounded-2xl border border-slate-200 bg-white px-3 py-3 transition-all",
                    card.hoverClass
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", card.iconWrapClass)}
                    >
                      <card.Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-black text-slate-900">{card.title}</p>
                        {index === 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                            <BadgeCheck className="h-2.5 w-2.5" />
                            추천
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-500 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                    <ChevronRight className={cn("h-4 w-4 shrink-0 text-slate-300 transition-colors", card.accentClass)} />
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href={guardianEntryLink}
              onClick={() => rememberKind(kind)}
              className={cn(
                "group flex w-full min-h-[3.5rem] min-[390px]:min-h-[4.25rem] items-center justify-center gap-2 rounded-[26px] min-[390px]:rounded-[28px] px-3 py-3 text-sm min-[390px]:text-base font-black shadow-2xl transition-all active:scale-[0.98] group-hover:-translate-y-0.5 group-hover:shadow-xl duration-300 relative overflow-hidden border-2 border-white/25 ring-4 ring-black/5",
                visual.buttonTextClass,
                isAdmin ? "bg-slate-900 shadow-slate-300/40 hover:bg-slate-800" : visual.buttonClass
              )}
            >
              <span className="flex items-center justify-center gap-2 min-w-0 max-w-full relative z-10">
                <AnimatePresence mode="wait">
                  {isAdmin ? (
                    <motion.span key="admin" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                      <ShieldCheck className="w-6 h-6 text-teal-400" aria-hidden />
                    </motion.span>
                  ) : (
                    <motion.span key="user" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={cn("inline-flex drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]", visual.buttonTextClass)}>
                      <LayoutDashboard className="w-6 h-6" strokeWidth={2.25} aria-hidden />
                    </motion.span>
                  )}
                </AnimatePresence>
                <span className={cn("min-w-0 text-center leading-snug [text-wrap:balance] drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]", visual.buttonTextClass)}>{guardianButtonLabel}</span>
                <ArrowRight
                  className={cn("w-5 h-5 shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]", visual.buttonTextClass)}
                  aria-hidden
                />
              </span>
            </Link>

            <div className="flex flex-col items-center gap-4">
              {!session ? (
                <p className="text-xs min-[390px]:text-sm text-slate-500 font-bold text-center px-1 leading-relaxed max-w-[min(100%,22rem)] mx-auto">
                  처음이시면 위 버튼으로 로그인 후 이 모드 대시보드로 이동해요.
                </p>
              ) : (
                <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 rounded-full text-xs font-black text-slate-500 border border-white shadow-sm">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse bg-gradient-to-r", visual.gradient)} />
                  {session.user.name}님으로 입장함
                </div>
              )}
            </div>
          </motion.div>
        </section>

        <footer className="px-4 min-[390px]:px-7 min-[430px]:px-8 pb-10 pt-2 bg-white/50 flex flex-col items-center gap-4 w-full max-w-screen-sm mx-auto relative z-10">
          <nav className="flex flex-wrap justify-center gap-2 text-[10px] min-[390px]:text-[11px] font-black text-slate-600 uppercase tracking-wide max-w-full px-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-slate-300 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              <Home className="h-3.5 w-3.5" />
              전체 홈
            </Link>
            {otherModes.map((k) => (
              <Link
                key={k}
                href={modePath[k]}
                onClick={() => rememberKind(k)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-slate-300 hover:text-slate-900 transition-colors text-center max-w-[9.5rem] min-[390px]:max-w-none leading-tight"
              >
                {(() => {
                  const ModeIcon = modeLandingVisual[k].Icon;
                  return <ModeIcon className="h-3.5 w-3.5 shrink-0" />;
                })()}
                {subjectKindMeta[k].label}
                <ChevronRight className="h-3 w-3 opacity-60" />
              </Link>
            ))}
          </nav>
          {!isAdmin && (
            <Link
              href="/admin/login"
              className="text-[10px] font-black text-slate-500 hover:text-teal-600 tracking-wide transition-colors"
            >
              관리자 로그인
            </Link>
          )}
          <div className="text-[10px] text-slate-400 font-bold text-center leading-relaxed space-y-1">
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
