"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Briefcase,
  type LucideIcon,
  LayoutDashboard,
  PawPrint,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";

const modeIcons: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
};

interface MultiModeHomeClientProps {
  session: { user: { name?: string | null } } | null;
  isAdmin: boolean;
  guardianEntryLink: string;
  guardianButtonLabel: string;
}

export default function MultiModeHomeClient({
  session,
  isAdmin,
  guardianEntryLink,
  guardianButtonLabel,
}: MultiModeHomeClientProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit overflow-hidden relative">
      <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full relative z-10 px-4 pt-8 pb-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[40px] overflow-hidden border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] bg-gradient-to-br from-slate-800 via-slate-900 to-teal-900 aspect-[5/4] flex flex-col items-center justify-center text-center px-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.15),transparent_50%)]" />
          <Sparkles className="w-10 h-10 text-teal-300 mb-4 relative z-10" />
          <h1 className="text-2xl font-black text-white tracking-tight relative z-10">링크유</h1>
          <p className="text-sm text-slate-300 mt-3 font-medium leading-relaxed relative z-10">
            NFC로 반려동물·어르신·아이·링크유 - 캐리까지
            <br />
            한 번에 연결하는 스마트 명함 · Link-U
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-[260px] relative z-10">
            {SUBJECT_KINDS.map((k) => {
              const Icon = modeIcons[k];
              const meta = subjectKindMeta[k];
              return (
                <Link
                  key={k}
                  href={`/${k}`}
                  className="flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-3 hover:bg-white/20 transition-colors"
                >
                  <Icon className="w-5 h-5 text-teal-300 shrink-0" />
                  <span className="text-left text-[11px] font-black text-white leading-tight">{meta.label}</span>
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
              반려동물용 인식표는 <span className="text-slate-800 font-bold">반려동물</span>, 수하물·캐리어는{" "}
              <span className="text-slate-800 font-bold">링크유 - 캐리</span> 전용 화면에서 보호자로 시작할 수
              있어요.
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

          <Link href={guardianEntryLink} className="block w-full group">
            <button
              type="button"
              className={cn(
                "w-full h-16 flex items-center justify-center gap-3 rounded-[28px] text-base font-black shadow-xl transition-all active:scale-95 group-hover:-translate-y-0.5 duration-300",
                isAdmin ? "bg-slate-900 text-white shadow-slate-200" : "bg-teal-500 text-white shadow-teal-500/20"
              )}
            >
              {isAdmin ? (
                <ShieldCheck className="w-6 h-6 text-teal-400" />
              ) : (
                <LayoutDashboard className="w-6 h-6" />
              )}
              {guardianButtonLabel}
              <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </Link>

          {!session ? (
            <p className="text-sm text-slate-400 font-bold text-center">
              처음이시면 위 버튼으로 로그인 후 사용할 모드를 선택할 수 있어요.
            </p>
          ) : (
            <div className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 rounded-full text-xs font-black text-slate-500 border border-white shadow-sm mx-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              {session.user.name}님으로 입장함
            </div>
          )}
        </section>

        <footer className="px-4 pb-10 pt-4 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-3 opacity-30 grayscale">
            <ShieldCheck className="w-4 h-4" />
            <Sparkles className="w-4 h-4" />
          </div>
          {!isAdmin && (
            <Link
              href="/admin/login"
              className="text-[10px] font-black text-slate-300 hover:text-teal-400 tracking-widest uppercase transition-colors"
            >
              Seller Access Center
            </Link>
          )}
          <p className="text-[10px] text-slate-300 font-bold tracking-widest uppercase text-center leading-loose">
            링크유 Link-U © 2024 <br /> All Rights Reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
