"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CardContent } from "@/components/ui/card";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { 
  Users, Package, CheckCircle, ArrowUpRight, 
  Shield, Layers, Activity, Database,
  LayoutGrid, ListPlus, Smartphone, History, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";

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

interface AdminDashboardClientProps {
  stats: {
    totalTags: number;
    unsoldTags: number;
    activeTags: number;
    totalUsers: number;
  };
  ops: {
    activationRate: number;
    recentLinks: number;
    failedRegistrations7d: number;
    webWriteFailures7d: number;
    nativeWriteSuccessFromWebFail7d: number;
    nativeRecoveryRate7d: number;
  };
  failureTop: Array<{
    action: string;
    failure_count: number;
  }>;
  petsBySubjectKind: Record<SubjectKind, number>;
}

export default function AdminDashboardClient({
  stats,
  ops,
  failureTop,
  petsBySubjectKind,
}: AdminDashboardClientProps) {
  const [unsoldThreshold, setUnsoldThreshold] = useState(100);
  const [activationThreshold, setActivationThreshold] = useState(40);
  const [failedThreshold, setFailedThreshold] = useState(1);
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

  const statCards = [
    {
      title: "전체 태그 수",
      value: stats.totalTags,
      icon: Database,
      color: "text-indigo-400",
      glowColor: "bg-indigo-500/20",
      description: "전체 시스템 등록 태그"
    },
    {
      title: "미판매 태그",
      value: stats.unsoldTags,
      icon: Package,
      color: "text-amber-400",
      glowColor: "bg-amber-500/20",
      description: "판매 대기 중인 제품"
    },
    {
      title: "활성 태그",
      value: stats.activeTags,
      icon: Shield,
      color: "text-teal-400",
      glowColor: "bg-teal-500/20",
      description: "실제 보호자가 등록한 수"
    },
    {
      title: "전체 사용자",
      value: stats.totalUsers,
      icon: Users,
      color: "text-sky-400",
      glowColor: "bg-sky-500/20",
      description: "시스템 가입자 수"
    }
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit pb-20 relative overflow-hidden">
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
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-teal-500 font-black text-[10px] uppercase tracking-[0.2em]">
                <Activity className="w-3.5 h-3.5" />
                시스템 관리 콘솔
             </div>
             <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">관리자 대시보드</h1>
             <p className="text-slate-500 text-sm font-bold">핵심 운영 지표 요약</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-5 py-3 bg-white rounded-2xl flex items-center gap-3 border border-slate-100 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-600">실시간 상태: 정상</span>
             </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {statCards.map((card, idx) => {
            const StatIcon = card.icon;
            return (
            <motion.div key={idx} variants={itemVariants}>
              <AdminCard variant="kpi" className="shadow-xl rounded-[32px] overflow-hidden group hover:bg-slate-50 transition-all duration-500 hover:-translate-y-1">
                <CardContent className="p-7">
                  <div className="flex items-center justify-between mb-6">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110", card.glowColor, card.color)}>
                       <StatIcon className="w-7 h-7" />
                    </div>
                    <div className="h-8 w-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-teal-500 transition-colors">
                       <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.title}</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{card.value.toLocaleString()}</h2>
                  </div>
                </CardContent>
              </AdminCard>
            </motion.div>
            );
          })}
        </div>

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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                관리 대상 등록 (모드별)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SUBJECT_KINDS.map((kind) => (
                  <div
                    key={kind}
                    className="rounded-2xl border border-slate-100 bg-white px-3 py-3 text-center"
                  >
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <AdminCard variant="subtle">
            <CardContent className="p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">활성화율</p>
              <p className="text-2xl font-black text-indigo-500 mt-2">{ops.activationRate}%</p>
            </CardContent>
          </AdminCard>
          <AdminCard variant="subtle">
            <CardContent className="p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">최근 7일 연결</p>
              <p className="text-2xl font-black text-teal-500 mt-2">{ops.recentLinks}</p>
            </CardContent>
          </AdminCard>
          <AdminCard variant="subtle">
            <CardContent className="p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">최근 7일 실패 등록</p>
              <p className="text-2xl font-black text-rose-500 mt-2">{ops.failedRegistrations7d}</p>
            </CardContent>
          </AdminCard>
          <AdminCard variant="subtle">
            <CardContent className="p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">웹실패→네이티브 복구율(7일)</p>
              <p className="text-2xl font-black text-violet-500 mt-2">{ops.nativeRecoveryRate7d}%</p>
              <p className="text-[10px] font-bold text-slate-500 mt-2">
                {ops.nativeWriteSuccessFromWebFail7d}/{ops.webWriteFailures7d}
              </p>
            </CardContent>
          </AdminCard>
        </div>

        <motion.div variants={itemVariants}>
          <AdminCard variant="subtle">
            <CardContent className="p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">최근 이상 이벤트</p>
              {anomalies.length > 0 ? (
                <ul className="space-y-2">
                  {anomalies.map((item) => (
                    <li key={item} className="text-sm font-bold text-rose-500">{item}</li>
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">이상 탐지 임계치 설정</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs font-bold text-slate-500 space-y-1">
                  미판매 재고 기준
                  <input
                    type="number"
                    min={1}
                    value={unsoldThreshold}
                    onChange={(e) => setUnsoldThreshold(Number(e.target.value) || 1)}
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
                    onChange={(e) => setActivationThreshold(Number(e.target.value) || 1)}
                    className={cn(adminUi.input, "w-full text-slate-800")}
                  />
                </label>
                <label className="text-xs font-bold text-slate-500 space-y-1">
                  실패 등록 기준
                  <input
                    type="number"
                    min={1}
                    value={failedThreshold}
                    onChange={(e) => setFailedThreshold(Number(e.target.value) || 1)}
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
                    <div key={item.action} className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2">
                      <span className="text-xs font-black text-rose-500">{item.action}</span>
                      <span className="text-xs font-black text-rose-700">{item.failure_count}건</span>
                    </div>
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
      </motion.div>
    </div>
  );
}
