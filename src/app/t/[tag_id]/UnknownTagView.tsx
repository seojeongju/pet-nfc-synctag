"use client";

import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function UnknownTagView({ tagId }: { tagId: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFCFB] px-8 text-center font-outfit">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-rose-50 text-rose-500 shadow-sm ring-1 ring-rose-100"
      >
        <AlertCircle className="h-12 w-12" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-4"
      >
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          등록되지 않은 인식표입니다
        </h1>
        <div className="space-y-1">
          <p className="text-[15px] font-bold leading-relaxed text-slate-500">
            스캔하신 인식표(태그) 정보가 시스템에 없거나,
          </p>
          <p className="text-[15px] font-bold leading-relaxed text-slate-500">
            아직 반려인과 연결되지 않은 상태입니다.
          </p>
        </div>
        
        <div className="py-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-black text-slate-500 uppercase tracking-widest">
            Tag ID: {tagId.slice(0, 12)}{tagId.length > 12 ? "..." : ""}
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-10 flex w-full max-w-lg flex-col gap-4 px-2 sm:px-0"
      >
        <Link href="/" className="w-full touch-manipulation" prefetch={false}>
          <Button
            size="lg"
            className="min-h-[3.75rem] w-full rounded-[1.35rem] bg-teal-500 px-6 py-4 text-lg font-black tracking-tight text-white shadow-[0_20px_40px_-12px_rgba(20,184,166,0.45)] ring-2 ring-teal-400/30 transition-all hover:bg-teal-600 hover:shadow-[0_24px_48px_-12px_rgba(13,148,136,0.5)] hover:ring-teal-300/40 active:scale-[0.98] sm:min-h-[4rem] sm:rounded-3xl sm:text-xl sm:py-5"
          >
            <Home className="mr-3 h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden />
            홈으로 돌아가기
          </Button>
        </Link>
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
