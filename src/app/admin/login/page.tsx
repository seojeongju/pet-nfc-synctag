"use client";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, MessageSquare, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const handleLogin = async (provider: "google" | "kakao") => {
    await signIn.social({
      provider,
      callbackURL: "/admin",
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-outfit items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration for professional look */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

      <Link href="/" className="absolute top-8 left-8 z-20">
        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl hover:bg-white/20 transition-all text-white active:scale-90">
           <ArrowLeft className="w-6 h-6" />
        </div>
      </Link>

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-1000 relative z-10">
        <div className="text-center space-y-4">
           <div className="w-24 h-24 bg-slate-800 rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700 flex items-center justify-center text-teal-400 mx-auto transform hover:rotate-12 transition-transform duration-500">
              <ShieldCheck className="w-12 h-12" />
           </div>
           <div className="space-y-2">
             <div className="flex items-center justify-center gap-2 text-teal-500 font-black tracking-widest text-[10px] uppercase">
                <Lock className="w-3 h-3" />
                Authorized Personnel Only
             </div>
             <h1 className="text-4xl font-black text-white tracking-tight">판매자 센터</h1>
             <p className="text-slate-400 text-sm font-bold">NFC 태그 관리 및 재고 현황을 확인하세요.</p>
           </div>
        </div>

        <Card className="border-slate-800 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] rounded-[48px] overflow-hidden bg-slate-800/50 backdrop-blur-2xl border">
          <CardHeader className="pt-12 pb-8 text-center bg-gradient-to-b from-slate-800/80 to-transparent">
            <CardTitle className="text-2xl font-black text-white">관리자 로그인</CardTitle>
            <CardDescription className="text-slate-500 text-xs font-bold leading-relaxed px-10">
              등록된 관리자 계정으로 소셜 로그인을 진행해 주세요. 보안을 위해 활동 내역이 기록됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4 space-y-5">
            <Button 
              variant="outline" 
              className="w-full h-18 rounded-[28px] border-slate-700 bg-white hover:bg-slate-50 text-slate-900 font-black text-lg flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-2xl"
              onClick={() => handleLogin("google")}
            >
              Google로 관리 시작
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-18 rounded-[28px] border-none bg-[#FEE500] hover:bg-[#FEE500]/90 text-slate-900 font-black text-lg flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-2xl"
              onClick={() => handleLogin("kakao")}
            >
              <MessageSquare className="w-7 h-7 fill-current" />
              카카오로 관리 시작
            </Button>

            <div className="pt-10 text-center">
               <p className="text-[10px] text-slate-600 font-bold leading-relaxed max-w-[200px] mx-auto opacity-50">
                 권한이 없는 경우 접근이 제한될 수 있습니다. 문의: admin@wow3d.net
               </p>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center pt-4">
           <p className="text-[10px] text-slate-600 font-black tracking-widest uppercase">
             Seller Management System © 2024
           </p>
        </footer>
      </div>
    </div>
  );
}
