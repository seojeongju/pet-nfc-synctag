"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, ShieldCheck, ArrowRight, Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface HomeClientProps {
  session: { user: { name?: string | null } } | null;
  isAdmin: boolean;
  dashboardLink: string;
  buttonLabel: string;
}

export default function HomeClient({ session, isAdmin, dashboardLink, buttonLabel }: HomeClientProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit overflow-hidden relative">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />

      {/* Main App Container */}
      <main className="flex-1 flex flex-col max-w-md mx-auto w-full relative z-10">
        
        {/* Top Visual Section */}
        <section className="relative px-4 pt-6 pb-2">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[4/5] w-full rounded-[48px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-4 border-white"
          >
            <Image 
              src="/korean_pet_hero_1774861698476.png" 
              alt="Happy Pet owner" 
              fill
              className="object-cover scale-110"
              priority
            />
            
            {/* Glass Overlays / Badges */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute top-6 right-6 glass px-5 py-2.5 rounded-2xl flex items-center gap-2"
            >
              <span className="text-xs font-black text-slate-800">PET CARE 🦴</span>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
              className="absolute bottom-10 left-6 bg-white/90 backdrop-blur-md p-3 rounded-[24px] shadow-xl flex items-center gap-3 border border-white"
            >
              <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center text-white">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Registered Pets</p>
                <p className="text-sm font-black text-slate-800">1,240+</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Content & Call to Action (Action Sheet Style) */}
        <section className="flex-1 flex flex-col px-8 pt-8 pb-12 space-y-8 bg-white/40 backdrop-blur-sm rounded-t-[56px] border-t border-white/50 -mt-20 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-widest">
               <Sparkles className="w-4 h-4" />
               Smart NFC Connect
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight">
              반려동물을 위한 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-600">완벽한 디지털 명함</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              NFC 스마트 인식표와 실시간 위치 알림으로 <br />
              우리 아이의 안전을 가장 스마트하게 지키세요.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full space-y-6 pt-2"
          >
            <Link href={dashboardLink} className="block w-full group">
              <button className={cn(
                "w-full h-18 flex items-center justify-center gap-3 rounded-[28px] text-lg font-black shadow-2xl transition-all active:scale-95 group-hover:-translate-y-1 duration-300",
                isAdmin 
                  ? "bg-slate-900 text-white shadow-slate-200" 
                  : "bg-teal-500 text-white shadow-teal-500/20"
              )}>
                <AnimatePresence mode="wait">
                  {isAdmin ? (
                    <motion.div key="admin" initial={{ scale: 0.8 }} animate={{ scale: 1 }}><ShieldCheck className="w-6 h-6 text-teal-400" /></motion.div>
                  ) : (
                    <motion.div key="user" initial={{ scale: 0.8 }} animate={{ scale: 1 }}><LayoutDashboard className="w-6 h-6" /></motion.div>
                  )}
                </AnimatePresence>
                {buttonLabel}
                <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </Link>
            
            <div className="flex flex-col items-center gap-4">
              {!session ? (
                <div className="text-sm text-slate-400 font-bold">
                  이미 계정이 있으신가요?{" "}
                  <Link href="/login" className="text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-2">
                    로그인
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 rounded-full text-xs font-black text-slate-500 border border-white shadow-sm">
                   <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                   {session.user.name}님으로 입장함
                </div>
              )}
            </div>
          </motion.div>
        </section>

        <footer className="px-8 pb-12 pt-4 bg-white/40 flex flex-col items-center gap-4">
           <div className="flex items-center justify-center gap-3 opacity-30 grayscale contrast-125">
              <ShieldCheck className="w-4 h-4" />
              <Sparkles className="w-4 h-4" />
              <Heart className="w-4 h-4" />
           </div>
           {!isAdmin && (
             <Link href="/admin/login" className="text-[10px] font-black text-slate-300 hover:text-teal-400 tracking-widest uppercase transition-colors">
                Seller Access Center
             </Link>
           )}
           <p className="text-[10px] text-slate-300 font-bold tracking-widest uppercase text-center leading-loose">
             Pet-ID Connect System © 2024 <br /> All Rights Reserved.
           </p>
        </footer>
      </main>
    </div>
  );
}
