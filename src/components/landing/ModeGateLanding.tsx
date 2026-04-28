"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Home,
  LogIn,
  ChevronRight,
  ScanLine,
  Link2,
  UserRoundCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubjectKind } from "@/lib/subject-kind";
import { SUBJECT_KINDS, subjectKindMeta } from "@/lib/subject-kind";
import { modeLandingCopy, modeLandingVisual } from "@/lib/mode-landing-content";
import { FlowTopNav } from "@/components/layout/FlowTopNav";

const modePath: Record<SubjectKind, string> = {
  pet: "/pet",
  elder: "/elder",
  child: "/child",
  luggage: "/luggage",
  gold: "/gold",
};

const modeProgramLabel: Record<SubjectKind, string> = {
  pet: "링크유-펫",
  elder: "링크유-메모리",
  child: "링크유-키즈",
  luggage: "링크유-러기지",
  gold: "링크유-골드",
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
  const loginUrl = `/login?kind=${encodeURIComponent(kind)}&callbackUrl=${encodeURIComponent(dashboardUrl)}`;

  const guardianEntryLink = session ? (isAdmin ? "/admin" : dashboardUrl) : loginUrl;
  const guardianButtonLabel = session
    ? isAdmin
      ? "관리자 센터 바로가기"
      : `${meta.label} 대시보드`
    : `${meta.label} · 보호자로 시작하기`;

  const otherModes = SUBJECT_KINDS.filter((k) => k !== kind);
  const [openFinderStep, setOpenFinderStep] = useState<Record<number, boolean>>({});
  const finderStepMeta = [
    { id: "open", title: "안내 페이지 열기", Icon: ScanLine },
    { id: "url", title: "정확한 주소 확인", Icon: Link2 },
    { id: "owner", title: "보호자 연결", Icon: UserRoundCheck },
  ] as const;

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
            <h1 className="text-[22px] min-[360px]:text-[26px] min-[390px]:text-3xl font-black text-slate-900 leading-[1.25] tracking-tight break-keep [word-break:keep-all]">
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
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-3.5 py-3 shadow-sm">
              <p className="text-slate-600 text-[12px] min-[390px]:text-sm font-semibold leading-relaxed break-keep [word-break:keep-all]">
                {copy.subline}
              </p>
            </div>
            {!session && (
              <div className={cn("rounded-2xl border px-4 py-3 text-left", visual.finderBoxBorder, visual.finderBoxBg)}>
                <p className={cn("text-[11px] font-black", visual.finderTitleClass)}>{copy.finderTitle}</p>
                <div className="mt-2 grid grid-cols-1 gap-2 min-[390px]:grid-cols-3">
                  {copy.finderLines.map((line, index) => {
                    const step = finderStepMeta[index];
                    const StepIcon = step?.Icon ?? ScanLine;
                    const title = step?.title ?? `안내 ${index + 1}`;
                    const expanded = Boolean(openFinderStep[index]);
                    return (
                      <article
                        key={`finder-${index}`}
                        className="rounded-xl border border-white/70 bg-white/70 px-2.5 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFinderStep((prev) => ({ ...prev, [index]: !prev[index] }))
                          }
                          aria-expanded={expanded}
                          className="flex w-full min-w-0 items-center gap-2 rounded-lg text-left transition hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70"
                        >
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700">
                            <StepIcon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-800 break-keep [word-break:keep-all]">
                              {title}
                            </p>
                            <p className="text-[9px] font-semibold text-slate-500">{index + 1}단계</p>
                          </div>
                        </button>
                        <div
                          className={cn(
                            "grid transition-all duration-300",
                            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          )}
                        >
                          <div className="overflow-hidden">
                            <p
                              className={cn(
                                "mt-1.5 text-[10px] font-bold leading-relaxed break-keep [word-break:keep-all]",
                                visual.finderBodyClass
                              )}
                            >
                              {line}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <p className={cn("mt-2 text-[10px] font-bold break-keep [word-break:keep-all]", visual.finderBodyClass)}>
                  단계를 누르면 설명이 펼쳐지고, 다시 누르면 접힙니다.
                </p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: fromHome ? 0.18 : 0.6 }}
            className="w-full space-y-6 pt-2"
          >
            <Link
              href={guardianEntryLink}
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
                <p className="text-xs min-[390px]:text-sm text-slate-500 font-bold text-center px-1 leading-relaxed break-keep [word-break:keep-all] max-w-[min(100%,22rem)] mx-auto">
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
          <nav className="flex flex-wrap justify-center gap-2 max-w-full px-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] min-[390px]:text-[11px] font-black text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors break-keep [word-break:keep-all]"
            >
              <Home className="h-3.5 w-3.5 shrink-0" />
              <span className="leading-tight">링크유 홈</span>
            </Link>
            {otherModes.map((k) => (
              <Link
                key={k}
                href={modePath[k]}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] min-[390px]:text-[11px] font-black text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors text-center max-w-full min-[390px]:max-w-none break-keep [word-break:keep-all]"
              >
                {(() => {
                  const ModeIcon = modeLandingVisual[k].Icon;
                  return <ModeIcon className="h-3.5 w-3.5 shrink-0" />;
                })()}
                <span className="leading-tight">{modeProgramLabel[k]}</span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </Link>
            ))}
          </nav>
          {!isAdmin && (
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-colors break-keep [word-break:keep-all]"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              <span className="leading-tight">링크유 관리자 로그인</span>
            </Link>
          )}
          <div className="text-[10px] text-slate-400 font-bold text-center leading-relaxed break-keep [word-break:keep-all] space-y-1">
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
