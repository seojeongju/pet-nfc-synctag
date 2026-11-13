"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Box, Calculator, Layers, PenTool, Truck, type LucideIcon } from "lucide-react";
import { useCycle } from "@/components/platform/landing/motion-utils";
import { FORM_FACTORS } from "@/lib/platform/form-factors";

/** 쇼케이스가 순환할 디자인 예시 (폼팩터 · 색 · 문구 · 재질) */
const SAMPLES = [
  { form: "keyring_round", body: "#00A896", text: "#FFFFFF", label: "LINK-U", material: "PLA 무광" },
  { form: "pendant_bone", body: "#FCD34D", text: "#0F172A", label: "COCO", material: "PETG 유광" },
  { form: "stand_plate", body: "#FFFFFF", text: "#00655A", label: "FREE Wi-Fi", material: "레진 반투명" },
  { form: "keyring_round", body: "#FDA4AF", text: "#FFFFFF", label: "MINJI", material: "PLA 무광" },
] as const;

const PIPELINE: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Layers, label: "서비스" },
  { icon: PenTool, label: "디자인" },
  { icon: Box, label: "3D 확인" },
  { icon: Calculator, label: "견적" },
  { icon: Truck, label: "제작·배송" },
];

export function StudioShowcase() {
  const reduce = useReducedMotion();
  const i = useCycle(SAMPLES.length, 2600);
  const sample = SAMPLES[i]!;
  const ff = FORM_FACTORS.find((f) => f.id === sample.form)!;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
      {/* 태그 미리보기 */}
      <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_30%_20%,#FFF1F2,transparent_50%),radial-gradient(circle_at_80%_80%,#E5F6F4,transparent_55%),#FFFFFF] p-6 lg:min-h-[440px] lg:rounded-[40px]">
        {/* 격자 */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i}
            initial={reduce ? false : { opacity: 0, scale: 0.85, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotate: 6 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <motion.div animate={reduce ? undefined : { y: [0, -10, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
              <TagShape form={sample.form} body={sample.body} text={sample.text} label={sample.label} />
            </motion.div>
          </motion.div>
        </AnimatePresence>
        {/* 치수 라벨 */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-100">
            {ff.name} · {ff.widthMm}×{ff.heightMm}×{ff.thicknessMm}mm
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-black text-teal-700 shadow-sm ring-1 ring-teal-100">{ff.chip.type}</span>
            <span className="rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-black text-slate-600 shadow-sm ring-1 ring-slate-100">{sample.material}</span>
          </span>
        </div>
      </div>

      {/* 제작 흐름 */}
      <div className="flex flex-col justify-between gap-5 rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)] lg:rounded-[40px] lg:p-9">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">제작 흐름</p>
          <ol className="mt-5 space-y-3">
            {PIPELINE.map((p, idx) => {
              const Icon = p.icon;
              return (
                <li key={p.label} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100">
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-black text-slate-800">{p.label}</span>
                      <span className="text-[10px] font-bold text-slate-400">STEP {idx + 1}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600"
                        initial={{ width: reduce ? "100%" : "0%" }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.25 + idx * 0.25, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <p className="text-[12px] font-semibold leading-relaxed text-slate-600 break-keep [word-break:keep-all]">
            키링 <b className="font-black text-slate-900">9,900원</b>부터. 디자인을 마치면 WOW3D 자동견적으로 정확한 가격과 제작 기간을 안내합니다.
          </p>
        </div>
        <Link
          href="/studio"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-black text-white shadow-sm transition hover:bg-teal-700"
        >
          태그 스튜디오에서 만들어 보기
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function TagShape({ form, body, text, label }: { form: string; body: string; text: string; label: string }) {
  const shadow = "drop-shadow(0 26px 40px rgba(15,23,42,0.22))";
  if (form === "pendant_bone") {
    return (
      <svg viewBox="0 0 260 150" className="h-[150px] w-[260px] lg:h-[180px] lg:w-[312px]" style={{ filter: shadow }}>
        <g fill={body} stroke="rgba(15,23,42,0.08)" strokeWidth="2">
          <circle cx="50" cy="45" r="36" />
          <circle cx="50" cy="105" r="36" />
          <circle cx="210" cy="45" r="36" />
          <circle cx="210" cy="105" r="36" />
          <rect x="45" y="38" width="170" height="74" rx="16" />
        </g>
        <circle cx="216" cy="40" r="7" fill="#F8FAFC" />
        <text x="130" y="86" textAnchor="middle" fontSize="34" fontWeight="900" fill={text} fontFamily="Outfit, sans-serif">
          {label}
        </text>
      </svg>
    );
  }
  if (form === "stand_plate") {
    return (
      <svg viewBox="0 0 200 240" className="h-[220px] w-[184px] lg:h-[280px] lg:w-[234px]" style={{ filter: shadow }}>
        <rect x="10" y="212" width="180" height="20" rx="8" fill="#E2E8F0" />
        <rect x="20" y="8" width="160" height="208" rx="22" fill={body} stroke="rgba(15,23,42,0.10)" strokeWidth="2" />
        <circle cx="100" cy="70" r="26" fill="#E5F6F4" />
        <path d="M86 70 a14 14 0 0 1 28 0 M91 70 a9 9 0 0 1 18 0 M96 70 a4 4 0 0 1 8 0" stroke="#00A896" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <text x="100" y="138" textAnchor="middle" fontSize="22" fontWeight="900" fill={text} fontFamily="Outfit, sans-serif">
          {label}
        </text>
        <text x="100" y="164" textAnchor="middle" fontSize="11" fontWeight="700" fill="#94A3B8" fontFamily="Outfit, sans-serif">
          휴대폰을 대세요
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 240" className="h-[220px] w-[184px] lg:h-[280px] lg:w-[234px]" style={{ filter: shadow }}>
      <circle cx="100" cy="34" r="22" fill="none" stroke={body} strokeWidth="12" />
      <circle cx="100" cy="140" r="90" fill={body} stroke="rgba(15,23,42,0.08)" strokeWidth="2" />
      <circle cx="100" cy="140" r="70" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeDasharray="4 6" />
      <text x="100" y="152" textAnchor="middle" fontSize="30" fontWeight="900" fill={text} fontFamily="Outfit, sans-serif">
        {label}
      </text>
    </svg>
  );
}

