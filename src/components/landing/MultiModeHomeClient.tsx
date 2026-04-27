"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import { FlowTopNav } from "@/components/layout/FlowTopNav";

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
  orgManageHref?: string | null;
}

export default function MultiModeHomeClient({
  session,
  isAdmin,
  adminEntryLink,
  adminButtonLabel,
  orgManageHref = null,
}: MultiModeHomeClientProps) {
  const router = useRouter();
  const [selectedKind, setSelectedKind] = useState<SubjectKind | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const heroTitle = "당신의 일상을 지키는 가장 스마트한 선택,\nLink-U";
  const heroBody =
    "반려동물·어르신·아이·수하물·주얼리까지.\n링크유는 스캔 이후의 안내와 연결 흐름을 쉽고 다정하게 이어줍니다.";
  const selectedMeta = selectedKind ? subjectKindMeta[selectedKind] : null;
  const networkNodes = useMemo(
    () => [
      { id: "n1", x: 8, y: 18 },
      { id: "n2", x: 24, y: 12 },
      { id: "n3", x: 39, y: 24 },
      { id: "n4", x: 56, y: 14 },
      { id: "n5", x: 73, y: 22 },
      { id: "n6", x: 89, y: 16 },
      { id: "n7", x: 14, y: 48 },
      { id: "n8", x: 30, y: 42 },
      { id: "n9", x: 49, y: 52 },
      { id: "n10", x: 66, y: 45 },
      { id: "n11", x: 84, y: 50 },
      { id: "n12", x: 20, y: 74 },
      { id: "n13", x: 44, y: 78 },
      { id: "n14", x: 64, y: 72 },
      { id: "n15", x: 84, y: 80 },
    ],
    []
  );
  const networkLines = useMemo(() => {
    const lines: Array<{ id: string; from: (typeof networkNodes)[number]; to: (typeof networkNodes)[number] }> = [];
    for (let i = 0; i < networkNodes.length; i += 1) {
      for (let j = i + 1; j < networkNodes.length; j += 1) {
        const a = networkNodes[i];
        const b = networkNodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 24) lines.push({ id: `${a.id}-${b.id}`, from: a, to: b });
      }
    }
    return lines;
  }, [networkNodes]);

  const handleModeClick = (kind: SubjectKind) => {
    if (isRouting) return;
    setSelectedKind(kind);
    setIsRouting(true);
    window.setTimeout(() => {
      router.push(`/${kind}?from=home`);
    }, 260);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/45 via-amber-50/35 to-slate-50 font-outfit overflow-hidden relative">
      <FlowTopNav variant="landing" session={session} isAdmin={isAdmin} orgManageHref={orgManageHref} />
      <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-rose-300/30 blur-3xl" />
      <div className="pointer-events-none absolute top-[35%] -left-20 h-64 w-64 rounded-full bg-amber-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-[15%] h-64 w-64 rounded-full bg-teal-200/30 blur-3xl" />

      <main className="relative z-10 mx-auto flex w-full max-w-screen-sm flex-col gap-5 px-4 pb-9 pt-7 min-[390px]:gap-6 min-[390px]:pb-10 min-[390px]:pt-8 min-[430px]:px-5">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[36px] border border-rose-100/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setPointer({
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100,
            });
          }}
          onMouseLeave={() => setPointer(null)}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            if (!touch) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setPointer({
              x: ((touch.clientX - rect.left) / rect.width) * 100,
              y: ((touch.clientY - rect.top) / rect.height) * 100,
            });
          }}
        >
          <Image
            src="/images/hero-bg.png"
            alt="Link-U 메인 히어로 배경"
            fill
            priority
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,247,237,0.92),rgba(236,253,245,0.9))]" />
          <motion.div
            aria-hidden
            className="absolute inset-0 opacity-55"
            style={{
              backgroundImage:
                "linear-gradient(120deg, rgba(20,184,166,0.08) 0%, rgba(99,102,241,0.08) 20%, transparent 40%, rgba(45,212,191,0.08) 60%, transparent 100%)",
              backgroundSize: "220% 100%",
            }}
            animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <svg aria-hidden className="absolute inset-0 h-full w-full">
            {networkLines.map((line) => {
              const mx = (line.from.x + line.to.x) / 2;
              const my = (line.from.y + line.to.y) / 2;
              const active = pointer ? Math.hypot(mx - pointer.x, my - pointer.y) < 20 : false;
              return (
                <line
                  key={line.id}
                  x1={`${line.from.x}%`}
                  y1={`${line.from.y}%`}
                  x2={`${line.to.x}%`}
                  y2={`${line.to.y}%`}
                  stroke={active ? "rgba(13,148,136,0.45)" : "rgba(100,116,139,0.18)"}
                  strokeWidth={active ? 1.4 : 1}
                />
              );
            })}
          </svg>
          {networkNodes.map((node, idx) => {
            const active = pointer ? Math.hypot(node.x - pointer.x, node.y - pointer.y) < 12 : false;
            return (
              <motion.span
                key={node.id}
                aria-hidden
                className={cn(
                  "absolute z-[2] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-teal-400/80 shadow-[0_0_0_4px_rgba(20,184,166,0.12)]",
                  active && "bg-cyan-400 shadow-[0_0_0_6px_rgba(34,211,238,0.18)]"
                )}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                animate={{ scale: active ? 1.35 : [1, 1.15, 1], opacity: active ? 1 : [0.55, 1, 0.55] }}
                transition={{ duration: active ? 0.2 : 2.8 + (idx % 4) * 0.35, repeat: active ? 0 : Infinity }}
              />
            );
          })}

          <div className="relative z-10 px-5 pb-6 pt-6 min-[390px]:px-6 min-[390px]:pb-7 min-[390px]:pt-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-3 py-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-teal-500" />
              <span className="text-[10px] font-extrabold tracking-[0.1em] text-teal-700">링크유 · 스마트 NFC 플랫폼</span>
            </div>
            <h1 className="whitespace-pre-line text-[25px] font-black leading-[1.22] tracking-tight text-slate-900 break-keep [word-break:keep-all] min-[390px]:text-[27px] min-[430px]:text-[28px]">
              {heroTitle}
            </h1>
            <p className="mt-2.5 whitespace-pre-line text-[12px] font-semibold leading-relaxed text-slate-600 break-keep [word-break:keep-all] min-[390px]:mt-3 min-[390px]:text-[13px]">
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
            <p className="text-[11px] font-black tracking-wider text-teal-600">태그 스캔 후 모드 선택</p>
            <p className="text-[11px] font-bold text-slate-400">5가지 전용 흐름</p>
          </div>
          <div className="pointer-events-none relative mb-2.5 h-16 overflow-hidden rounded-2xl border border-teal-100/80 bg-gradient-to-r from-teal-50/70 via-white to-cyan-50/70">
            <motion.span
              className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-300/70"
              animate={{ scale: [1, 1.85], opacity: [0.65, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/70"
              animate={{ scale: [1, 2.2], opacity: [0.45, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
            />
            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500 shadow-[0_0_0_6px_rgba(20,184,166,0.16)]" />
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
                    "group relative flex min-h-12 items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-left transition min-[390px]:px-4 min-[390px]:py-3",
                    "hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md",
                    isRouting && !isActive && "opacity-70",
                    isActive && "border-teal-300 shadow-md"
                  )}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(120deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.08)_36%,rgba(203,213,225,0.18)_52%,rgba(255,255,255,0.06)_74%,rgba(255,255,255,0.24)_100%)]"
                  />
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
                      <p className="text-[13px] font-black text-slate-900 min-[390px]:text-sm break-keep [word-break:keep-all] leading-snug">
                        {meta.label}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-500 leading-snug break-keep [word-break:keep-all]">
                        {meta.description}
                      </p>
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

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.45 }}
          className="rounded-[26px] border border-teal-100/90 bg-gradient-to-br from-teal-50/95 to-white p-[18px] shadow-[0_12px_30px_rgba(15,23,42,0.05)] min-[390px]:rounded-[28px] min-[390px]:p-5"
        >
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">보호자 이용 순서</p>
          <ol className="list-inside list-decimal space-y-2 text-[12px] font-semibold leading-relaxed text-slate-700">
            <li>
              <span className="text-slate-900">모드</span>를 고른 뒤 로그인합니다.
            </li>
            <li>
              <span className="text-slate-900">대시보드</span>에서 관리 대상을 등록하고 NFC 태그를 연결합니다.
            </li>
            <li>
              조직(B2B)이 필요하면 <span className="text-slate-900">허브</span>에서 조직 대시보드로 전환합니다.
            </li>
          </ol>
        </motion.section>

        <section className="space-y-3.5 rounded-[26px] border border-slate-200/80 bg-white p-[18px] shadow-[0_12px_30px_rgba(15,23,42,0.05)] min-[390px]:space-y-4 min-[390px]:rounded-[28px] min-[390px]:p-5">
          <div className="space-y-2 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">FOR FINDER & OWNER</p>
            <h2 className="whitespace-pre-line text-[22px] font-black leading-tight text-slate-900 break-keep [word-break:keep-all]">
              {"태그를 스캔했다면\n이렇게 진행하세요"}
            </h2>
          </div>

          {!session && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="mb-1.5 flex items-center gap-2 text-slate-800">
                <HeartHandshake className="h-4 w-4 text-teal-600" />
                <p className="text-[12px] font-black">발견자 안내</p>
              </div>
              <p className="whitespace-pre-line text-[12px] font-semibold leading-relaxed text-slate-600 break-keep [word-break:keep-all]">
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
            {session ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-1.5 text-[11px] font-black text-teal-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
                {session.user.name}님 로그인 상태
              </div>
            ) : (
              <p className="text-center text-[12px] font-semibold text-slate-500 break-keep [word-break:keep-all]">
                각 모드 페이지에서 보호자 등록 및 로그인을 진행할 수 있습니다.
              </p>
            )}
          </div>
        </section>

        <footer className="pt-1 text-center">
          <div className="space-y-1 text-[10px] font-bold text-slate-400 leading-relaxed">
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
