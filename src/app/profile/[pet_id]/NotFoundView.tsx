"use client";

import { Search, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFoundView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFCFB] px-8 text-center font-outfit">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-slate-50 text-slate-400 shadow-sm ring-1 ring-slate-100"
      >
        <Search className="h-12 w-12" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-4"
      >
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          정보를 찾을 수 없습니다
        </h1>
        <div className="space-y-1">
          <p className="text-[15px] font-bold leading-relaxed text-slate-500">
            요청하신 프로필 정보가 존재하지 않거나,
          </p>
          <p className="text-[15px] font-bold leading-relaxed text-slate-500">
            이미 삭제되어 확인할 수 없는 상태입니다.
          </p>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-10 flex w-full max-w-xs flex-col gap-3"
      >
        <Link href="/" className="w-full">
          <Button className="h-15 w-full rounded-2xl bg-teal-500 text-base font-black shadow-xl shadow-teal-500/20 hover:bg-teal-600 active:scale-[0.98] transition-all">
            <Home className="mr-2 h-5 w-5" />
            홈으로 돌아가기
          </Button>
        </Link>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="h-15 w-full rounded-2xl border-slate-200 bg-white text-base font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          <ArrowLeft className="mr-2 h-5 w-5 text-slate-400" />
          이전 페이지로
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="mt-16 text-center"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 leading-relaxed">
          링크유 Link-U <br /> Safe Secure Technology
        </p>
      </motion.div>
    </div>
  );
}
