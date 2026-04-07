"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Tag, Users, Package, CheckCircle, ArrowUpRight, 
  TrendingUp, Shield, Layers, Activity, Database
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminDashboardClientProps {
  stats: {
    totalTags: number;
    unsoldTags: number;
    activeTags: number;
    totalUsers: number;
  };
}

export default function AdminDashboardClient({ stats }: AdminDashboardClientProps) {
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } as any }
  };

  const statCards = [
    {
      title: "Total Inventory",
      value: stats.totalTags,
      icon: Database,
      color: "text-indigo-400",
      glowColor: "bg-indigo-500/20",
      description: "전체 시스템 등록 태그"
    },
    {
      title: "Unsold Tags",
      value: stats.unsoldTags,
      icon: Package,
      color: "text-amber-400",
      glowColor: "bg-amber-500/20",
      description: "판매 대기 중인 제품"
    },
    {
      title: "Active Pets",
      value: stats.activeTags,
      icon: Shield,
      color: "text-teal-400",
      glowColor: "bg-teal-500/20",
      description: "실제 보호자가 등록한 수"
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-sky-400",
      glowColor: "bg-sky-500/20",
      description: "시스템 가입자 수"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-outfit pb-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6 pt-10 space-y-10 relative z-10"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-teal-500 font-black text-[10px] uppercase tracking-[0.2em]">
                <Activity className="w-3.5 h-3.5" />
                System Management Console
             </div>
             <h1 className="text-4xl font-black text-white tracking-tight">Admin Dashboard</h1>
             <p className="text-slate-500 text-sm font-bold">실시간 시스템 리소스 및 자산 관리 현황</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-5 py-3 glass-dark rounded-2xl flex items-center gap-3 border-white/5">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-300">Live Status: Stable</span>
             </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="bg-slate-900/50 border-white/5 shadow-2xl rounded-[32px] overflow-hidden group hover:bg-slate-900 transition-all duration-500 hover:-translate-y-1">
                <CardContent className="p-7">
                  <div className="flex items-center justify-between mb-6">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110", card.glowColor, card.color)}>
                       <card.icon className="w-7 h-7" />
                    </div>
                    <div className="h-8 w-8 rounded-full border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-teal-400 transition-colors">
                       <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{card.title}</p>
                    <h2 className="text-3xl font-black text-white tracking-tighter tabular-nums">{card.value.toLocaleString()}</h2>
                    <p className="text-[10px] font-bold text-slate-600 pt-3 border-t border-white/5 mt-4">
                       {card.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* System Insights */}
           <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="bg-slate-900/40 border-white/5 rounded-[40px] p-8 h-full shadow-2xl">
                 <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                       <h3 className="text-xl font-black text-white px-1">최근 비즈니스 통찰</h3>
                       <p className="text-xs font-bold text-slate-500 px-1 italic">Generated by Pet-ID Core System</p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-slate-700" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-[28px] bg-amber-500/5 border border-amber-500/10 space-y-4 hover:bg-amber-500/10 transition-colors">
                       <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                          <Package className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-200 text-sm">재고 경보: 등록 필요</h4>
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
                          <h4 className="font-bold text-slate-200 text-sm">시스템 무결성 확인</h4>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                             모든 NFC 인식표 정보가 암호화되어 안전하게 관리되고 있습니다. 최근 24시간 내 보안 이슈가 발견되지 않았습니다.
                          </p>
                       </div>
                    </div>
                 </div>
              </Card>
           </motion.div>

           {/* Quick Actions Panel */}
           <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-white/5 rounded-[40px] p-8 h-full relative overflow-hidden group shadow-2xl">
                 <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                    <div className="space-y-6">
                       <div className="w-16 h-16 rounded-[24px] bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                          <Layers className="w-8 h-8" />
                       </div>
                       <div className="space-y-3">
                          <h3 className="text-2xl font-black text-white leading-tight">Master Tag <br /> Management</h3>
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
                 </div>
                 
                 {/* Decorative Glow */}
                 <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-full blur-[80px] group-hover:bg-teal-500/10 transition-all duration-700" />
              </Card>
           </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-4 opacity-30 pt-10 border-t border-white/5">
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
