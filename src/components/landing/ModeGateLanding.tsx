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
  fromHome?: boolean;
}

export default function ModeGateLanding({ kind, session, isAdmin, fromHome = false }: ModeGateLandingProps) {
  const visual = modeLandingVisual[kind];
  const copy = modeLandingCopy[kind];
  const meta = subjectKindMeta[kind];
  const Icon = visual.Icon;

  const dashboardUrl = `/dashboard?kind=${encodeURIComponent(kind)}`;
  const loginUrl = `/login?kind=${encodeURIComponent(kind)}&callbackUrl=${encodeURIComponent(dashboardUrl)}`;

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

        <section className="flex-1 flex flex-col px-6 min-[390px]:px-8 pt-7 min-[390px]:pt-8 pb-11 min-[390px]:pb-12 space-y-7 min-[390px]:space-y-8 bg-white/85 backdrop-blur-sm rounded-[40px] border border-slate-100/90 shadow-[0_8px_32px_rgba(15,23,42,0.06)]">
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
            <h1 className="text-[28px] min-[390px]:text-3xl font-black text-slate-900 leading-[1.15] tracking-tight">
              {copy.titleLine1} 
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
            <p className="text-slate-600 text-[13px] min-[390px]:text-sm font-semibold leading-relaxed">{copy.subline}</p>
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
            transition={{ delay: fromHome ? 0.18 : 0.6 }}
            className="w-full space-y-6 pt-2"
          >
            <Link href={guardianEntryLink} className="block w-full group">
              <button
                type="button"
                className={cn(
                  "w-full h-16 min-[390px]:h-18 flex items-center justify-center gap-2.5 rounded-[26px] min-[390px]:rounded-[28px] text-base min-[390px]:text-lg font-black shadow-2xl transition-all active:scale-95 group-hover:-translate-y-1 group-hover:shadow-3xl duration-300 relative overflow-hidden border-2 border-white/20 ring-4 ring-black/5",
                  isAdmin ? "bg-slate-900 text-white shadow-slate-200" : visual.buttonClass
                )}
              >
                <div className="flex items-center justify-center gap-2.5 relative z-10">
                  <AnimatePresence mode="wait">
                    {isAdmin ? (
                      <motion.div key="admin" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                        <ShieldCheck className="w-6 h-6 text-teal-400" />
                      </motion.div>
                    ) : (
                      <motion.div key="user" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                        <LayoutDashboard className="w-5.5 h-5.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <span className="shrink-0">{guardianButtonLabel}</span>
                  <ArrowRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            </Link>

            <div className="flex flex-col items-center gap-4">
              {!session ? (
                <p className="text-sm text-slate-500 font-bold text-center">
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

        <footer className="px-6 min-[390px]:px-8 pb-10 pt-2 bg-white/50 flex flex-col items-center gap-4">
          <nav className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              전체 홈
            </Link>
            {otherModes.map((k) => (
              <Link key={k} href={modePath[k]} className="hover:text-slate-800 transition-colors">
                {subjectKindMeta[k].label}
              </Link>
            ))}
          </nav>
          {!isAdmin && (
            <Link
              href="/admin/login"
              className="text-[10px] font-black text-slate-400 hover:text-teal-500 tracking-widest uppercase transition-colors"
            >
              Seller Access Center
            </Link>
          )}
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase text-center leading-loose">
            링크유 Link-U · {meta.label}
          </p>
        </footer>
      </main>
    </div>
  );
}
