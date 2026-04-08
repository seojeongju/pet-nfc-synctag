"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CardContent } from "@/components/ui/card";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { 
  Users, Package, CheckCircle, ArrowUpRight, 
  TrendingUp, Shield, Layers, Activity, Database
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";

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
  };
  failureTop: Array<{
    action: string;
    failure_count: number;
  }>;
}

export default function AdminDashboardClient({ stats, ops, failureTop }: AdminDashboardClientProps) {
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
        stats.unsoldTags >= unsoldThreshold
          ? `미판매 재고 ${stats.unsoldTags}개로 재고 과다 상태`
          : null,
        ops.activationRate <= activationThreshold
          ? `활성화율 ${ops.activationRate}%로 전환율 점검 필요`
          : null,
      ].filter(Boolean) as string[],
    [failedThreshold, stats.unsoldTags, unsoldThreshold, ops.activationRate, activationThreshold, ops.failedRegistrations7d]
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
             <p className="text-slate-500 text-sm font-bold">실시간 시스템 리소스 및 자산 관리 현황</p>
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
                    <p className="text-[10px] font-bold text-slate-500 pt-3 border-t border-slate-100 mt-4">
                       {card.description}
                    </p>
                  </div>
                </CardContent>
              </AdminCard>
            </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
           {/* System Insights */}
           <motion.div variants={itemVariants} className="lg:col-span-2">
              <AdminCard variant="section" className="rounded-[28px] lg:rounded-[40px] p-5 lg:p-8 h-full">
                 <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                       <h3 className="text-lg lg:text-xl font-black text-slate-900 px-1">최근 비즈니스 통찰</h3>
                       <p className="text-xs font-bold text-slate-500 px-1 italic">Pet-ID Core 시스템 분석 결과</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-slate-400" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-[28px] bg-amber-500/5 border border-amber-500/10 space-y-4 hover:bg-amber-500/10 transition-colors">
                       <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                          <Package className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 text-sm">재고 경보: 등록 필요</h4>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                             현재 미판매 재고가 <span className="text-amber-500 font-black">{stats.unsoldTags}개</span> 남았습니다. 원활한 판매를 위해 추가 태그 UID 등록을 권장합니다.
                          </p>
                       </div>
                    </div>

                    <div className="p-6 rounded-[28px] bg-teal-500/5 border border-teal-500/10 space-y-4 hover:bg-teal-500/10 transition-colors">
                       <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-500">
                          <CheckCircle className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 text-sm">시스템 무결성 확인</h4>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                             모든 NFC 인식표 정보가 암호화되어 안전하게 관리되고 있습니다. 최근 24시간 내 보안 이슈가 발견되지 않았습니다.
                          </p>
                       </div>
                    </div>
                 </div>
              </AdminCard>
           </motion.div>

           {/* Quick Actions Panel */}
           <motion.div variants={itemVariants}>
              <AdminCard variant="section" className="bg-gradient-to-br from-slate-900 to-slate-800 border-white/50 rounded-[28px] lg:rounded-[40px] p-5 lg:p-8 h-full relative overflow-hidden group shadow-2xl">
                 <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                    <div className="space-y-6">
                       <div className="w-16 h-16 rounded-[24px] bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                          <Layers className="w-8 h-8" />
                       </div>
                       <div className="space-y-3">
                          <h3 className="text-xl lg:text-2xl font-black text-white leading-tight">마스터 태그 <br /> 관리</h3>
                          <p className="text-slate-500 text-sm font-bold leading-relaxed">
                             공장에서 생산된 태그 UID를 대량으로 시스템에 업로드하고 유효성을 검사합니다.
                          </p>
                       </div>
                    </div>

                    <Link href="/admin/tags" className="block group/btn">
                       <button className="w-full h-16 bg-white hover:bg-teal-400 text-slate-950 font-black rounded-[20px] transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-teal-500/5 group-hover/btn:shadow-teal-500/20 group-hover/btn:text-white">
                          인벤토리 관리하기 <Package className="w-5 h-5" />
                       </button>
                    </Link>
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/admin/tags" className="block">
                        <button className={cn("w-full h-11 text-xs rounded-xl", adminUi.darkButton)}>
                          감사 로그 보기
                        </button>
                      </Link>
                      <Link href="/admin/tags" className="block">
                        <button className={cn("w-full h-11 text-xs rounded-xl", adminUi.darkButton)}>
                          재고 등록하기
                        </button>
                      </Link>
                    </div>
                 </div>
                 
                 {/* Decorative Glow */}
                 <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-full blur-[80px] group-hover:bg-teal-500/10 transition-all duration-700" />
              </AdminCard>
           </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-4 opacity-60 pt-10 border-t border-slate-200">
           <div className="flex items-center gap-6">
              <Database className="w-4 h-4 text-slate-500" />
              <Layers className="w-4 h-4 text-slate-500" />
              <Shield className="w-4 h-4 text-slate-500" />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
              Pet-ID Core Engine v2.0 © 2024
           </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
