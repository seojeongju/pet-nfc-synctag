import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { LayoutDashboard, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const runtime = "edge";

export default async function Home() {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAdmin = (session?.user as any)?.role === "admin";
  const dashboardLink = isAdmin ? "/admin" : "/dashboard";
  const buttonLabel = session 
    ? (isAdmin ? "관리자 센터 바로가기" : "내 대시보드로 이동") 
    : "지금 시작하기";

  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit overflow-hidden">
      {/* Hero Image Section */}
      <div className="relative w-full h-[60vh] flex items-center justify-center pt-8 px-4">
        <div className="relative w-full max-w-sm h-full rounded-[48px] overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-700">
           <Image 
             src="/korean_pet_hero_1774861698476.png" 
             alt="Happy Pet owner" 
             fill
             className="object-cover"
             priority
           />
           
           {/* Floating Badges */}
           <div className="absolute top-10 right-6 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-bounce duration-[3s]">
             FOOD 🦴
           </div>
           
           <div className="absolute bottom-20 left-6 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-xs font-bold shadow-lg">
             ACCESSORIES ✨
           </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 text-center space-y-8 py-10">
        <div className="space-y-4 max-w-sm">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            반려동물을 위한 <br />
            <span className="text-teal-500 font-black">새로운 세상</span>을 만나보세요!
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">
            NFC 스마트 인식표와 연동되는 Pet-ID Connect에서 실시간 위치 알림과 우리 아이의 디지털 명함을 관리하세요.
          </p>
        </div>

        {/* Call to Action */}
        <div className="w-full max-w-sm space-y-6">
          <Link href={dashboardLink} className="block w-full group">
            <button className={cn(
              "w-full h-16 flex items-center justify-center gap-3 rounded-[32px] text-lg font-black shadow-xl transition-all transform active:scale-95",
              isAdmin 
                ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200" 
                : "bg-teal-500 text-white hover:bg-teal-600 shadow-teal-100"
            )}>
              {isAdmin ? <ShieldCheck className="w-6 h-6 text-teal-400" /> : <LayoutDashboard className="w-6 h-6" />}
              {buttonLabel}
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </Link>
          
          {!session && (
            <div className="text-sm text-slate-500 font-medium">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-teal-600 font-black hover:underline underline-offset-4">
                로그인
              </Link>
            </div>
          )}
          
          {session && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
               <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
               {session.user.name}님으로 로그인됨
            </div>
          )}
        </div>
      </div>

      <footer className="py-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-300 font-bold tracking-widest uppercase">
          <span>Pet-ID Connect © 2024. All Rights Reserved.</span>
        </div>
        {!isAdmin && (
          <Link 
            href="/admin/login" 
            className="inline-block text-[9px] text-slate-200 hover:text-teal-400 font-bold transition-colors tracking-tighter"
          >
            SELLER LOGIN
          </Link>
        )}
      </footer>
    </div>
  );
}
