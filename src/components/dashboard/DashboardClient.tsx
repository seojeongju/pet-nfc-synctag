"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, MapPin, PawPrint, Search, Bell, Settings, 
  LogOut, ShieldCheck, Heart, History, Activity, Home
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
  session: any;
  pets: any[];
  isAdmin: boolean;
}

export default function DashboardClient({ session, pets, isAdmin }: DashboardClientProps) {
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } as any }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit pb-32 overflow-x-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto px-5 pt-8 space-y-8"
      >
        {/* Admin Transition Banner */}
        {isAdmin && (
          <motion.section variants={itemVariants}>
            <div className="glass-dark rounded-[32px] p-5 text-white flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs">관리자 모드 🛡️</h4>
                  <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest leading-none">Access Console</p>
                </div>
              </div>
              <Link href="/admin">
                <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white font-black rounded-xl text-[10px] h-8 px-4 transition-all active:scale-90">
                  관리센터 이동
                </Button>
              </Link>
            </div>
          </motion.section>
        )}

        {/* User Header Section */}
        <motion.section variants={itemVariants} className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-teal-600 font-bold text-[11px] uppercase tracking-wider">
               <MapPin className="w-3.5 h-3.5" />
               SEOUL, KOREA
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
               안녕하세요, <br /> 
               <span className="text-teal-500">{session.user.name || "보호자"}</span>님! 👋
            </h1>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-teal-200 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
            <div className="w-14 h-14 rounded-full border-4 border-white shadow-xl overflow-hidden relative z-10 bg-white">
               {session.user.image ? (
                 <img src={session.user.image} alt="" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-500"><PawPrint className="w-6 h-6" /></div>
               )}
            </div>
          </div>
        </motion.section>

        {/* Action Quick Search Bar */}
        <motion.section variants={itemVariants} className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder="반려동물 이름을 찾아보세요..." 
            className="w-full h-16 glass rounded-[24px] pl-14 pr-5 text-sm font-bold shadow-app shadow-app-hover outline-none transition-all focus:ring-2 focus:ring-teal-500/20"
          />
        </motion.section>

        {/* Pro Banner / Stat Widget */}
        <motion.section variants={itemVariants}>
          <Card className="border-none rounded-[40px] bg-slate-900 text-white overflow-hidden relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)]">
            <div className="p-8 space-y-5 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                   <span className="text-[10px] font-black tracking-widest text-teal-400 uppercase">Live Security</span>
                </div>
                <h2 className="text-xl font-black leading-[1.2]">우리 아이들을 위한 <br /> 실시간 안심 케어 🐾</h2>
              </div>
              <p className="text-slate-400 text-[11px] font-bold leading-relaxed max-w-[70%]">
                 NFC 태그가 스캔되는 즉시 사장님의 폰으로 위치 알림이 전송됩니다.
              </p>
              <Button className="rounded-2xl font-black bg-teal-500 text-white hover:bg-teal-600 px-6 h-11 text-xs shadow-lg shadow-teal-500/20">
                상세 리포트 보기
              </Button>
            </div>
            
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl block" />
            <div className="absolute bottom-4 right-6 w-16 h-16 opacity-50"><Heart className="w-full h-full text-white/5 rotate-12" /></div>
          </Card>
        </motion.section>

        {/* Horizontal Pet Selector */}
        <motion.section variants={itemVariants} className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900">함께하는 아이들</h3>
              <Link href="/dashboard/pets" className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline transition-all">View All</Link>
           </div>
           
           <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide -mx-5 px-5">
              {pets.map((pet) => (
                <motion.div 
                  key={pet.id} 
                  whileTap={{ scale: 0.95 }}
                  className="min-w-[150px]"
                >
                  <Link href={`/profile/${pet.id}`}>
                    <Card className="rounded-[32px] border-none shadow-app shadow-app-hover overflow-hidden bg-white text-center p-0">
                       <div className="h-28 bg-slate-100 relative overflow-hidden">
                          {pet.photo_url ? (
                            <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><PawPrint className="w-12 h-12" /></div>
                          )}
                       </div>
                       <CardContent className="p-4 space-y-0.5">
                          <h4 className="font-black text-slate-800 text-sm">{pet.name}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{pet.breed || "UNKNOWN"}</p>
                       </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}

              <motion.div whileTap={{ scale: 0.95 }}>
                <Link href="/dashboard/pets/new">
                   <div className="min-w-[150px] h-full min-h-[176px] rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-teal-50/50 hover:border-teal-500 transition-all group">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-white transition-all shadow-sm">
                         <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-teal-500 uppercase tracking-wider">Add Pet</span>
                   </div>
                </Link>
              </motion.div>
           </div>
        </motion.section>

        {/* Activity Widget */}
        <motion.section variants={itemVariants} className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900">최근 보호 활동</h3>
              <Activity className="w-5 h-5 text-slate-300" />
           </div>
           
           <Card className="rounded-[32px] border-none shadow-app p-6 bg-white relative overflow-hidden group hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-14 h-14 rounded-[20px] bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm shadow-rose-100">
                    <Bell className="w-6 h-6 animate-pulse" />
                 </div>
                 <div className="space-y-0.5">
                    <h4 className="font-black text-slate-800 text-sm">최근 스캔 내역이 없습니다</h4>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">우리 아이들의 인식표가 모두 안전한 상태입니다.</p>
                 </div>
              </div>
              <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-slate-50 rounded-full group-hover:bg-teal-50 transition-colors" />
           </Card>
        </motion.section>
      </motion.div>

      {/* Floating Bottom Navigation Bar (True App Experience) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-20 glass-dark rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 flex items-center justify-around px-4 border border-white/20">
         <Link href="/dashboard" className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl bg-teal-500 text-white shadow-xl shadow-teal-500/20 transition-all active:scale-90">
               <Home className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest">Home</span>
         </Link>
         <Link href="/dashboard/pets" className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-colors transition-all active:scale-90">
               <PawPrint className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Pets</span>
         </Link>
         <Link href="/dashboard/scans" className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-colors transition-all active:scale-90">
               <History className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">History</span>
         </Link>
         <Link href="/logout" className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-rose-400 transition-colors transition-all active:scale-90">
               <LogOut className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-rose-400 uppercase tracking-widest">Log Out</span>
         </Link>
      </nav>
    </div>
  );
}
