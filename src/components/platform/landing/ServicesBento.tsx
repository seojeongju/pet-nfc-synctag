"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Baby, Briefcase, Gem, MapPinned, Navigation2, PawPrint, UserRound } from "lucide-react";
import { platformServiceIcons } from "@/components/platform/service-icons";
import { Reveal, SpotlightCard } from "@/components/platform/landing/motion-utils";
import { PLATFORM_SERVICES, platformServiceStatusLabel, type PlatformService } from "@/lib/platform/services";
import { cn } from "@/lib/utils";

const ORBIT_ICONS = [PawPrint, UserRound, Baby, Briefcase, Gem, Navigation2];

/** 서비스 벤토 그리드. PC 3×3(Link-U 2×2 강조), 휴대폰 1열 */
export function ServicesBento() {
  const linku = PLATFORM_SERVICES.find((s) => s.id === "linku")!;
  const others = PLATFORM_SERVICES.filter((s) => s.id !== "linku");
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:grid-rows-[repeat(3,minmax(0,1fr))] lg:gap-5">
      <Reveal className="lg:col-span-2 lg:row-span-2">
        <LinkuTile service={linku} />
      </Reveal>
      {others.map((s, i) => (
        <Reveal key={s.id} delay={0.05 * (i + 1)}>
          <ServiceTile service={s} />
        </Reveal>
      ))}
    </div>
  );
}

function LinkuTile({ service }: { service: PlatformService }) {
  const reduce = useReducedMotion();
  return (
    <Link href={`/services/${service.id}`} className="block h-full">
      <SpotlightCard className="flex h-full min-h-[260px] flex-col justify-between rounded-[32px] border border-teal-200 bg-gradient-to-br from-white via-teal-50/60 to-white p-6 shadow-[0_24px_60px_rgba(0,134,120,0.10)] transition hover:-translate-y-1 lg:min-h-[440px] lg:rounded-[40px] lg:p-10">
        {/* 궤도 인포그래픽 */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-[260px] w-[260px] lg:right-8 lg:top-1/2 lg:h-[340px] lg:w-[340px] lg:-translate-y-1/2" aria-hidden>
          <div className="absolute inset-[18%] rounded-full border border-dashed border-teal-200" />
          <div className="absolute inset-0 rounded-full border border-teal-100" />
          <div className="absolute inset-[38%] flex items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-[0_18px_40px_rgba(0,134,120,0.35)]">
            <MapPinned className="h-8 w-8 lg:h-10 lg:w-10" />
          </div>
          <motion.div
            className="absolute inset-0"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {ORBIT_ICONS.map((Icon, i) => {
              const angle = (i / ORBIT_ICONS.length) * Math.PI * 2;
              const x = 50 + Math.cos(angle) * 46;
              const y = 50 + Math.sin(angle) * 46;
              return (
                <motion.span
                  key={i}
                  className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-md ring-1 ring-teal-100 lg:h-12 lg:w-12"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  animate={reduce ? undefined : { rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                >
                  <Icon className="h-5 w-5" />
                </motion.span>
              );
            })}
          </motion.div>
        </div>

        <div className="relative max-w-[60%] lg:max-w-[46%]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-2.5 py-1 text-[10px] font-black text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            {platformServiceStatusLabel[service.status]}
          </span>
          <p className="mt-4 text-2xl font-black tracking-tight text-slate-900 lg:text-[34px]">{service.name}</p>
          <p className="mt-1 text-sm font-black text-teal-600 lg:text-base">{service.tagline}</p>
          <p className="mt-3 hidden text-[14px] font-semibold leading-relaxed text-slate-500 break-keep [word-break:keep-all] lg:block">
            {service.description}
          </p>
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-1.5">
          {service.examples.map((ex) => (
            <span key={ex} className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-teal-100">
              {ex}
            </span>
          ))}
          <span className="ml-auto hidden items-center gap-1 text-sm font-black text-teal-700 lg:inline-flex">
            자세히 보기 <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </SpotlightCard>
    </Link>
  );
}

function ServiceTile({ service }: { service: PlatformService }) {
  const Icon = platformServiceIcons[service.id];
  return (
    <Link href={`/services/${service.id}`} className="block h-full">
      <SpotlightCard
        className={cn(
          "flex h-full items-center gap-4 rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_20px_44px_rgba(15,23,42,0.09)]",
          "lg:flex-col lg:items-start lg:justify-between lg:rounded-[32px] lg:p-7"
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 lg:w-full">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-1 ring-teal-100 transition group-hover/spot:bg-teal-500 group-hover/spot:text-white">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500 lg:inline">
            {platformServiceStatusLabel[service.status]}
          </span>
        </div>
        <div className="min-w-0 flex-1 lg:mt-6 lg:flex-none">
          <p className="flex items-center gap-1.5 text-[15px] font-black text-slate-900 lg:text-lg">
            {service.name}
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-500 lg:hidden">
              {platformServiceStatusLabel[service.status]}
            </span>
          </p>
          <p className="mt-0.5 text-[12px] font-semibold text-slate-500 break-keep [word-break:keep-all] lg:text-[13px]">{service.tagline}</p>
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover/spot:text-teal-500 lg:hidden" aria-hidden />
      </SpotlightCard>
    </Link>
  );
}
