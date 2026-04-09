"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Phone, AlertTriangle, Heart, Share2, 
  ArrowLeft, ShieldCheck, PawPrint, Home, 
  Settings, Activity,
  Calendar, Fingerprint, MapPin,
  UserRound, Baby, Briefcase, Gem,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { LocationShare } from "@/components/LocationShare";
import { TagManageCard } from "@/components/TagManageCard";
import { useRef, useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { subjectKindMeta, subjectKindNfcPublic, type SubjectKind } from "@/lib/subject-kind";
import {
  maskNameForPublicViewer,
  maskBreedFieldForPublic,
  nfcPublicFinderIntro,
  nfcPublicEmergencyBadge,
} from "@/lib/nfc-public-display";
import { verifyOwnerAndLoadPetTags } from "@/app/actions/tag";
import { cn } from "@/lib/utils";

const heroIcons: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
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
  tenantId?: string | null;
  tenantSuspended?: boolean;
  isOwner: boolean;
  petTags: Array<{ id: string; is_active?: boolean }>;
  tagId: string | null;
  subjectKind: SubjectKind;
  isPublicViewer: boolean;
  nfcEntry: boolean;
  scanEntrySource?: "scan" | null;
  /** NFC(?tag=) 진입 + 세션이 소유자일 때 보호자 패널을 숨김 */
  nfcOwnerGate?: boolean;
}

