"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Phone, AlertTriangle, Heart, Share2, 
  ArrowLeft, ShieldCheck, PawPrint, Home, 
  Settings, Activity,
  Calendar, Fingerprint, MapPin,
  UserRound, Baby, Briefcase, LogIn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { LocationShare } from "@/components/LocationShare";
import { TagManageCard } from "@/components/TagManageCard";
import { useRef } from "react";
import Image from "next/image";
import { subjectKindMeta, subjectKindNfcPublic, type SubjectKind } from "@/lib/subject-kind";
import {
  maskNameForPublicViewer,
  maskBreedFieldForPublic,
  nfcPublicFinderIntro,
  nfcPublicEmergencyBadge,
} from "@/lib/nfc-public-display";

const heroIcons: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
};

interface PetProfileClientProps {
  pet: {
    id: string;
    name: string;
    breed?: string | null;
    photo_url?: string | null;
    emergency_contact?: string | null;
    medical_info?: string | null;
  };
  isOwner: boolean;
  petTags: Array<{ id: string; is_active?: boolean }>;
  tagId: string | null;
  subjectKind: SubjectKind;
  isPublicViewer: boolean;
  nfcEntry: boolean;
}

export default function PetProfileClient({
  pet,
  isOwner,
  petTags,
  tagId,
  subjectKind,
  isPublicViewer,
  nfcEntry,
}: PetProfileClientProps) {
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  
  // Parallax effects for the hero image
  const imageY = useTransform(scrollY, [0, 400], [0, 100]);
  const imageScale = useTransform(scrollY, [0, 400], [1, 1.2]);
  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
  };

  const meta = subjectKindMeta[subjectKind];
  const nfc = subjectKindNfcPublic[subjectKind];
  const kindQs = `?kind=${encodeURIComponent(subjectKind)}`;
  const HeroIcon = heroIcons[subjectKind];
  const displayName = maskNameForPublicViewer(pet.name, subjectKind, isPublicViewer);
  const profileLoginCallback = `/profile/${pet.id}${kindQs}${tagId ? `&tag=${encodeURIComponent(tagId)}` : ""}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(profileLoginCallback)}`;
  const finderCopy =
    subjectKind === "pet"
      ? "아이를 발견하셨나요? 당황하지 마세요! 아래 연락처로 연락 주시면 보호자님께 즉시 전달됩니다."
      : "발견하셨나요? 아래 연락처로 연락 주시면 등록자에게 즉시 전달됩니다.";
  const finderParagraph = isPublicViewer ? nfcPublicFinderIntro[subjectKind] : finderCopy;
  const idSecondary =
    subjectKind === "pet"
      ? "품종 미상"
      : subjectKind === "luggage"
        ? "메모 없음"
        : "비고 없음";
  const breedForDisplay = maskBreedFieldForPublic(pet.breed, subjectKind, isPublicViewer, idSecondary);
  const heroBreedSubtitle =
    !isPublicViewer
      ? pet.breed?.trim() || null
      : subjectKind === "elder" || subjectKind === "child"
        ? pet.breed?.trim()
          ? maskBreedFieldForPublic(pet.breed, subjectKind, true, "")
          : null
        : pet.breed?.trim() || null;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDFCFB] font-outfit pb-32 overflow-x-hidden relative">
      {/* Immersive Hero Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <motion.div 
          style={{ y: imageY, scale: imageScale }}
          className="absolute inset-0 z-0"
        >
          {pet.photo_url ? (
            <Image src={pet.photo_url} alt={`${displayName} 프로필`} fill className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white/20">
              <HeroIcon className="w-40 h-40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>

        {/* Top Floating Controls */}
        <motion.div 
          style={{ opacity: headerOpacity }}
          className="absolute top-8 left-6 right-6 z-30 flex items-center justify-between"
        >
          <Link href={isOwner ? `/dashboard${kindQs}` : "/"}>
             <div className="w-12 h-12 rounded-2xl glass-dark border-white/10 flex items-center justify-center shadow-2xl text-white active:scale-90 transition-transform">
                <ArrowLeft className="w-6 h-6" />
             </div>
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl glass-dark border-white/10 flex items-center justify-center shadow-2xl text-white hover:text-rose-400 transition-colors">
                <Heart className="w-6 h-6" />
             </div>
             <div className="w-12 h-12 rounded-2xl glass-dark border-white/10 flex items-center justify-center shadow-2xl text-white hover:text-teal-400 transition-colors">
                <Share2 className="w-6 h-6" />
             </div>
          </div>
        </motion.div>

        {/* Pet Overlay Title */}
        <div className="absolute bottom-16 left-8 z-20">
           <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="space-y-1"
           >
              <span className="bg-teal-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                 {meta.label}
              </span>
              <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">{displayName}</h1>
              {heroBreedSubtitle ? (
                <p className="text-sm font-bold text-white/90 mt-1 drop-shadow-md">{heroBreedSubtitle}</p>
              ) : null}
           </motion.div>
        </div>
        
        {/* Curved bottom separator */}
        <div className="absolute bottom-0 left-0 w-full h-12 bg-[#FDFCFB] rounded-t-[48px] z-10" />
      </div>

      {nfcEntry && isPublicViewer && (
        <div className="max-w-md mx-auto px-6 -mt-2 mb-2 relative z-20">
          <div className="rounded-2xl bg-teal-600/10 border border-teal-200 px-4 py-2 text-center">
            <p className="text-[11px] font-bold text-teal-800">
              NFC 태그로 이 페이지를 열었습니다. 발견을 도와주셔서 감사합니다.
            </p>
          </div>
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto px-6 -mt-4 relative z-20 space-y-8"
      >
        {/* Core Info & Alert Widget */}
        <motion.section variants={itemVariants}>
          <Card className="border-none shadow-app rounded-[40px] overflow-hidden bg-white/80 backdrop-blur-md">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 leading-none">
                      {subjectKind === "pet" ? (
                        <>
                          우리 소중한 <span className="text-teal-500">{displayName}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-teal-500">{displayName}</span>
                          <span className="text-slate-600"> · {meta.label}</span>
                        </>
                      )}
                    </h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      {isPublicViewer ? nfc.roleLine : "Digital Identification"}
                    </p>
                 </div>
                 <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-14 h-14 rounded-3xl bg-rose-50 flex flex-col items-center justify-center text-rose-500 shadow-sm shadow-rose-100"
                 >
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-[8px] font-black mt-0.5">
                      {isPublicViewer ? nfcPublicEmergencyBadge[subjectKind] : "긴급"}
                    </span>
                 </motion.div>
              </div>

              <p className="text-[13px] text-slate-500 font-bold leading-relaxed">
                 {finderParagraph}
              </p>

              {/* Action Buttons */}
              <div className="grid gap-4 mt-2 focus-within:ring-0">
                 {pet.emergency_contact ? (
                 <a href={`tel:${pet.emergency_contact}`} className="group">
                    <Button className="w-full h-20 rounded-[28px] bg-teal-500 hover:bg-teal-600 text-white font-black text-lg shadow-xl shadow-teal-500/20 transition-all active:scale-[0.97] flex items-center justify-center gap-4 border-b-4 border-teal-700">
                       <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Phone className="w-6 h-6 animate-pulse" /></div>
                       {isPublicViewer ? nfc.callCta : "보호자님 호출하기"}
                    </Button>
                 </a>
                 ) : (
                    <Button disabled className="w-full h-16 rounded-[28px] text-slate-400 font-bold">
                      등록된 연락처가 없습니다
                    </Button>
                 )}
                 {isPublicViewer && !tagId && (
                   <p className="text-[11px] text-slate-400 text-center font-medium -mt-1">
                     NFC 태그로 스캔한 경우에만 발견 위치를 보호자에게 전달할 수 있어요.
                   </p>
                 )}
                 <LocationShare tagId={tagId} />
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Feature Grid */}
        <motion.section variants={itemVariants} className="grid grid-cols-2 gap-4">
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-[14px] bg-slate-50 flex items-center justify-center text-slate-400"><Fingerprint className="w-5 h-5" /></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                   {isPublicViewer ? nfc.idCardLabel : "Identification"}
                 </p>
                 <p className="text-xs font-black text-slate-900 mt-0.5">{breedForDisplay}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-[14px] bg-slate-50 flex items-center justify-center text-slate-400">
                {isPublicViewer ? <MapPin className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                   {isPublicViewer ? nfc.scanHintLabel : "Age Status"}
                 </p>
                 <p className="text-xs font-black text-slate-900 mt-0.5 leading-snug">
                   {isPublicViewer ? nfc.scanHintBody : "최신 기록 확인"}
                 </p>
              </div>
           </div>
        </motion.section>

        {/* Detailed info: 소유자 전체 / 공개 방문자는 민감 메모 비노출 (S3) */}
        <motion.section variants={itemVariants}>
           <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
              {!isPublicViewer ? (
                <>
              <div className="flex gap-1 p-2 bg-slate-50 mx-6 mt-6 rounded-2xl">
                 <button type="button" className="flex-1 py-3 text-[10px] font-black bg-white rounded-xl shadow-sm text-teal-600 uppercase tracking-wider transition-all">Health</button>
                 <button type="button" className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider">Reports</button>
                 <button type="button" className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider">Gallery</button>
              </div>
              <CardContent className="p-8 pt-6 space-y-6">
                 <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                       <Activity className="w-4 h-4 text-teal-500" />
                       {subjectKind === "pet"
                         ? "의료 기록 및 특이사항"
                         : subjectKind === "elder"
                           ? "건강 · 특이사항"
                           : "메모 · 특이사항"}
                    </h4>
                    <div className="p-5 rounded-[24px] bg-slate-50 border border-slate-100 italic">
                       <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                         &quot;{pet.medical_info || (subjectKind === "pet" ? "등록된 건강 정보가 없습니다." : "등록된 메모가 없습니다.")}&quot;
                       </p>
                    </div>
                 </div>
              </CardContent>
                </>
              ) : (
              <CardContent className="p-8 space-y-2">
                <h4 className="text-xs font-black text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-500" />
                  상세 메모 비공개
                </h4>
                <p className="text-xs font-bold text-slate-400 leading-relaxed">
                  의료·메모 등 상세 정보는 Pet-ID 앱에 로그인한 소유자만 볼 수 있습니다. 발견 도움은 위 연락처와 위치 공유로 전달됩니다.
                </p>
              </CardContent>
              )}
           </Card>
        </motion.section>

        {/* Owner Exclusive Section */}
        {isOwner && (
          <motion.section variants={itemVariants}>
             <div className="px-2">
                <TagManageCard petId={pet.id} existingTags={petTags} />
             </div>
          </motion.section>
        )}

        {/* Brand Footer */}
        <motion.section variants={itemVariants} className="text-center space-y-4 pt-4 pb-12">
           <div className="h-px w-20 bg-slate-200 mx-auto opacity-50" />
           <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em] leading-relaxed max-w-[200px] mx-auto">
             Pet-ID Connect <br /> Safe Secure Technology
           </p>
        </motion.section>
      </motion.div>

      {/* Floating Bottom Nav: 소유자는 대시보드 연동 · 공개 방문자는 랜딩/연락 중심 (S3) */}
      {isPublicViewer ? (
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-20 glass-dark rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 flex items-center justify-around px-6 border border-white/20">
         <Link href="/" className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <Home className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white tracking-widest">홈</span>
         </Link>
         {pet.emergency_contact ? (
         <a href={`tel:${pet.emergency_contact}`} className="flex flex-col items-center gap-1 group">
            <div className="p-3.5 -mt-8 rounded-full bg-teal-500 text-white shadow-xl shadow-teal-500/40 border-4 border-slate-950">
               <Phone className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-teal-400 tracking-widest mt-1">전화</span>
         </a>
         ) : (
         <div className="flex flex-col items-center gap-1 opacity-40">
            <div className="p-3.5 -mt-8 rounded-full bg-slate-600 text-white border-4 border-slate-950">
               <Phone className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-500 tracking-widest mt-1">—</span>
         </div>
         )}
         <Link href={loginHref} className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <LogIn className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white tracking-widest">로그인</span>
         </Link>
      </nav>
      ) : (
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-20 glass-dark rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 flex items-center justify-around px-4 border border-white/20">
         <Link href={`/dashboard${kindQs}`} className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <Home className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Home</span>
         </Link>
         <Link href={`/dashboard/pets${kindQs}`} className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <PawPrint className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Pets</span>
         </Link>
         <div className="flex flex-col items-center gap-1">
            <div className="p-3.5 -mt-10 rounded-full bg-teal-500 text-white shadow-xl shadow-teal-500/40 border-4 border-slate-950 transition-all active:scale-90">
               <Share2 className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest mt-1">Share</span>
         </div>
         <Link href={`/dashboard/scans${kindQs}`} className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <Activity className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Activity</span>
         </Link>
         <Link href={isOwner ? `/dashboard/pets/${pet.id}/edit${kindQs}` : `/dashboard${kindQs}`} className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <Settings className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Edit</span>
         </Link>
      </nav>
      )}
    </div>
  );
}
