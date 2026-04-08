"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubjectKind } from "@/lib/subject-kind";
import { SUBJECT_KINDS, subjectKindMeta } from "@/lib/subject-kind";
import { modeLandingCopy, modeLandingVisual } from "@/lib/mode-landing-content";

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
}

export default function ModeGateLanding({ kind, session, isAdmin }: ModeGateLandingProps) {
  const visual = modeLandingVisual[kind];
  const copy = modeLandingCopy[kind];
  const meta = subjectKindMeta[kind];
  const Icon = visual.Icon;

  const dashboardUrl = `/dashboard?kind=${encodeURIComponent(kind)}`;
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(dashboardUrl)}`;

  const guardianEntryLink = session ? (isAdmin ? "/admin" : dashboardUrl) : loginUrl;
  const guardianButtonLabel = session
    ? isAdmin
      ? "관리자 센터 바로가기"
      : `${meta.label} 대시보드`
    : `${meta.label} · 보호자로 시작하기`;

  const otherModes = SUBJECT_KINDS.filter((k) => k !== kind);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit overflow-hidden relative">
      <div
        className={cn("absolute top-[-10%] right-[-10%] w-[80%] h-[40%] blur-[120px] rounded-full", visual.blobA)}
      />
      <div
        className={cn("absolute bottom-[-10%] left-[-10%] w-[80%] h-[40%] blur-[120px] rounded-full", visual.blobB)}
      />

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full relative z-10">
        <section className="relative px-4 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[4/5] w-full rounded-[48px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-4 border-white"
          >
            {visual.heroImageSrc ? (
              <Image
                src={visual.heroImageSrc}
                alt={visual.heroAlt}
                fill
                className="object-cover scale-110"
                priority
              />
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute top-6 right-6 glass px-5 py-2.5 rounded-2xl flex items-center gap-2"
            >
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{visual.badge}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
              className="absolute bottom-10 left-6 bg-white/90 backdrop-blur-md p-3 rounded-[24px] shadow-xl flex items-center gap-3 border border-white"
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

        <section className="flex-1 flex flex-col px-8 pt-8 pb-12 space-y-8 bg-white/80 backdrop-blur-sm rounded-[40px] border border-slate-100/80 shadow-[0_8px_32px_rgba(15,23,42,0.06)]">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <div className={cn("flex items-center gap-2 font-bold text-xs uppercase tracking-widest", visual.sheetAccent)}>
              <Sparkles className="w-4 h-4" />
              {copy.kicker}
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight">
              {copy.titleLine1} <br />
              <span
                className={cn(
                  "text-transparent bg-clip-text bg-gradient-to-r",
                  visual.titleGradientFrom,
                  visual.titleGradientTo
                )}
              >
                {copy.titleGradient}
              </span>
            </h1>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">{copy.subline}</p>
            {!session && (
              <div className={cn("rounded-2xl border px-4 py-3 text-left", visual.finderBoxBorder, visual.finderBoxBg)}>
                <p className={cn("text-[11px] font-black", visual.finderTitleClass)}>{copy.finderTitle}</p>
                <ul className={cn("mt-2 space-y-1.5 text-[10px] font-bold leading-relaxed", visual.finderBodyClass)}>
                  {copy.finderLines.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full space-y-6 pt-2"
          >
            <Link href={guardianEntryLink} className="block w-full group">
              <button
                type="button"
                className={cn(
                  "w-full h-18 flex items-center justify-center gap-3 rounded-[28px] text-lg font-black shadow-2xl transition-all active:scale-95 group-hover:-translate-y-1 duration-300",
                  isAdmin ? "bg-slate-900 text-white shadow-slate-200" : visual.buttonClass
                )}
              >
                <AnimatePresence mode="wait">
                  {isAdmin ? (
                    <motion.div key="admin" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                      <ShieldCheck className="w-6 h-6 text-teal-400" />
                    </motion.div>
                  ) : (
                    <motion.div key="user" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                      <LayoutDashboard className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
                {guardianButtonLabel}
                <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </Link>

            <div className="flex flex-col items-center gap-4">
              {!session ? (
                <p className="text-sm text-slate-400 font-bold text-center">
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

        <footer className="px-8 pb-10 pt-2 bg-white/40 flex flex-col items-center gap-4">
          <nav className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
            <Link href="/" className="hover:text-slate-600 transition-colors">
              전체 홈
            </Link>
            {otherModes.map((k) => (
              <Link key={k} href={modePath[k]} className="hover:text-slate-600 transition-colors">
                {subjectKindMeta[k].label}
              </Link>
            ))}
          </nav>
          {!isAdmin && (
            <Link
              href="/admin/login"
              className="text-[10px] font-black text-slate-300 hover:text-teal-400 tracking-widest uppercase transition-colors"
            >
              Seller Access Center
            </Link>
          )}
          <p className="text-[10px] text-slate-300 font-bold tracking-widest uppercase text-center leading-loose">
            링크유 Link-U · {meta.label}
          </p>
        </footer>
      </main>
    </div>
  );
}
