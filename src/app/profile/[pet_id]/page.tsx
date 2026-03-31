import { getPet } from "@/app/actions/pet";
import { getPetTags } from "@/app/actions/tag";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Info, AlertTriangle, MessageSquare, PawPrint, Heart, Share2, ArrowLeft, Settings, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { LocationShare } from "@/components/LocationShare";
import { TagManageCard } from "@/components/TagManageCard";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";

export const runtime = "edge";

export default async function PublicProfilePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ pet_id: string }>,
  searchParams: Promise<{ tag?: string }>
}) {
  const { pet_id } = await params;
  const { tag } = await searchParams;

  const db = getDB();
  const auth = getAuth(db);
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const pet = await getPet(pet_id) as any;
  const tagId = tag || null;

  if (!pet) {
    notFound();
  }

  const isOwner = session?.user.id === pet.owner_id;
  const petTags = isOwner ? await getPetTags(pet.id) : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit relative pb-24">
      {/* Top Action Bar */}
      <div className="absolute top-6 left-6 z-30 flex items-center justify-between w-[calc(100%-48px)]">
        <Link href={isOwner ? "/dashboard" : "/"}>
           <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg text-slate-800 hover:bg-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
           </div>
        </Link>
        <div className="flex items-center gap-3">
          {isOwner && (
            <div className="bg-teal-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
               <ShieldCheck className="w-4 h-4" />
               OWNER VIEW
            </div>
          )}
          <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg text-slate-800 hover:text-rose-500 transition-colors">
             <Heart className="w-6 h-6" />
          </div>
          <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg text-slate-800 hover:text-teal-600 transition-colors">
             <Share2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className="relative h-[55vh] w-full pt-10 px-6 flex items-center justify-center">
        <div className="relative w-full h-full max-w-sm rounded-[48px] overflow-hidden shadow-2xl bg-teal-50">
          {pet.photo_url ? (
             <div className="absolute inset-0 bg-black/10 z-10 p-8 flex items-end">
                <div className="space-y-1">
                   <span className="text-white/80 text-xs font-bold uppercase tracking-widest">{pet.breed || "KOREAN PET"}</span>
                   <h1 className="text-4xl font-extrabold text-white">{pet.name}</h1>
                </div>
             </div>
          ) : (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-teal-100 gap-6">
                <PawPrint className="w-24 h-24 animate-pulse" />
                <h1 className="text-4xl font-extrabold text-teal-500">{pet.name}</h1>
             </div>
          )}
        </div>
      </div>

      {/* Floating Info Card Section */}
      <div className="flex-1 container max-w-sm mx-auto -mt-16 relative z-20 px-2 space-y-6">
        <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white/95 backdrop-blur-sm">
          <CardHeader className="p-8 pb-4">
             <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-slate-900">{pet.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-teal-600 font-bold text-sm">{pet.breed || "품종 미상"}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    <div className="flex text-amber-400">
                       <Heart className="w-3 h-3 fill-current" />
                       <Heart className="w-3 h-3 fill-current" />
                       <Heart className="w-3 h-3 fill-current" />
                       <Heart className="w-3 h-3 fill-current" />
                       <Heart className="w-3 h-3 fill-current" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                      <AlertTriangle className="w-5 h-5" />
                   </div>
                   <span className="text-[10px] font-bold text-rose-500 uppercase">Alert</span>
                </div>
             </div>
             <p className="text-sm text-slate-400 font-medium leading-relaxed">
               보호자님의 소중한 가족입니다. 발견 시 아래 연락처로 연락 부탁드립니다.
             </p>
          </CardHeader>
          
          <CardContent className="p-8 pt-2 space-y-8">
            <div className="flex gap-4 border-b border-slate-50 pb-4">
               <button className="text-sm font-extrabold text-teal-600 border-b-2 border-teal-600 pb-2 px-1">기본정보</button>
               <button className="text-sm font-bold text-slate-300 pb-2 px-1 hover:text-slate-500 transition-colors">의료기록</button>
               <button className="text-sm font-bold text-slate-300 pb-2 px-1 hover:text-slate-500 transition-colors">추가자료</button>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                    <Info className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">의료 정보</h4>
                    <p className="text-sm font-bold text-slate-800 leading-snug">
                      {pet.medical_info || "등록된 건강 정보가 없습니다."}
                    </p>
                 </div>
              </div>

              <div className="flex items-start gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 flex-shrink-0">
                    <Phone className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">비상 연락처</h4>
                    <p className="text-sm font-bold text-slate-800 leading-snug underline underline-offset-4 decoration-emerald-200">
                      {pet.emergency_contact || "보호자 등록 전입니다."}
                    </p>
                 </div>
              </div>
            </div>

            <div className="pt-4 grid gap-4">
              <a href={`tel:${pet.emergency_contact}`} className="block">
                <Button className="w-full h-16 rounded-[24px] bg-teal-600 hover:bg-teal-700 text-lg font-extrabold shadow-xl shadow-teal-100 transition-all active:scale-95 gap-3">
                  <Phone className="w-6 h-6" />
                  보호자님께 전화하기
                </Button>
              </a>
              
              <LocationShare tagId={tagId} />
            </div>
          </CardContent>
        </Card>

        {isOwner && (
           <TagManageCard petId={pet.id} existingTags={petTags} />
        )}

        <div className="mt-10 mb-8 text-center px-6">
           <div className="bg-slate-200 h-[1px] w-full mb-6 opacity-30"></div>
           <p className="text-[10px] text-slate-300 leading-relaxed max-w-[80%] mx-auto font-medium">
             Pet-ID Connect는 3D 프린팅 NFC 기술을 활용하여 반려동물과 보호자를 연결하는 가장 안전한 서비스입니다.
           </p>
        </div>
      </div>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-slate-900 rounded-[32px] shadow-2xl flex items-center justify-around px-4 z-50">
         <Link href="/dashboard">
          <div className={isOwner ? "w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/50" : "w-10 h-10 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors"}>
              <PawPrint className="w-5 h-5" />
          </div>
         </Link>
         <div className="w-10 h-10 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors">
            <Heart className="w-5 h-5" />
         </div>
         <Link href="/dashboard/pets/new">
          <div className="w-12 h-12 -mt-4 rounded-full bg-teal-500 border-4 border-slate-900 flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
          </div>
         </Link>
         <div className="w-10 h-10 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors">
            <MessageSquare className="w-5 h-5" />
         </div>
         <div className="w-10 h-10 rounded-full flex items-center justify-center text-white/30 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
         </div>
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}
