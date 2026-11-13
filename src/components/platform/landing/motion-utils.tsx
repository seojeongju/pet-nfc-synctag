"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 스크롤로 보일 때 아래에서 떠오르는 등장 효과 */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 22,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** 화면에 보이면 0부터 목표값까지 올라가는 숫자 */
export function CountUp({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  // 서버 렌더·JS 지연 시에도 실제 값이 보이도록 목표값으로 시작하고, 보일 때만 0부터 다시 센다.
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (!inView || reduce) return;
    setValue(0);
    const controls = animate(0, to, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {value.toLocaleString("ko-KR")}
      {suffix}
    </span>
  );
}

/** 일정 간격으로 0..count-1 을 순환. 모션 줄이기 설정이면 고정값 */
export function useCycle(count: number, intervalMs: number, staticIndex = 0): number {
  const reduce = useReducedMotion();
  const [i, setI] = useState(staticIndex);
  useEffect(() => {
    if (reduce) {
      setI(staticIndex);
      return;
    }
    const id = window.setInterval(() => setI((p) => (p + 1) % count), intervalMs);
    return () => window.clearInterval(id);
  }, [count, intervalMs, reduce, staticIndex]);
  return i;
}

/** 마우스 위치를 따라가는 스포트라이트 카드 (CSS 변수 --mx/--my) */
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("group/spot relative overflow-hidden", className)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background: "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(0,168,150,0.10), transparent 45%)",
        }}
      />
      {children}
    </div>
  );
}

/** 섹션 머리말 (eyebrow · 제목 · 설명) */
export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal className={cn(align === "center" && "mx-auto text-center", "max-w-2xl", className)}>
      <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-teal-600">
        <span className="h-px w-6 bg-teal-400" aria-hidden />
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[22px] font-black leading-[1.25] tracking-tight text-slate-900 break-keep [word-break:keep-all] lg:text-[40px] lg:leading-[1.15]">
        {title}
      </h2>
      {body ? (
        <p className="mt-3 text-[13px] font-semibold leading-relaxed text-slate-500 break-keep [word-break:keep-all] lg:mt-4 lg:text-[16px]">
          {body}
        </p>
      ) : null}
    </Reveal>
  );
}
