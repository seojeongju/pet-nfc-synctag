import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Activity, History, PawPrint, Search, Bell, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { getPets } from "@/app/actions/pet";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { redirect } from "next/navigation";

export const runtime = "edge";

export default async function DashboardPage() {
  const db = getDB();
  const auth = getAuth(db);
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const pets = await getPets(session.user.id);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 font-outfit pb-24">
      {/* Top Welcome Section */}
      <section className="space-y-4 px-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-teal-600 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              대한민국, 서울
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
               안녕하세요, {session.user.name || "보호자"}님! 👋
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/logout">
             <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
               <LogOut className="w-5 h-5" />
             </div>
            </Link>
            <div className="w-12 h-12 rounded-full border-4 border-white shadow-lg overflow-hidden bg-teal-50 flex items-center justify-center">
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name || ""} className="w-full h-full object-cover" />
              ) : (
                <PawPrint className="w-6 h-6 text-teal-500" />
              )}
            </div>
          </div>
        </div>
        
        {/* Search Bar stylized from mockup */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="반려동물 이름을 검색하세요..." 
            className="w-full h-14 bg-white border-none rounded-[28px] pl-12 pr-4 shadow-xl shadow-slate-100/50 focus:ring-2 focus:ring-teal-200 transition-all text-sm outline-none"
          />
        </div>
      </section>

      {/* Special Offer Card / Banner Style from mockup */}
      <Card className="border-none rounded-[36px] bg-gradient-to-br from-teal-500 to-teal-600 text-white overflow-hidden relative shadow-2xl shadow-teal-100 mx-2">
        <div className="p-8 space-y-4 relative z-10">
          <div className="space-y-1">
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full w-fit backdrop-blur-sm">
              NEW EVENT
            </span>
            <h2 className="text-2xl font-bold">NFC 스마트 인식표 <br /> 정기 점검 혜택 🐾</h2>
          </div>
          <p className="text-white/80 text-sm max-w-[60%]">
             지금 바로 아이들의 NFC 칩 상태를 확인하고 무료 정밀 검진권을 받아보세요.
          </p>
          <Button variant="secondary" className="rounded-full font-bold bg-white text-teal-600 hover:bg-teal-50 px-6 h-12 shadow-md">
            검사 신청하기
          </Button>
        </div>
        
        {/* Background mockup circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
      </Card>

      {/* Categories / Summary stylized from mockup */}
      <section className="px-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-800">함께하는 아이들</h3>
          <Link href="/dashboard/pets" className="text-sm font-bold text-teal-600 font-outfit">전체보기</Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide py-2 px-1">
          {pets && pets.length > 0 ? (
            pets.map((pet: any) => (
              <Link href={`/profile/${pet.id}`} key={pet.id}>
                <Card className="min-w-[180px] rounded-[32px] border-none shadow-xl shadow-slate-100 overflow-hidden hover:scale-105 transition-transform duration-300">
                  <div className="h-28 bg-teal-50 relative group">
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-teal-200 group-hover:scale-110 transition-transform">
                        <PawPrint className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 text-center space-y-1">
                     <h4 className="font-bold text-slate-800 font-outfit">{pet.name}</h4>
                     <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{pet.breed || "UNKNOWN"}</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : null}
          
          {/* Add Button as a card */}
          <Link href="/dashboard/pets/new">
            <Card className="min-w-[180px] h-full min-h-[188px] rounded-[32px] border-2 border-dashed border-teal-100 bg-white flex flex-col items-center justify-center gap-2 hover:bg-teal-50/50 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 group-hover:bg-teal-500 group-hover:text-white transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-teal-500">아이 등록</span>
            </Card>
          </Link>
        </div>
      </section>

      {/* Recent Activity placeholder */}
      <section className="px-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-800">최근 보호 알림</h3>
          <History className="w-5 h-5 text-slate-300" />
        </div>
        
        <Card className="border-none rounded-[36px] bg-slate-50 p-6 flex items-center justify-between group hover:bg-teal-50 transition-colors">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
               <Bell className="w-6 h-6" />
             </div>
             <div className="space-y-0.5">
               <h4 className="font-bold text-slate-800">최근 스캔 기록이 없습니다</h4>
               <p className="text-sm text-slate-400">아이들의 인식표가 안전한 상태입니다.</p>
             </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:translate-x-1 transition-transform">
            <Plus className="w-4 h-4 text-teal-500 rotate-45" />
          </div>
        </Card>
      </section>
    </div>
  );
}