export default function PetProfileClient({
  pet,
  tenantId,
  tenantSuspended = false,
  isOwner,
  petTags,
  tagId,
  subjectKind,
  isPublicViewer,
  nfcEntry,
  scanEntrySource = null,
  nfcOwnerGate = false,
}: PetProfileClientProps) {
  const containerRef = useRef(null);
  const [ownerUnlocked, setOwnerUnlocked] = useState(false);
  const [petTagsLive, setPetTagsLive] = useState(petTags);
  const [unlockPending, startUnlock] = useTransition();
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [locationShareStatus, setLocationShareStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [isPublicNavCondensed, setIsPublicNavCondensed] = useState(false);
  const [navTuning, setNavTuning] = useState({
    thresholdY: 56,
    delta: 1.6,
    scale: 0.95,
    opacity: 0.92,
    y: 3,
  });

  useEffect(() => {
    setPetTagsLive(petTags);
  }, [petTags]);

  /** 발견자 UI와 동일하게 취급: 비소유자이거나, NFC 게이트에서 아직 잠금 해제 전 */
  const treatAsPublicVisitor = isPublicViewer || (nfcOwnerGate && !ownerUnlocked);
  const writeLocked = Boolean(tenantId && tenantSuspended);

  const { scrollY } = useScroll();
  const publicNavScale = useTransform(scrollY, [0, 1], [1, 1]);
  const publicNavOpacity = useTransform(scrollY, [0, 1], [1, 1]);
  
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
  const qs = new URLSearchParams({ kind: subjectKind });
  if (tenantId) qs.set("tenant", tenantId);
  const kindQs = `?${qs.toString()}`;
  const HeroIcon = heroIcons[subjectKind];
  const displayName = maskNameForPublicViewer(pet.name, subjectKind, treatAsPublicVisitor);
  const finderCopy =
    subjectKind === "pet"
      ? "아이를 발견하셨나요? 당황하지 마세요! 아래 연락처로 연락 주시면 보호자님께 즉시 전달됩니다."
      : "발견하셨나요? 아래 연락처로 연락 주시면 등록자에게 즉시 전달됩니다.";
  const finderParagraph = treatAsPublicVisitor ? nfcPublicFinderIntro[subjectKind] : finderCopy;
  const idSecondary =
    subjectKind === "pet"
      ? "품종 미상"
      : subjectKind === "luggage"
        ? "메모 없음"
        : "비고 없음";
  const breedForDisplay = maskBreedFieldForPublic(pet.breed, subjectKind, treatAsPublicVisitor, idSecondary);
  const heroBreedSubtitle =
    !treatAsPublicVisitor
      ? pet.breed?.trim() || null
      : subjectKind === "elder" || subjectKind === "child"
        ? pet.breed?.trim()
          ? maskBreedFieldForPublic(pet.breed, subjectKind, true, "")
          : null
        : pet.breed?.trim() || null;

  useEffect(() => {
    if (locationShareStatus !== "success") return;
    const timer = setTimeout(() => setLocationShareStatus("idle"), 5000);
    return () => clearTimeout(timer);
  }, [locationShareStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateTuning = () => {
      const w = window.innerWidth;
      if (w <= 360) {
        setNavTuning({ thresholdY: 50, delta: 1.4, scale: 0.965, opacity: 0.94, y: 2 });
      } else if (w <= 390) {
        setNavTuning({ thresholdY: 56, delta: 1.6, scale: 0.955, opacity: 0.93, y: 3 });
      } else if (w <= 430) {
        setNavTuning({ thresholdY: 62, delta: 1.8, scale: 0.95, opacity: 0.92, y: 3 });
      } else {
        setNavTuning({ thresholdY: 64, delta: 2, scale: 0.945, opacity: 0.9, y: 4 });
      }
    };
    updateTuning();
    window.addEventListener("resize", updateTuning);
    return () => window.removeEventListener("resize", updateTuning);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? latest;
    const delta = latest - prev;
    if (latest < navTuning.thresholdY) {
      setIsPublicNavCondensed(false);
      return;
    }
    if (delta > navTuning.delta) {
      setIsPublicNavCondensed(true);
    } else if (delta < -navTuning.delta) {
      setIsPublicNavCondensed(false);
    }
  });

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
          <Link href={treatAsPublicVisitor ? "/" : `/dashboard${kindQs}`}>
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

      {nfcEntry && treatAsPublicVisitor && (
        <div className="max-w-md mx-auto px-6 -mt-2 mb-2 relative z-20">
          <div className="rounded-2xl bg-teal-600/10 border border-teal-200 px-4 py-3 text-center space-y-1.5">
            <p className="text-[11px] font-bold text-teal-800 leading-snug">
              {scanEntrySource === "scan"
                ? "태그 스캔(/t/…)으로 접속되었습니다. 아래 1) 연락 2) 위치 공유 순서로 도와주세요."
                : "NFC 태그로 이 페이지를 열었습니다. 발견을 도와주셔서 감사합니다."}
            </p>
            <p className="text-[10px] font-semibold text-teal-700/90">
              보호자는 로그인 후 <span className="font-black">대시보드 → 관리 대상</span>에서 같은 태그 ID를 연결할 수 있어요.
            </p>
          </div>
        </div>
      )}

      {nfcOwnerGate && !ownerUnlocked && (
        <div className="max-w-md mx-auto px-6 -mt-1 mb-3 relative z-20">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 space-y-2">
            <p className="text-[11px] font-bold text-amber-900 leading-snug">
              이 기기에 로그인된 계정이 이 프로필의 보호자와 일치합니다. 공용 기기에서는 다른 분이 보지 못하도록, 태그·대시보드 관리는 아래를 눌러 확인 후에만 열립니다.
            </p>
            <Button
              type="button"
              disabled={unlockPending}
              onClick={() => {
                setUnlockError(null);
                startUnlock(async () => {
                  const r = await verifyOwnerAndLoadPetTags(pet.id, tenantId);
                  if (r.ok) {
                    setOwnerUnlocked(true);
                    setPetTagsLive(r.tags);
                  } else if (r.error === "login_required") {
                    setUnlockError("다시 로그인한 뒤 시도해 주세요.");
                  } else {
                    setUnlockError("소유자 확인에 실패했습니다.");
                  }
                });
              }}
              className="w-full h-11 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wide"
            >
              {unlockPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline-block mr-2 align-middle" />
                  확인 중…
                </>
              ) : (
                "보호자 화면 열기 (태그·상세 관리)"
              )}
            </Button>
            {unlockError && (
              <p className="text-[10px] font-bold text-rose-600 text-center">{unlockError}</p>
            )}
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
                      {treatAsPublicVisitor ? nfc.roleLine : "Digital Identification"}
                    </p>
                 </div>
                 <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-14 h-14 rounded-3xl bg-rose-50 flex flex-col items-center justify-center text-rose-500 shadow-sm shadow-rose-100"
                 >
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-[8px] font-black mt-0.5">
                      {treatAsPublicVisitor ? nfcPublicEmergencyBadge[subjectKind] : "긴급"}
                    </span>
                 </motion.div>
              </div>

              <p className="text-[13px] text-slate-500 font-bold leading-relaxed">
                 {finderParagraph}
              </p>
              {treatAsPublicVisitor ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black text-slate-700">발견자 가이드</p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">
                    1) 먼저 보호자에게 전화하고, 2) 현재 위치를 공유해 주세요.
                  </p>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="grid gap-4 mt-2 focus-within:ring-0">
                 {pet.emergency_contact ? (
                 <a href={`tel:${pet.emergency_contact}`} className="group">
                    <Button className="w-full h-20 rounded-[28px] bg-teal-500 hover:bg-teal-600 text-white font-black text-lg shadow-xl shadow-teal-500/20 transition-all active:scale-[0.97] flex items-center justify-center gap-4 border-b-4 border-teal-700">
                       <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Phone className="w-6 h-6 animate-pulse" /></div>
                       {treatAsPublicVisitor ? nfc.callCta : "보호자님 호출하기"}
                    </Button>
                 </a>
                 ) : (
                    <Button disabled className="w-full h-16 rounded-[28px] text-slate-400 font-bold">
                      등록된 연락처가 없습니다
                    </Button>
                 )}
                 {treatAsPublicVisitor && !tagId && (
                   <p className="text-[11px] text-slate-400 text-center font-medium -mt-1">
                     NFC 태그로 스캔한 경우에만 발견 위치를 보호자에게 전달할 수 있어요.
                   </p>
                 )}
                 <div id="finder-location-share">
                   <LocationShare
                     tagId={tagId}
                     enabled={treatAsPublicVisitor}
                     onStatusChange={setLocationShareStatus}
                   />
                 </div>
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
                   {treatAsPublicVisitor ? nfc.idCardLabel : "Identification"}
                 </p>
                 <p className="text-xs font-black text-slate-900 mt-0.5">{breedForDisplay}</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-3">
              <div className="w-10 h-10 rounded-[14px] bg-slate-50 flex items-center justify-center text-slate-400">
                {treatAsPublicVisitor ? <MapPin className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                   {treatAsPublicVisitor ? nfc.scanHintLabel : "Age Status"}
                 </p>
                 <p className="text-xs font-black text-slate-900 mt-0.5 leading-snug">
                   {treatAsPublicVisitor ? nfc.scanHintBody : "최신 기록 확인"}
                 </p>
              </div>
           </div>
        </motion.section>

        {/* Detailed info: 소유자 전체 / 공개 방문자는 민감 메모 비노출 (S3) */}
        <motion.section variants={itemVariants}>
           <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
              {!treatAsPublicVisitor ? (
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
                  의료·메모 등 상세 정보는 링크유에 로그인한 소유자만 볼 수 있습니다. 발견 도움은 위 연락처와 위치 공유로 전달됩니다.
                </p>
              </CardContent>
              )}
           </Card>
        </motion.section>

        {/* Owner Exclusive Section */}
        {isOwner && (!nfcOwnerGate || ownerUnlocked) && (
          <motion.section variants={itemVariants}>
             <div className="px-2">
                {writeLocked ? (
                  <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
                    조직이 중지 상태라 수정/태그 관리 기능은 잠겨 있습니다. 조회만 가능합니다.
                  </div>
                ) : null}
                <TagManageCard petId={pet.id} existingTags={petTagsLive} writeLocked={writeLocked} />
             </div>
          </motion.section>
        )}

        {/* Brand Footer */}
        <motion.section variants={itemVariants} className="text-center space-y-4 pt-4 pb-12">
           <div className="h-px w-20 bg-slate-200 mx-auto opacity-50" />
           <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em] leading-relaxed max-w-[200px] mx-auto">
             링크유 Link-U <br /> Safe Secure Technology
           </p>
        </motion.section>
      </motion.div>

      {/* Floating Bottom Nav: 소유자는 대시보드 연동 · 공개 방문자는 랜딩/연락 중심 (S3) */}
      {treatAsPublicVisitor ? (
      <motion.nav
         animate={{
           scale: isPublicNavCondensed ? navTuning.scale : publicNavScale.get(),
           opacity: isPublicNavCondensed ? navTuning.opacity : publicNavOpacity.get(),
           y: isPublicNavCondensed ? navTuning.y : 0,
         }}
         transition={{ duration: 0.2, ease: "easeOut" }}
         className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-20 glass-dark rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 flex items-center justify-around px-6 border border-white/20"
      >
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
         <Link
            href={tagId ? "#finder-location-share" : "#"}
            title={tagId ? "위치 공유로 이동" : "태그 스캔 진입에서만 위치 공유 가능"}
            aria-disabled={!tagId}
            className={cn("flex flex-col items-center gap-1 group", !tagId ? "opacity-40 pointer-events-none" : "")}
         >
            <div
              className={cn(
                "p-2.5 rounded-2xl transition-all active:scale-90",
                locationShareStatus === "success"
                  ? "text-teal-400"
                  : "text-slate-400 group-hover:text-white"
              )}
            >
               <MapPin className="w-6 h-6" />
            </div>
            <span
              className={cn(
                "text-[8px] font-black text-center leading-tight max-w-[4.5rem]",
                locationShareStatus === "success"
                  ? "text-teal-300"
                  : "text-slate-400 group-hover:text-white"
              )}
            >
              {locationShareStatus === "loading"
                ? "전송 중"
                : locationShareStatus === "success"
                  ? "전달 완료"
                  : "위치 공유"}
            </span>
         </Link>
      </motion.nav>
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
         <Link
            href={isOwner && !writeLocked ? `/dashboard/pets/${pet.id}/edit${kindQs}` : `/dashboard${kindQs}`}
            className={cn("flex flex-col items-center gap-1 group", isOwner && writeLocked ? "opacity-50" : "")}
            aria-disabled={isOwner && writeLocked}
            title={isOwner && writeLocked ? "중지된 조직에서는 수정이 잠겨 있습니다." : undefined}
         >
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
