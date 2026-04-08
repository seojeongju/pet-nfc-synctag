"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Baby,
  Briefcase,
  Gem,
  HeartHandshake,
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

const modeDescriptions: Record<SubjectKind, string> = {
  pet: "반려동물 실종 대응 · 보호자 정보 확인",
  elder: "어르신 케어 · 긴급 연락 지원",
  child: "아이 안전 · 보호자 연결 안내",
  luggage: "수하물 분실 대응 · 소유자 연결",
  gold: "주얼리 인증 · 분실 방지 안내",
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
  const router = useRouter();
  const [selectedKind, setSelectedKind] = useState<SubjectKind | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const heroTitle = "제품에 맞는 NFC /BLE 경험을\n정확하게 시작하세요";
  const heroBody =
    "반려동물·어르신·아이·수하물·주얼리까지.\n링크유는 태그 스캔 이후의 안내와 연결 경험을 깔끔하게 완성합니다.";
  const selectedMeta = selectedKind ? subjectKindMeta[selectedKind] : null;

  const handleModeClick = (kind: SubjectKind) => {
    if (isRouting) return;
    setSelectedKind(kind);
    setIsRouting(true);
    window.setTimeout(() => {
      router.push(`/${kind}?from=home`);
    }, 260);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-outfit overflow-hidden relative">
      <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-[35%] -left-20 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-[15%] h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-5 px-3.5 pb-9 pt-7 min-[390px]:gap-6 min-[390px]:px-4 min-[390px]:pb-10 min-[390px]:pt-8 min-[430px]:px-5">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[36px] border border-white/40 bg-slate-950 shadow-[0_28px_80px_rgba(15,23,42,0.3)]"
        >
          <Image
            src="/images/hero-bg.png"
            alt="Link-U 메인 히어로 배경"
            fill
            priority
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(2,6,23,0.9),rgba(15,23,42,0.55),rgba(8,47,73,0.65))]" />

          <div className="relative z-10 px-5 pb-6 pt-6 min-[390px]:px-6 min-[390px]:pb-7 min-[390px]:pt-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200/35 bg-white/10 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-200" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal-100">SMART NFC PLATFORM</span>
            </div>
            <h1 className="whitespace-pre-line text-[25px] font-black leading-[1.15] tracking-tight text-white min-[390px]:text-[27px] min-[430px]:text-[28px]">
              {heroTitle}
            </h1>
            <p className="mt-2.5 whitespace-pre-line text-[12px] font-semibold leading-relaxed text-slate-200/95 min-[390px]:mt-3 min-[390px]:text-[13px]">
              {heroBody}
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className="rounded-[30px] border border-slate-200/80 bg-white/90 p-3.5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur min-[390px]:rounded-[32px] min-[390px]:p-4"
        >
          <LayoutGroup id="mode-cards">
          <div className="mb-2.5 flex items-center justify-between px-1 min-[390px]:mb-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-teal-600">Mode Select</p>
            <p className="text-[11px] font-bold text-slate-400">5가지 전용 흐름</p>
          </div>
          <AnimatePresence>
            {selectedMeta ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-2"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-[11px] font-black text-teal-700">
                  <motion.span layoutId="active-mode-dot" className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  {selectedMeta.label} 이동 중...
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div className="grid grid-cols-1 gap-2">
            {SUBJECT_KINDS.map((k) => {
              const Icon = modeIcons[k];
              const meta = subjectKindMeta[k];
              const isActive = selectedKind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleModeClick(k)}
                  disabled={isRouting}
                  className={cn(
                    "group relative flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-left transition min-[390px]:px-4 min-[390px]:py-3",
                    "hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md",
                    isRouting && !isActive && "opacity-70",
                    isActive && "border-teal-300 shadow-md"
                  )}
                >
                  {isActive ? (
                    <motion.div
                      layoutId="active-mode-bg"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50"
                      transition={{ type: "spring", stiffness: 360, damping: 32 }}
                    />
                  ) : null}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 min-[390px]:h-9 min-[390px]:w-9", isActive && "bg-teal-100")}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="relative z-10 min-w-0">
                      <p className="truncate text-[13px] font-black text-slate-900 min-[390px]:text-sm">{meta.label}</p>
                      <p className="truncate text-[11px] font-semibold text-slate-500">{modeDescriptions[k]}</p>
                    </div>
                  </div>
                  <ArrowRight className={cn("relative z-10 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-500", isActive && "text-teal-500")} />
                  {isActive ? <motion.span layoutId="active-mode-dot" className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-teal-500" /> : null}
                </button>
              );
            })}
          </div>
          </LayoutGroup>
        </motion.section>

        <section className="space-y-3.5 rounded-[26px] border border-slate-200/80 bg-white p-[18px] shadow-[0_12px_30px_rgba(15,23,42,0.05)] min-[390px]:space-y-4 min-[390px]:rounded-[28px] min-[390px]:p-5">
          <div className="space-y-2 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">FOR FINDER & OWNER</p>
            <h2 className="whitespace-pre-line text-[22px] font-black leading-tight text-slate-900">
              {"태그를 스캔했다면\n이렇게 진행하세요"}
            </h2>
          </div>

          {!session && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="mb-1.5 flex items-center gap-2 text-slate-800">
                <HeartHandshake className="h-4 w-4 text-teal-600" />
                <p className="text-[12px] font-black">발견자 안내</p>
              </div>
              <p className="whitespace-pre-line text-[12px] font-semibold leading-relaxed text-slate-600">
                {"로그인 없이 태그 URL을 그대로 열어 주세요.\n예: /t/태그번호"}
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <Link href={adminEntryLink} className="group inline-flex w-full">
              <button
                type="button"
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-black shadow-sm transition active:scale-[0.98]",
                  isAdmin
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <ShieldCheck className={cn("h-4 w-4", isAdmin ? "text-teal-300" : "text-slate-500")} />
                {adminButtonLabel}
              </button>
            </Link>
            {session && !isAdmin ? (
              <Link href="/hub" className="text-xs font-black text-teal-600 underline-offset-4 hover:text-teal-700 hover:underline">
                로그인한 보호자 · 대시보드로 이동
              </Link>
            ) : null}
            {session ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-1.5 text-[11px] font-black text-teal-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
                {session.user.name}님 로그인 상태
              </div>
            ) : (
              <p className="text-center text-[12px] font-semibold text-slate-500">
                각 모드 페이지에서 보호자 등록 및 로그인을 진행할 수 있습니다.
              </p>
            )}
          </div>
        </section>

        <footer className="pt-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-300">
            Link-U © 2024
          </p>
        </footer>
      </main>
    </div>
  );
}
