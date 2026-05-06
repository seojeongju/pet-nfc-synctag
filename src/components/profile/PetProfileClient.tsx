"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Phone, MessageCircle, AlertTriangle, Heart, Share2,
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
import { useRef, useState, useEffect, useLayoutEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { subjectKindMeta, subjectKindNfcPublic, type SubjectKind } from "@/lib/subject-kind";
import {
  maskNameForPublicViewer,
  maskBreedFieldForPublic,
  nfcPublicFinderIntro,
  nfcPublicEmergencyBadge,
} from "@/lib/nfc-public-display";
import { verifyOwnerAndLoadPetTags } from "@/app/actions/tag";
import { logFinderAction } from "@/app/actions/scan";
import { cn } from "@/lib/utils";
import { usePwaInstall } from "@/components/pwa-install-context";

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
    /** 0 | null = 안전, 1 = 실종 신고 중 */
    is_lost?: number | null;
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
  const { isStandalone } = usePwaInstall();

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
  const qs = new URLSearchParams({ kind: subjectKind });
  if (tenantId) qs.set("tenant", tenantId);
  const kindQs = `?${qs.toString()}`;
  const HeroIcon = heroIcons[subjectKind];
  const displayName = maskNameForPublicViewer(pet.name, subjectKind, treatAsPublicVisitor);
  const finderCopy =
    subjectKind === "pet"
      ? "아이를 보셨다면, 아래 연락처로 가족에게 알려 주세요. 전화·문자 모두 괜찮아요."
      : "아래 연락처로 가족(담당자)에게 바로 알려 주세요.";
  const finderParagraph = treatAsPublicVisitor ? nfcPublicFinderIntro[subjectKind] : finderCopy;
  /** 홈 인디케이터 등으로 좌우 safe-area가 다르면 콘텐츠가 한쪽으로 치우쳐 보일 수 있어, 양쪽에 동일한 값을 씀 */
  const publicPagePadX =
    "px-[max(1.5rem,env(safe-area-inset-left,0px),env(safe-area-inset-right,0px))]";
  /** 하단 떠 있는 내비: 좌우 대칭 + (Android WebView에서 flex justify-center + transform 조합 시 흔한 오프셋 방지) */
  const floatNavPadX =
    "px-[max(1rem,env(safe-area-inset-left,0px),env(safe-area-inset-right,0px))]";
  const floatNavShell =
    "fixed bottom-0 left-0 right-0 z-[100] box-border pointer-events-none pb-[max(1rem,env(safe-area-inset-bottom,0px))]";

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
  const logFinderClick = (action: "call_click" | "sms_click") => {
    if (!treatAsPublicVisitor) return;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
    void logFinderAction({
      action,
      tagId,
      petId: pet.id,
      userAgent: ua,
    });
  };

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
    <>
    <div
      ref={containerRef}
      className={cn(
        "min-h-screen w-full bg-[#FDFCFB] font-outfit overflow-x-hidden relative flex flex-col items-center",
        treatAsPublicVisitor ? "pb-44" : "pb-32"
      )}
    >
      {/* Immersive Hero Header */}
      <div className="relative h-[60vh] w-full min-w-0 self-stretch overflow-hidden">
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
          <Link href={treatAsPublicVisitor ? "/" : `/dashboard/${subjectKind}${kindQs}`}>
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

      {/* 실종 모드 활성화 시 긴급 배너 */}
      {Boolean(pet.is_lost) && (
        <div
          className={cn(
            "w-full max-w-md min-w-0 -mt-2 mb-3 relative z-20",
            publicPagePadX
          )}
        >
          <div className="flex items-center gap-3 rounded-2xl bg-rose-500 px-4 py-3 shadow-xl shadow-rose-500/30 animate-in slide-in-from-top-2 duration-300">
            <AlertTriangle className="w-5 h-5 text-white shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white">🚨 현재 실종 신고 중입니다</p>
              <p className="text-[10px] text-white/80 font-bold">
                이동 경로나 발견 정보가 있으시면 아래 연락처로 바로 연락해 주세요.
              </p>
            </div>
          </div>
        </div>
      )}
      {nfcOwnerGate && !ownerUnlocked && (
        <div
          className={cn(
            "w-full max-w-md min-w-0 -mt-1 mb-3 relative z-20",
            publicPagePadX
          )}
        >
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 space-y-2">
            <p className="text-[11px] font-bold text-amber-900 leading-snug">
              이 휴대폰은 가족(보호자) 계정으로 로그인되어 있어요. 남이 보지 않도록, 본인 확인 후에만 아래에서 관리 화면이 열립니다.
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
                "가족(보호자) 화면 열기"
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
        className={cn(
          "w-full max-w-md min-w-0 box-border -mt-4 relative z-20 space-y-8",
          publicPagePadX
        )}
      >
        {/* Core Info & Alert Widget */}
        <motion.section variants={itemVariants} className="w-full min-w-0">
          <Card className="w-full min-w-0 border-none shadow-app rounded-[40px] overflow-hidden bg-white/80 backdrop-blur-md">
            <CardContent className="p-6 sm:p-8 space-y-6 max-w-full">
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
                      {treatAsPublicVisitor ? nfc.roleLine : "디지털 신원 확인"}
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
                 {treatAsPublicVisitor 
                   ? "가족이 남긴 긴급 연락처와 안내입니다. 아래 순서대로 도와주시면 큰 힘이 됩니다."
                   : finderParagraph}
              </p>

              {treatAsPublicVisitor ? (
                <div className="mx-auto w-full max-w-[11.5rem] sm:max-w-[12.5rem]">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex flex-col items-center p-2 rounded-2xl bg-teal-50 border border-teal-100/50 shadow-sm">
                      <div className="w-5 h-5 rounded-lg bg-teal-500 flex items-center justify-center text-white mb-1 shadow-md shadow-teal-500/20">
                        <Phone className="h-2.5 w-2.5" />
                      </div>
                      <span className="text-[8px] font-black text-teal-600/70 mb-0.5 tracking-tighter">STEP 1</span>
                      <span className="text-[10px] font-black text-teal-900 leading-tight text-center">가족에게 연락</span>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                      <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center text-slate-400 mb-1 shadow-sm">
                        <MapPin className="h-2.5 w-2.5" />
                      </div>
                      <span className="text-[8px] font-black text-slate-400 mb-0.5 tracking-tighter">STEP 2</span>
                      <span className="text-[10px] font-black text-slate-600 leading-tight text-center">위치 보내기</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="mt-2 focus-within:ring-0">
                 {pet.emergency_contact ? (
                 <div className="grid grid-cols-1 gap-3">
                    <a
                      href={`tel:${pet.emergency_contact}`}
                      className="group block w-full min-w-0"
                      onClick={() => logFinderClick("call_click")}
                    >
                       <Button className="flex h-24 w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-[28px] border-b-4 border-teal-700 bg-teal-500 px-3 text-white shadow-xl shadow-teal-500/20 transition-all hover:bg-teal-600 active:scale-[0.97] sm:h-28">
                          <Phone className="h-7 w-7 sm:h-8 sm:w-8 animate-pulse" />
                          <span className="text-sm font-black leading-tight sm:text-[15px]">
                            {treatAsPublicVisitor ? nfc.callCta : "보호자 전화"}
                          </span>
                       </Button>
                    </a>
                    <a
                      href={`sms:${pet.emergency_contact}`}
                      className="group block w-full min-w-0"
                      onClick={() => logFinderClick("sms_click")}
                    >
                      <Button
                        className="flex h-24 w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-[28px] border-b-4 border-slate-300 bg-slate-100 px-3 text-slate-700 shadow-lg transition-all hover:bg-slate-200 active:scale-[0.97] sm:h-28"
                      >
                         <MessageCircle className="h-7 w-7 text-teal-600 sm:h-8 sm:w-8" />
                         <span className="text-sm font-black leading-tight sm:text-[15px]">
                           {treatAsPublicVisitor ? "문자로 알리기" : "보호자 문자"}
                         </span>
                      </Button>
                    </a>
                    {/* 위치 보내기: 문자알리기 바로 아래 배치 */}
                    <div id="finder-location-share">
                      <LocationShare
                        tagId={tagId}
                        petId={pet.id}
                        enabled={treatAsPublicVisitor}
                        onStatusChange={setLocationShareStatus}
                      />
                    </div>
                 </div>
                 ) : (
                    <div className="grid grid-cols-1 gap-3">
                      <Button disabled className="w-full h-16 rounded-[28px] text-slate-400 font-bold">
                        등록된 연락처가 없습니다
                      </Button>
                      <div id="finder-location-share">
                        <LocationShare
                          tagId={tagId}
                          petId={pet.id}
                          enabled={treatAsPublicVisitor}
                          onStatusChange={setLocationShareStatus}
                        />
                      </div>
                    </div>
                 )}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Detailed info: 건강 정보 및 메모 */}
        <motion.section variants={itemVariants}>
           <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-8 space-y-6">
                 {/* 소유자에게만 탭 메뉴 표시 (기록/갤러리 등 추가 기능용) */}
                 {!treatAsPublicVisitor && (
                   <div className="flex gap-1 p-2 bg-slate-50 -mt-2 mb-4 rounded-2xl">
                      <button type="button" className="flex-1 py-3 text-[10px] font-black bg-white rounded-xl shadow-sm text-teal-600 uppercase tracking-wider transition-all">건강 정보</button>
                      <button type="button" className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider">활동 기록</button>
                      <button type="button" className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-wider">갤러리</button>
                   </div>
                 )}

                 <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-teal-500" />
                       {treatAsPublicVisitor ? "보호자가 남긴 상세 안내" : (
                         subjectKind === "pet" ? "의료 기록 및 특이사항" : "상세 메모 및 특이사항"
                       )}
                    </h4>
                    <div className="p-5 rounded-[24px] bg-slate-50 border border-slate-100 italic">
                       <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                         {pet.medical_info ? (
                           <>
                             &quot;{pet.medical_info}&quot;
                           </>
                         ) : (
                           <span className="text-slate-400">등록된 안내 사항이 없습니다.</span>
                         )}
                       </p>
                    </div>
                    {treatAsPublicVisitor && pet.medical_info && (
                      <p className="text-[10px] font-bold text-slate-400 px-2 leading-relaxed">
                        * 발견 시 아이의 상태나 복용약 정보를 꼭 확인해 주세요.
                      </p>
                    )}
                 </div>
              </CardContent>
           </Card>
        </motion.section>

        {/* Owner Exclusive Section */}
        {isOwner && (!nfcOwnerGate || ownerUnlocked) && (
          <motion.section variants={itemVariants}>
             <div className="px-2">
                {writeLocked ? (
                  <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
                    현재 모드에서는 수정/태그 관리 기능이 잠겨 있습니다. 조회만 가능합니다.
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
             링크유 Link-U <br /> 안전 보안 기술
           </p>
        </motion.section>
      </motion.div>
    </div>

      {/* Floating Bottom Nav: body에 포털(조상에 fixed 끼는 WebView/overflow 이슈 회피) · S3 */}
      {floatNavHostReady
        ? createPortal(
            treatAsPublicVisitor ? (
      <div className={cn(floatNavShell, floatNavPadX)}>
        <div className="mx-auto w-full min-w-0 max-w-sm">
      <motion.nav
         animate={{
           y: isPublicNavCondensed ? navTuning.y : 0,
           opacity: isPublicNavCondensed ? navTuning.opacity : 1,
         }}
         transition={{ duration: 0.2, ease: "easeOut" }}
         className="pointer-events-auto w-full min-w-0 glass-dark rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20"
      >
         {/** scale 제거: WebView에서 transform+가로 정렬이 어긋나는 사례 방지 */}
         <div className="grid grid-cols-3 w-full min-h-[5rem] items-end gap-0 px-2 sm:px-3 pb-2.5 pt-1">
         <div className="flex justify-center min-w-0">
         <Link href="/" className="flex flex-col items-center gap-0.5 group w-full max-w-[5rem]">
            <div className="p-2 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <Home className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white tracking-widest">홈</span>
         </Link>
         </div>
         <div className="flex flex-col items-center justify-end min-w-0 pb-0.5">
         {pet.emergency_contact ? (
         <a href={`tel:${pet.emergency_contact}`} onClick={() => logFinderClick("call_click")} className="flex flex-col items-center gap-0.5 group -mb-0.5">
            <div className="p-3 rounded-full bg-teal-500 text-white shadow-xl shadow-teal-500/40 border-2 border-slate-900/80 ring-2 ring-white/20">
               <Phone className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-teal-400 tracking-widest">전화</span>
         </a>
         ) : (
         <div className="flex flex-col items-center gap-0.5 opacity-40">
            <div className="p-3 rounded-full bg-slate-600 text-white border-2 border-slate-900/80">
               <Phone className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-500 tracking-widest">—</span>
         </div>
         )}
         </div>
         <div className="flex justify-center min-w-0">
         <Link
            href={tagId ? "#finder-location-share" : "#"}
            title={tagId ? "아래의 위치 보내기로 이동" : "인식표로 이 화면에 온 경우에만 위치를 보낼 수 있어요"}
            aria-disabled={!tagId}
            className={cn("flex flex-col items-center gap-0.5 group w-full max-w-[5rem]", !tagId ? "opacity-40 pointer-events-none" : "")}
         >
            <div
              className={cn(
                "p-2 rounded-2xl transition-all active:scale-90",
                locationShareStatus === "success"
                  ? "text-teal-400"
                  : "text-slate-400 group-hover:text-white"
              )}
            >
               <MapPin className="w-6 h-6" />
            </div>
            <span
              className={cn(
                "text-[8px] font-black text-center leading-tight px-0.5",
                locationShareStatus === "success"
                  ? "text-teal-300"
                  : "text-slate-400 group-hover:text-white"
              )}
            >
              {locationShareStatus === "loading"
                ? "보내는 중"
                : locationShareStatus === "success"
                  ? "보냄"
                  : "위치 보내기"}
            </span>
         </Link>
         </div>
         </div>
      </motion.nav>
        </div>
      </div>
      ) : (
      <div className={cn(floatNavShell, floatNavPadX)}>
        <div className="mx-auto w-full min-w-0 max-w-sm">
      <nav className="pointer-events-auto w-full min-w-0 min-h-20 glass-dark rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-around px-2 sm:px-3 border border-white/20">
          <Link href={`/dashboard/${subjectKind}${kindQs}`} className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <Home className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">홈</span>
         </Link>
         <Link href={`/dashboard/${subjectKind}/pets${kindQs}`} className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <PawPrint className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">내 목록</span>
         </Link>
         <div className="flex flex-col items-center gap-1">
            <div className="p-3.5 -mt-10 rounded-full bg-teal-500 text-white shadow-xl shadow-teal-500/40 border-4 border-slate-950 transition-all active:scale-90">
               <Share2 className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest mt-1">공유</span>
         </div>
         <Link href={`/dashboard/${subjectKind}/scans${kindQs}`} className="flex flex-col items-center gap-1 group">
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <Activity className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">활동</span>
         </Link>
         <Link
            href={isOwner && !writeLocked ? `/dashboard/${subjectKind}/pets/${pet.id}/edit${kindQs}` : `/dashboard/${subjectKind}${kindQs}`}
            className={cn("flex flex-col items-center gap-1 group", isOwner && writeLocked ? "opacity-50" : "")}
            aria-disabled={isOwner && writeLocked}
            title={isOwner && writeLocked ? "현재 모드에서는 수정 기능이 잠겨 있습니다." : undefined}
         >
            <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-white transition-all active:scale-90">
               <Settings className="w-6 h-6" />
            </div>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">수정</span>
         </Link>
      </nav>
        </div>
      </div>
            ),
            document.body
          )
        : null}
      {/* FinderTagConsentFlow removed - LocationShare handles its own consent */}
    </>
  );
}
