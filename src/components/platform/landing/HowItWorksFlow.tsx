"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BellRing, Nfc, Smartphone, Tag, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/platform/landing/motion-utils";
import { cn } from "@/lib/utils";

const STEPS: Array<{ icon: LucideIcon; title: string; body: string; tone: string }> = [
  { icon: Tag, title: "태그 부착", body: "목줄·가방·열쇠·매장 카운터 어디든", tone: "bg-amber-50 text-amber-600 ring-amber-100" },
  { icon: Nfc, title: "휴대폰을 대면", body: "NFC가 1초 만에 주소를 전달", tone: "bg-teal-50 text-teal-600 ring-teal-100" },
  { icon: Smartphone, title: "앱 없이 열림", body: "연락·명함·Wi-Fi 등 서비스 화면", tone: "bg-sky-50 text-sky-600 ring-sky-100" },
  { icon: BellRing, title: "즉시 연결", body: "보호자 알림·연락처 저장·접속 완료", tone: "bg-rose-50 text-rose-500 ring-rose-100" },
];

/** 작동 원리 인포그래픽: 4단계 + 데이터가 흐르는 연결선 */
export function HowItWorksFlow() {
  const reduce = useReducedMotion();
  return (
    <div className="relative">
      {/* PC: 가로 연결선 + 흐르는 점 */}
      <div className="absolute left-[12.5%] right-[12.5%] top-[44px] hidden h-[2px] lg:block" aria-hidden>
        <div className="h-full w-full bg-[repeating-linear-gradient(90deg,#99DCD5_0,#99DCD5_8px,transparent_8px,transparent_16px)]" />
        {!reduce && (
          <motion.span
            className="absolute -top-[5px] h-3 w-3 rounded-full bg-teal-500 shadow-[0_0_0_6px_rgba(0,168,150,0.18)]"
            animate={{ left: ["0%", "100%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      {/* 휴대폰: 세로 연결선 */}
      <div className="absolute bottom-10 left-[27px] top-10 w-[2px] bg-[repeating-linear-gradient(180deg,#99DCD5_0,#99DCD5_6px,transparent_6px,transparent_12px)] lg:hidden" aria-hidden>
        {!reduce && (
          <motion.span
            className="absolute -left-[4px] h-2.5 w-2.5 rounded-full bg-teal-500"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      <ol className="relative grid grid-cols-1 gap-3 lg:grid-cols-4 lg:gap-6">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.title}>
              <Reveal delay={i * 0.08} className="flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
                <span className={cn("relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 shadow-sm lg:h-[88px] lg:w-[88px] lg:rounded-[28px]", s.tone)}>
                  <Icon className="h-6 w-6 lg:h-8 lg:w-8" aria-hidden />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white lg:h-6 lg:w-6 lg:text-[11px]">
                    {i + 1}
                  </span>
                </span>
                <div className="min-w-0 pt-1 lg:pt-5">
                  <p className="text-[15px] font-black text-slate-900 lg:text-lg">{s.title}</p>
                  <p className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-500 break-keep [word-break:keep-all] lg:text-[14px]">{s.body}</p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
