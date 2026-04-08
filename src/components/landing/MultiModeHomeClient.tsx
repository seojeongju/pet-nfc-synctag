"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Briefcase,
  Gem,
  type LucideIcon,
  PawPrint,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";

const modeIcons: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

interface MultiModeHomeClientProps {
  session: { user: { name?: string | null } } | null;
  isAdmin: boolean;
  /** 관리자 콘솔 또는 관리자 로그인 (하단 소형 버튼 전용) */
  adminEntryLink: string;
  adminButtonLabel: string;
}

export default function MultiModeHomeClient({
  session,
  isAdmin,
  adminEntryLink,
  adminButtonLabel,
}: MultiModeHomeClientProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit overflow-hidden relative">
      <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full relative z-10 px-4 pt-8 pb-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[40px] overflow-hidden border-4 border-white shadow-[0_25px_60px_rgba(0,0,0,0.12)] bg-slate-950 aspect-[4/4.2] flex flex-col items-center justify-center text-center px-6 pb-10 pt-8"
        >
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.7 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            <Image
              src="/images/hero-bg.png"
              alt="Link-U Premium Background"
              fill
              className="object-cover"
              priority
            />
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-teal-950/80 z-1" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.2),transparent_60%)] z-1" />

          <Sparkles className="w-10 h-10 text-teal-300 mb-4 relative z-10 drop-shadow-[0_0_15px_rgba(94,234,212,0.5)]" />
          <h1 className="text-2xl font-black text-white tracking-tight relative z-10 drop-shadow-md">링크유</h1>
          <p className="text-sm text-slate-100 mt-3 font-semibold leading-relaxed relative z-10 drop-shadow-sm">
            NFC로 반려동물·어르신·아이·캐리어·골드(주얼리)까지
            <br />
            한 번에 연결하는 스마트한 관리 플랫폼 - Link-U
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2.5 w-full max-w-[320px] relative z-10">
            {SUBJECT_KINDS.map((k, i) => {
              const Icon = modeIcons[k];
              const meta = subjectKindMeta[k];
              const oddLast = i === SUBJECT_KINDS.length - 1 && SUBJECT_KINDS.length % 2 === 1;
              return (
                <Link
                  key={k}
                  href={`/${k}`}
                  className={cn(
                    "flex items-center justify-center gap-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 px-3 py-3.5 hover:bg-white/25 transition-all hover:scale-[1.02] active:scale-[0.98]",
                    oddLast && "col-span-2 w-full max-w-[200px] justify-self-center"
                  )}
                >
                  <Icon className="w-5 h-5 text-teal-300 shrink-0" />
                  <span className="text-center text-[11px] font-black text-white leading-tight">{meta.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.section>

        <section className="flex-1 flex flex-col mt-8 space-y-6 bg-white/50 backdrop-blur-sm rounded-t-[40px] border border-white/60 px-6 pt-8 pb-10 shadow-[0_-12px_40px_rgba(0,0,0,0.04)]">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
          <div className="space-y-2 text-center">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">Smart NFC</p>
            <h2 className="text-xl font-black text-slate-900 leading-snug">
              제품에 맞는 모드 안내 페이지로
              <br />
              들어가 보세요
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              반려동물은 <span className="text-slate-800 font-bold">링크유 - 펫</span>, 수하물은{" "}
              <span className="text-slate-800 font-bold">링크유 - 캐리</span>, 주얼리·인증 가치는{" "}
              <span className="text-slate-800 font-bold">링크유 - 골드</span> 전용 화면에서 보호자로 시작할 수 있어요.
            </p>
          </div>

          {!session && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-left">
              <p className="text-[11px] font-black text-slate-800">인식표만 스캔하셨나요?</p>
              <p className="text-[10px] font-bold text-slate-600 mt-1.5 leading-relaxed">
                발견자는 로그인 없이 <code className="text-[9px] bg-white px-1 rounded">/t/태그번호</code> 주소를
                그대로 열어 주세요.
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <Link href={adminEntryLink} className="group inline-flex">
              <button
                type="button"
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-xs font-black shadow-md transition-all active:scale-[0.98] group-hover:-translate-y-0.5",
                  isAdmin
                    ? "bg-slate-900 text-white shadow-slate-300/40 hover:bg-slate-800"
                    : "border border-slate-200 bg-white text-slate-700 shadow-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <ShieldCheck className={cn("h-4 w-4", isAdmin ? "text-teal-400" : "text-slate-500")} />
                {adminButtonLabel}
                <ArrowRight className="h-3.5 w-3.5 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-80" />
              </button>
            </Link>
            <p className="text-center text-[11px] font-bold leading-relaxed text-slate-400">
              판매·재고·시스템 관리는 위 관리자 메뉴를 이용해 주세요.
            </p>
            {session && !isAdmin && (
              <Link
                href="/hub"
                className="text-xs font-black text-teal-600 underline-offset-4 hover:text-teal-700 hover:underline"
              >
                로그인한 보호자 · 대시보드로 이동
              </Link>
            )}
            {session ? (
              <div className="flex items-center justify-center gap-2 rounded-full border border-white bg-slate-100 px-5 py-2 text-xs font-black text-slate-500 shadow-sm">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
                {session.user.name}님으로 로그인됨
              </div>
            ) : (
              <p className="text-center text-sm font-bold text-slate-400">
                위 카드에서 제품에 맞는 모드를 누르면 해당 안내와 보호자 로그인으로 이어져요.
              </p>
            )}
          </div>
        </section>

        <footer className="px-4 pb-10 pt-4 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-3 opacity-30 grayscale">
            <ShieldCheck className="w-4 h-4" />
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-[10px] text-slate-300 font-bold tracking-widest uppercase text-center leading-loose">
            링크유 Link-U © 2024 <br /> All Rights Reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
