import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit overflow-hidden">
      {/* Hero Image Section */}
      <div className="relative w-full h-[60vh] flex items-center justify-center pt-8 px-4">
        <div className="relative w-full max-w-sm h-full rounded-[48px] overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-700">
           {/* Replace with actual path in your production environment */}
           <Image 
             src="/korean_pet_hero_1774861698476.png" 
             alt="Happy Korean Pet Owner" 
             fill
             className="object-cover"
             priority
           />
           
           {/* Floating Badges (Mockup items) */}
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
            <span className="text-teal-500">새로운 세상</span>을 만나보세요!
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            NFC 스마트 인식표와 연동되는 Pet-ID Connect에서 실시간 위치 알림과 우리 아이의 디지털 명함을 관리하세요.
          </p>
        </div>

        {/* Call to Action */}
        <div className="w-full max-w-sm space-y-6">
          <Link href="/dashboard" className="block w-full">
            <button className="w-full h-16 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white rounded-[32px] text-lg font-bold shadow-xl shadow-teal-100 transition-all transform active:scale-95">
              시작하기
            </button>
          </Link>
          
          <div className="text-sm text-slate-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-teal-600 font-bold hover:underline underline-offset-4">
              로그인
            </Link>
          </div>
        </div>
      </div>

      <footer className="py-8 text-center text-[10px] text-slate-300">
        Pet-ID Connect © 2024. All Rights Reserved.
      </footer>
    </div>
  );
}
