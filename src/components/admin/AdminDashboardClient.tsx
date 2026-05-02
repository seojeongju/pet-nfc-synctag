"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CardContent } from "@/components/ui/card";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { 
  Users, Package, ArrowUpRight, 
  Shield, Layers, Activity, Database, AlertTriangle, CheckCircle2,
  LayoutGrid, ListPlus, Smartphone, History, ArrowRight, Siren, Boxes
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import type { TagOpsStats } from "@/types/admin-tags";
import { getAdminActionDisplayLabel } from "@/lib/admin-action-labels";

const NFC_QUICK_LINKS = [
  {
    href: "/admin/nfc-tags",
    label: "허브·개요",
    sub: "KPI·체크리스트",
    micro: "허브",
    step: null as string | null,
    icon: LayoutGrid,
    accent: "text-amber-600 bg-amber-500/15 border-amber-100",
  },
  {
    href: "/admin/nfc-tags/register",
    label: "① UID 등록",
    sub: "인벤토리 추가",
    micro: "UID",
    step: "1",
    icon: ListPlus,
    accent: "text-teal-600 bg-teal-500/10 border-teal-100",
  },
  {
    href: "/admin/nfc-tags/write-url",
    label: "② URL 기록",
    sub: "Web NFC",
    micro: "URL",
    step: "2",
    icon: Smartphone,
    accent: "text-indigo-600 bg-indigo-500/10 border-indigo-100",
  },
  {
    href: "/admin/nfc-tags/inventory",
    label: "③ 인벤토리",
    sub: "마스터 데이터",
    micro: "재고",
    step: "3",
    icon: Database,
    accent: "text-amber-700 bg-amber-500/10 border-amber-100",
  },
  {
    href: "/admin/nfc-tags/history",
    label: "④ 연결·감사",
    sub: "로그·추적",
    micro: "감사",
    step: "4",
    icon: History,
    accent: "text-slate-600 bg-slate-500/10 border-slate-100",
  },
] as const;

const THRESHOLD_STORAGE_KEY = "pet-id-admin-dashboard-thresholds-v1";

type ThresholdState = { unsold: number; activation: number; failed: number };
const DEFAULT_THRESHOLDS: ThresholdState = { unsold: 100, activation: 40, failed: 1 };

function loadThresholdsFromStorage(): ThresholdState {
  if (typeof window === "undefined") return DEFAULT_THRESHOLDS;
  try {
    const raw = localStorage.getItem(THRESHOLD_STORAGE_KEY);
    if (!raw) return DEFAULT_THRESHOLDS;
    const p = JSON.parse(raw) as Partial<ThresholdState>;
    return {
      unsold: Math.max(1, Number(p.unsold) || DEFAULT_THRESHOLDS.unsold),
      activation: Math.min(100, Math.max(1, Number(p.activation) || DEFAULT_THRESHOLDS.activation)),
      failed: Math.max(1, Number(p.failed) || DEFAULT_THRESHOLDS.failed),
    };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

function saveThresholdsToStorage(t: ThresholdState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THRESHOLD_STORAGE_KEY, JSON.stringify(t));
  } catch {
    /* ignore */
  }
}

interface AdminDashboardClientProps {
  stats: {
    totalTags: number;
    unsoldTags: number;
    activeTags: number;
    totalUsers: number;
  };
  ops: TagOpsStats;
  failureTop: Array<{
    action: string;
    failure_count: number;
  }>;
  petsBySubjectKind: Record<SubjectKind, number>;
  dataAsOf: string;
}

