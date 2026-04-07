"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Phone, AlertTriangle, Heart, Share2, 
  ArrowLeft, ShieldCheck, PawPrint, Home, 
  Settings, Activity,
  Calendar, Fingerprint, MapPin
} from "lucide-react";
import Link from "next/link";
import { LocationShare } from "@/components/LocationShare";
import { TagManageCard } from "@/components/TagManageCard";
import { useRef } from "react";
import Image from "next/image";

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
}

export default function PetProfileClient({ pet, isOwner, petTags, tagId }: PetProfileClientProps) {
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

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDFCFB] font-outfit pb-32 overflow-x-hidden relative">
      {/* Immersive Hero Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <motion.div 
          style={{ y: imageY, scale: imageScale }}
          className="absolute inset-0 z-0"
        >
          {pet.photo_url ? (
            <Image src={pet.photo_url} alt={pet.name} fill className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white/20">
              <PawPrint className="w-40 h-40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>

        {/* Top Floating Controls */}
        <motion.div 
          style={{ opacity: headerOpacity }}
          className="absolute top-8 left-6 right-6 z-30 flex items-center justify-between"
        >
          <Link href={isOwner ? "/dashboard" : "/"}>
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
                 {pet.breed || "KOREAN PET"}
              </span>
              <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">{pet.name}</h1>
           </motion.div>
        </div>
        
        {/* Curved bottom separator */}
        <div className="absolute bottom-0 left-0 w-full h-12 bg-[#FDFCFB] rounded-t-[48px] z-10" />
      </div>

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
                    <h2 className="text-xl font-black text-slate-900 leading-none">우리 소중한 <span className="text-teal-500">{pet.name}</span></h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Digital Identification</p>
                 </div>
                 <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-14 h-14 rounded-3xl bg-rose-50 flex flex-col items-center justify-center text-rose-500 shadow-sm shadow-rose-100"
                 >
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase mt-0.5">Emergency</span>
                 </motion.div>
              </div>

              <p className="text-[13px] text-slate-500 font-bold leading-relaxed">
                 아이를 발견하셨나요? 당황하지 마세요! 아래 연락처로 연락 주시면 보호자님께 즉시 아이의 위치와 소식이 전달됩니다. 🐾💖
              </p>

              {/* Action Buttons */}
              <div className="grid gap-4 mt-2 focus-within:ring-0">
                 <a href={`tel:${pet.emergency_contact}`} className="group">
                    <Button className="w-full h-20 rounded-[28px] bg-teal-500 hover:bg-teal-600 text-white font-black text-lg shadow-xl shadow-teal-500/20 transition-all active:scale-[0.97] flex items-center justify-center gap-4 border-b-4 border-teal-700">
                       <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Phone className="w-6 h-6 animate-pulse" /></div>
                       보호자님 호출하기
                    </Button>
                 </a>
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
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identification</p>
                 <p className="text-xs font-black text-slate-900 mt-0.5">{pet.breed || "품종 미상"}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-[14px] bg-slate-50 flex items-center justify-center text-slate-400"><Calendar className="w-5 h-5" /></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Age Status</p>
                 <p className="text-xs font-black text-slate-900 mt-0.5">최신 기록 확인</p>
              </div>
           </div>
        </motion.section>

        {/* Detailed Info Tabs Placeholder */}
        <motion.section variants={itemVariants}>
           <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
              <div className="flex gap-1 p-2 bg-slate-50 mx-6 mt-6 rounded-2xl">
                 <button className="flex-1 py-3 text-[10px] font-black bg-white rounded-xl shadow-sm text-teal-600 uppercase tracking-wider transition-all">Health</button>
                 <button className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider">Reports</button>
                 <button className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider">Gallery</button>
              </div>
              <CardContent className="p-8 pt-6 space-y-6">
                 <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                       <Activity className="w-4 h-4 text-teal-500" />
                       의료 기록 및 특이사항
                    </h4>
                    <div className="p-5 rounded-[24px] bg-slate-50 border border-slate-100 italic">
                       <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                         &quot;{pet.medical_info || "등록된 건강 정보가 없습니다. 아이를 안전하게 보호해 주세요."}&quot;
                       </p>
                    </div>
                 </div>
              </CardContent>
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

      {/* Floating Bottom Nav (Consistent with Dashboard) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-20 glass-dark rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 flex items-center justify-around px-4 border border-white/20">
         <Link href="/dashboard" className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <Home className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Home</span>
         </Link>
         <Link href="/dashboard/pets" className="flex flex-col items-center gap-1 group">
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
         <Link href="/dashboard/scans" className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <Activity className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Activity</span>
         </Link>
         <Link href="/settings" className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <Settings className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Edit</span>
         </Link>
      </nav>
    </div>
  );
}
