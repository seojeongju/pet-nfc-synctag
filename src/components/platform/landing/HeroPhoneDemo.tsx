"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BellRing, Check, MapPin, MessageSquare, Nfc, PawPrint, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCycle } from "@/components/platform/landing/motion-utils";

/**
 * 히어로 인포그래픽: 태그를 휴대폰에 대면 → 공개 연락 화면 → 보호자 알림.
 * 3단계를 순환하며 Link-U 안심의 핵심 흐름을 보여 준다.
 */
const STAGES = ["tap", "profile", "notify"] as const;

export function HeroPhoneDemo({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const idx = useCycle(STAGES.length, 2800, 1);
  const stage = STAGES[idx]!;

  return (
    <div className={cn("relative mx-auto flex items-center justify-center", className)} aria-hidden>
      {/* 배경 오브 */}
      <div className="absolute h-[78%] w-[78%] rounded-full bg-gradient-to-br from-teal-200/60 via-white to-rose-200/50 blur-2xl" />
      {/* NFC 파동 */}
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute left-[16%] top-[44%] h-24 w-24 rounded-full border border-teal-400/50"
            animate={stage === "tap" ? { scale: [0.6, 2.2], opacity: [0.7, 0] } : { opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
          />
        ))}

      {/* 태그 */}
      <motion.div
        className="absolute left-[4%] top-[40%] z-20"
        animate={
          reduce
            ? undefined
            : stage === "tap"
              ? { x: [0, 34, 34], y: [0, -6, -6], rotate: [-10, 0, 0] }
              : { x: 0, y: [0, -8, 0], rotate: -10 }
        }
        transition={stage === "tap" ? { duration: 1.2, ease: "easeOut" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center">
          <span className="h-7 w-7 rounded-full border-[6px] border-teal-500" />
          <span className="-mt-1.5 flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-[0_18px_36px_rgba(0,134,120,0.35)] ring-4 ring-white/80 lg:h-[104px] lg:w-[104px]">
            <Nfc className="h-6 w-6" />
            <span className="mt-1 text-[11px] font-black tracking-tight">LINK-U</span>
          </span>
        </div>
      </motion.div>

      {/* 휴대폰 */}
      <div className="relative z-10 ml-[18%] w-[210px] rounded-[38px] border border-slate-900/10 bg-slate-900 p-[7px] shadow-[0_40px_80px_rgba(15,23,42,0.28)] lg:w-[250px] lg:rounded-[44px] lg:p-2">
        <div className="relative h-[400px] overflow-hidden rounded-[32px] bg-gradient-to-b from-rose-50 via-white to-teal-50 lg:h-[470px] lg:rounded-[37px]">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
          <AnimatePresence mode="wait" initial={false}>
            {stage === "tap" && (
              <Screen key="tap">
                <motion.span
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 text-teal-600 ring-8 ring-teal-100/60"
                  animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <Nfc className="h-9 w-9" />
                </motion.span>
                <p className="mt-5 text-[15px] font-black text-slate-900">태그 인식 중…</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">앱 설치 없이 바로 열려요</p>
              </Screen>
            )}
            {stage === "profile" && (
              <Screen key="profile" align="top">
                <div className="mt-6 w-full rounded-3xl bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                      <PawPrint className="h-6 w-6" />
                    </span>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-teal-600">링크유-펫</p>
                      <p className="text-[16px] font-black text-slate-900">콩이를 찾아 주셨군요!</p>
                    </div>
                  </div>
                  <p className="mt-3 text-left text-[11px] font-semibold leading-relaxed text-slate-500">
                    보호자에게 바로 연락할 수 있어요. 위치는 동의할 때만 전달됩니다.
                  </p>
                </div>
                <div className="mt-3 grid w-full grid-cols-2 gap-2">
                  <ActionPill icon={Phone} label="전화" tone="teal" />
                  <ActionPill icon={MessageSquare} label="문자" tone="slate" />
                </div>
                <ActionPill icon={MapPin} label="현재 위치 보내기" tone="rose" className="mt-2 w-full" />
              </Screen>
            )}
            {stage === "notify" && (
              <Screen key="notify">
                <motion.div
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="absolute inset-x-3 top-10 flex items-start gap-2.5 rounded-2xl bg-white/95 p-3 text-left shadow-[0_14px_30px_rgba(15,23,42,0.14)] ring-1 ring-slate-100"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white">
                    <BellRing className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[11px] font-black text-slate-900">Link-U · 지금</span>
                    <span className="block text-[11px] font-semibold leading-snug text-slate-500">콩이 태그가 스캔됐어요. 발견 위치가 도착했습니다.</span>
                  </span>
                </motion.div>
                <div className="relative mt-16 h-36 w-full overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#E5F6F4,#FFF7ED)] ring-1 ring-slate-100">
                  <svg viewBox="0 0 200 140" className="absolute inset-0 h-full w-full text-teal-200">
                    <path d="M0 90 Q50 60 100 85 T200 70" stroke="currentColor" strokeWidth="10" fill="none" />
                    <path d="M60 0 L80 140" stroke="#FDE68A" strokeWidth="8" />
                    <path d="M150 0 L130 140" stroke="#E2E8F0" strokeWidth="6" />
                  </svg>
                  <motion.span
                    className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-rose-500 text-white shadow-lg"
                    animate={reduce ? undefined : { y: ["-100%", "-120%", "-100%"] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    <MapPin className="h-5 w-5" />
                  </motion.span>
                </div>
                <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-black text-teal-700">
                  <Check className="h-4 w-4" /> 보호자에게 전달 완료
                </p>
              </Screen>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 단계 표시 */}
      <div className="absolute -bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/90 px-3 py-2 shadow-md ring-1 ring-slate-100 lg:bottom-2">
        {["태그 스캔", "연락 화면", "보호자 알림"].map((label, i) => (
          <span
            key={label}
            className={cn(
              "whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-black transition-colors",
              i === idx ? "bg-teal-500 text-white" : "text-slate-400"
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Screen({ children, align = "center" }: { children: React.ReactNode; align?: "center" | "top" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "absolute inset-0 flex flex-col items-center px-4 pt-8 text-center",
        align === "center" ? "justify-center" : "justify-start"
      )}
    >
      {children}
    </motion.div>
  );
}

function ActionPill({
  icon: Icon,
  label,
  tone,
  className,
}: {
  icon: typeof Phone;
  label: string;
  tone: "teal" | "slate" | "rose";
  className?: string;
}) {
  const tones = {
    teal: "bg-teal-500 text-white",
    slate: "bg-white text-slate-700 ring-1 ring-slate-200",
    rose: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
  } as const;
  return (
    <span className={cn("inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl text-[12px] font-black", tones[tone], className)}>
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}