export default function AdminDashboardClient({
  stats,
  ops,
  failureTop,
  petsBySubjectKind,
  dataAsOf,
}: AdminDashboardClientProps) {
  const [mounted, setMounted] = useState(false);
  const [thresholds, setThresholds] = useState<ThresholdState>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    setMounted(true);
    setThresholds(loadThresholdsFromStorage());
  }, []);

  const setThresholdField = (key: keyof ThresholdState, value: number) => {
    setThresholds((prev) => {
      const next: ThresholdState = {
        ...prev,
        [key]:
          key === "activation"
            ? Math.min(100, Math.max(1, value))
            : Math.max(1, value),
      };
      saveThresholdsToStorage(next);
      return next;
    });
  };

  const unsoldThreshold = thresholds.unsold;
  const activationThreshold = thresholds.activation;
  const failedThreshold = thresholds.failed;

  const dataAsOfLabel = useMemo(() => {
    if (!mounted) return "";
    try {
      return new Date(dataAsOf).toLocaleString("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dataAsOf;
    }
  }, [dataAsOf, mounted]);

  const totalPetsCount = useMemo(
    () => SUBJECT_KINDS.reduce((a, k) => a + petsBySubjectKind[k], 0),
    [petsBySubjectKind]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
  };

  const statCards: Array<{
    title: string;
    value: number;
    icon: typeof Database;
    color: string;
    glowColor: string;
    description: string;
    href: string;
  }> = [
    {
      title: "전체 태그 수",
      value: stats.totalTags,
      icon: Database,
      color: "text-indigo-400",
      glowColor: "bg-indigo-500/20",
      description: "인벤토리 기준 총 UID",
      href: "/admin/nfc-tags",
    },
    {
      title: "미판매 태그",
      value: stats.unsoldTags,
      icon: Package,
      color: "text-amber-400",
      glowColor: "bg-amber-500/20",
      description: "status=unsold",
      href: "/admin/nfc-tags/inventory?status=unsold",
    },
    {
      title: "활성 태그",
      value: stats.activeTags,
      icon: Shield,
      color: "text-teal-400",
      glowColor: "bg-teal-500/20",
      description: "status=active(연결됨)",
      href: "/admin/nfc-tags/inventory?status=active",
    },
    {
      title: "전체 사용자",
      value: stats.totalUsers,
      icon: Users,
      color: "text-sky-400",
      glowColor: "bg-sky-500/20",
      description: "better-auth user 행",
      href: "/admin/users",
    },
  ];
  const anomalies = useMemo(
    () =>
      [
        ops.failedRegistrations7d >= failedThreshold
          ? `최근 7일 등록 실패 ${ops.failedRegistrations7d}건 발생`
          : null,
        ops.webWriteFailures7d > 0 && ops.nativeRecoveryRate7d < 50
          ? `웹 기록 실패 대비 네이티브 복구율 ${ops.nativeRecoveryRate7d}% (개선 필요)`
          : null,
        stats.unsoldTags >= unsoldThreshold
          ? `미판매 재고 ${stats.unsoldTags}개로 재고 과다 상태`
          : null,
        ops.activationRate <= activationThreshold
          ? `활성화율 ${ops.activationRate}%로 전환율 점검 필요`
          : null,
      ].filter(Boolean) as string[],
    [
      failedThreshold,
      stats.unsoldTags,
      unsoldThreshold,
      ops.activationRate,
      activationThreshold,
      ops.failedRegistrations7d,
      ops.webWriteFailures7d,
      ops.nativeRecoveryRate7d,
    ]
  );
  const riskLevel: "danger" | "warning" | "ok" =
    anomalies.length >= 2 ? "danger" : anomalies.length === 1 ? "warning" : "ok";
  const riskLabel =
    riskLevel === "danger" ? "위험" : riskLevel === "warning" ? "주의" : "정상";
  const riskClass =
    riskLevel === "danger"
      ? "bg-rose-50 border-rose-200 text-rose-700"
      : riskLevel === "warning"
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-teal-50 border-teal-200 text-teal-700";
  const primaryActions = useMemo(() => {
    const items: Array<{ label: string; href: string; icon: typeof Activity }> = [];
    if (ops.failedRegistrations7d >= failedThreshold) {
      items.push({
        label: "UID 등록 실패 감사 로그",
        href: "/admin/nfc-tags/history?action=bulk_register&success=failed&days=7",
        icon: AlertTriangle,
      });
    }
    if (stats.unsoldTags >= unsoldThreshold) {
      items.push({ label: "미판매 재고 점검", href: "/admin/nfc-tags/inventory", icon: Package });
    }
    if (ops.webWriteFailures7d > 0 && ops.nativeRecoveryRate7d < 50) {
      items.push({ label: "복구율 저하 원인 보기", href: "/admin/monitoring", icon: Siren });
    }
    if (items.length === 0) {
      items.push({ label: "전체 운영 모니터링", href: "/admin/monitoring", icon: CheckCircle2 });
    }
    return items.slice(0, 3);
  }, [
    failedThreshold,
    ops.failedRegistrations7d,
    ops.nativeRecoveryRate7d,
    ops.webWriteFailures7d,
    stats.unsoldTags,
    unsoldThreshold,
  ]);

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-[#F8FAFC] font-outfit",
        adminUi.pageBottomSafe
      )}
    >
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={adminUi.pageContainer}
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-teal-500 font-black text-[10px] uppercase tracking-[0.2em]">
                <Activity className="w-3.5 h-3.5" />
                시스템 관리 콘솔
             </div>
             <h1 className="text-[1.4rem] font-black leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                관리자 대시보드
              </h1>
              <p className="text-[15px] font-semibold text-slate-600 sm:text-sm sm:font-bold sm:text-slate-500">
                핵심 운영 지표 요약
              </p>
          </div>
          
          <div className="flex flex-col items-end gap-1">
             <div
               className={cn(
                 "px-4 py-2.5 bg-white rounded-2xl flex items-center gap-2.5 border shadow-sm",
                 riskLevel === "danger" && "border-rose-200",
                 riskLevel === "warning" && "border-amber-200",
                 riskLevel === "ok" && "border-slate-100"
               )}
             >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    riskLevel === "danger" && "bg-rose-500 animate-pulse",
                    riskLevel === "warning" && "bg-amber-500",
                    riskLevel === "ok" && "bg-teal-500"
                  )}
                />
                <span className="text-[11px] font-bold text-slate-700">
                  운영 {riskLabel} · 지표 {dataAsOfLabel} 기준
                </span>
             </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AdminCard variant="subtle" className="rounded-3xl">
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 items-stretch">
                <div className={cn("rounded-2xl border px-4 py-3 col-span-2 sm:col-span-1", riskClass)}>
                  <p className="text-[10px] font-black uppercase tracking-widest">운영 상태</p>
                  <p className="mt-1 text-xl font-black">{riskLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">활성화율</p>
                  <p className="mt-1 text-xl font-black text-slate-900">{ops.activationRate}%</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">7일 연결</p>
                  <p className="mt-1 text-xl font-black text-slate-900">{ops.recentLinks}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">복구율(7일)</p>
                  <p className="mt-1 text-xl font-black text-slate-900">{ops.nativeRecoveryRate7d}%</p>
                </div>
              </div>
            </CardContent>
          </AdminCard>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
          {statCards.map((card) => {
            const StatIcon = card.icon;
            return (
            <motion.div key={card.href} variants={itemVariants}>
              <Link href={card.href} prefetch={false} className="block h-full">
                <AdminCard variant="kpi" className="shadow-xl rounded-[32px] overflow-hidden group hover:bg-slate-50 transition-all duration-500 hover:-translate-y-1 h-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-5">
                      <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110", card.glowColor, card.color)}>
                         <StatIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="h-7 w-7 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-teal-500 transition-colors" aria-hidden>
                         <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="space-y-1 text-left">
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tight sm:tracking-widest leading-tight">{card.title}</p>
                      <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{card.value.toLocaleString()}</h2>
                      <p className="text-[10px] font-bold text-slate-400 pt-0.5 line-clamp-2">{card.description}</p>
                    </div>
                  </CardContent>
                </AdminCard>
              </Link>
            </motion.div>
            );
          })}
        </div>

        <motion.div variants={itemVariants}>
          <AdminCard variant="section" className="rounded-[28px] border border-slate-200/80 bg-white">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">즉시 조치</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {primaryActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.label} href={item.href} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-teal-200 hover:bg-teal-50/70 transition">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-teal-600" />
                        <p className="text-xs font-black text-slate-800 leading-snug break-keep">{item.label}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </AdminCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AdminCard variant="section" className="rounded-[28px] border border-amber-100/80 bg-gradient-to-br from-amber-50/50 to-white">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1 min-w-0">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Pet-ID NFC</p>
                  <h3 className="text-lg font-black text-slate-900">기능별 바로가기</h3>
                  <p className="hidden text-xs font-bold text-slate-500 max-w-2xl md:block">
                    사이드 메뉴와 동일한 단계입니다. 표준 순서는 <span className="text-slate-800 font-black">UID 등록 → URL 기록 → 인벤토리 → 감사</span> 입니다.
                  </p>
                  <p className="text-[11px] font-bold leading-snug text-slate-500 md:hidden">
                    아이콘을 탭하면 해당 단계로 이동합니다.
                  </p>
                </div>
                <Link
                  href="/admin/nfc-tags"
                  prefetch={false}
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-2xl border border-amber-200 bg-white px-3.5 py-2 text-[11px] font-black text-amber-800 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
                >
                  NFC 허브
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* 모바일: 아이콘 가로 스크롤 (한 화면에 밀집 최소화) */}
              <nav className="md:hidden" aria-label="Pet-ID NFC 단계 바로가기">
                <ul className="-mx-0.5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:none] sm:-mx-1 [&::-webkit-scrollbar]:hidden">
                  {NFC_QUICK_LINKS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href} className="snap-start shrink-0">
                        <Link
                          href={item.href}
                          prefetch={false}
                          aria-label={`${item.label}, ${item.sub}`}
                          className={cn(
                            "flex w-[4.85rem] flex-col items-center gap-1 rounded-2xl border border-slate-100/90 bg-white px-2 py-2.5 text-center shadow-sm transition",
                            "active:scale-[0.97] active:bg-slate-50",
                            "hover:border-amber-200 hover:shadow-md"
                          )}
                        >
                          {item.step ? (
                            <span className="text-[8px] font-black uppercase tracking-wide text-teal-600">{item.step}</span>
                          ) : (
                            <span className="h-2.5" aria-hidden />
                          )}
                          <div
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm transition-transform",
                              item.accent
                            )}
                          >
                            <Icon className="h-5 w-5 shrink-0" aria-hidden />
                          </div>
                          <span className="line-clamp-2 min-h-[2rem] px-0.5 text-[9px] font-black leading-tight text-slate-800">{item.micro}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {NFC_QUICK_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-md"
                    >
                      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${item.accent}`}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <p className="text-xs font-black text-slate-900">{item.label}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-400">{item.sub}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-teal-600 opacity-0 transition group-hover:opacity-100">
                        이동 <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </AdminCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AdminCard variant="subtle">
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  관리 대상 등록 (모드별)
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-black text-slate-600 tabular-nums">
                    합계 {totalPetsCount.toLocaleString()} (pets)
                  </span>
                  <Link
                    href="/admin/users"
                    prefetch={false}
                    className="font-black text-teal-600 hover:text-teal-800"
                  >
                    사용자
                    <ArrowUpRight className="inline h-3 w-3 align-text-bottom" />
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SUBJECT_KINDS.map((kind) => (
                  <div
                    key={kind}
                    className="rounded-2xl border border-slate-100 bg-white px-3 py-3 text-center"
                  >
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight line-clamp-2">
                      {subjectKindMeta[kind].label}
                    </p>
                    <p className="text-xl font-black text-slate-900 tabular-nums mt-1">
                      {petsBySubjectKind[kind].toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </AdminCard>
        </motion.div>

        {ops.batches.length > 0 ? (
          <motion.div variants={itemVariants}>
            <AdminCard variant="subtle" className="border border-slate-200/80">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    최근 입고 배치 (태그·batch_id)
                  </p>
                  <Link
                    href="/admin/nfc-tags/inventory"
                    prefetch={false}
                    className="text-[10px] font-black text-teal-600 hover:text-teal-800"
                  >
                    전체 인벤토리
                    <ArrowRight className="inline h-3 w-3" />
                  </Link>
                </div>
                <ul className="space-y-2" aria-label="최근 배치">
                  {ops.batches.map((b) => (
                    <li key={b.batch_id}>
                      <Link
                        href={`/admin/nfc-tags/inventory?batch=${encodeURIComponent(b.batch_id)}`}
                        prefetch={false}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-left transition hover:border-teal-200 hover:bg-teal-50/40"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Boxes className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                          <span className="truncate text-xs font-black text-slate-800">{b.batch_id}</span>
                        </span>
                        <span className="shrink-0 text-[10px] font-bold text-slate-500 tabular-nums">
                          총 {b.total_count} · 활성 {b.active_count} · 미판매 {b.unsold_count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </AdminCard>
          </motion.div>
        ) : null}

        <motion.div variants={itemVariants}>
          <AdminCard variant="subtle" className="rounded-3xl">
            <CardContent className="p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">최근 이상 이벤트 (임계치·실데이터)</p>
              {anomalies.length > 0 ? (
                <ul className="space-y-2">
                  {anomalies.map((item) => (
                    <li key={item} className="text-sm font-bold text-rose-500 leading-snug break-keep">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-bold text-teal-600">탐지된 이상 이벤트가 없습니다.</p>
              )}
            </CardContent>
          </AdminCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AdminCard variant="subtle">
            <CardContent className="p-5 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">이상 탐지 임계치 (이 브라우저에 저장)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs font-bold text-slate-500 space-y-1">
                  미판매 재고 기준
                  <input
                    type="number"
                    min={1}
                    value={unsoldThreshold}
                    onChange={(e) =>
                      setThresholdField("unsold", Number(e.target.value) || 1)
                    }
                    className={cn(adminUi.input, "w-full text-slate-800")}
                  />
                </label>
                <label className="text-xs font-bold text-slate-500 space-y-1">
                  활성화율 기준(%)
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={activationThreshold}
                    onChange={(e) =>
                      setThresholdField("activation", Number(e.target.value) || 1)
                    }
                    className={cn(adminUi.input, "w-full text-slate-800")}
                  />
                </label>
                <label className="text-xs font-bold text-slate-500 space-y-1">
                  실패 등록 기준
                  <input
                    type="number"
                    min={1}
                    value={failedThreshold}
                    onChange={(e) =>
                      setThresholdField("failed", Number(e.target.value) || 1)
                    }
                    className={cn(adminUi.input, "w-full text-slate-800")}
                  />
                </label>
              </div>
            </CardContent>
          </AdminCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AdminCard variant="subtle">
            <CardContent className="p-5 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">실패 이벤트 Top 5 (최근 7일)</p>
              {failureTop.length > 0 ? (
                <div className="space-y-2">
                  {failureTop.map((item) => (
                    <Link
                      key={item.action}
                      href={`/admin/nfc-tags/history?action=${encodeURIComponent(item.action)}&success=failed&days=7`}
                      prefetch={false}
                      className="flex items-center justify-between gap-2 rounded-xl bg-rose-50 px-3 py-2 transition hover:bg-rose-100/80"
                    >
                      <span className="min-w-0 text-left text-xs font-black text-rose-600 break-words">
                        {getAdminActionDisplayLabel(item.action)}
                        <span className="ml-1 text-[10px] font-bold text-rose-400/90">({item.action})</span>
                      </span>
                      <span className="shrink-0 text-xs font-black text-rose-800 tabular-nums">
                        {item.failure_count}건
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-bold text-teal-600">최근 7일 실패 이벤트가 없습니다.</p>
              )}
            </CardContent>
          </AdminCard>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AdminCard variant="section" className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/50 rounded-[28px] p-5 lg:p-6 relative overflow-hidden group shadow-2xl">
            <div className="relative z-10 flex flex-col gap-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">빠른 운영 이동</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link href="/admin/nfc-tags/inventory" className="block">
                  <button className="w-full h-12 bg-white hover:bg-teal-400 text-slate-950 font-black text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95">
                    인벤토리 <Package className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/admin/nfc-tags/history" className="block">
                  <button className={cn("w-full h-12 text-sm rounded-xl", adminUi.darkButton)}>
                    감사 로그
                  </button>
                </Link>
                <Link href="/admin/nfc-tags/register" className="block">
                  <button className={cn("w-full h-12 text-sm rounded-xl", adminUi.darkButton)}>
                    UID 등록
                  </button>
                </Link>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-full blur-[80px] group-hover:bg-teal-500/10 transition-all duration-700" />
          </AdminCard>
        </motion.div>

        <p className="px-1 text-center text-[10px] font-bold text-slate-400" role="status">
          서버 집계 기준 시각: {dataAsOfLabel} · 수치는 D1·감사 로그를 사용합니다
        </p>
      </motion.div>
    </div>
  );
}
