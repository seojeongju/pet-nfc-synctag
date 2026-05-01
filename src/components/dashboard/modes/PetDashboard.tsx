"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Plus, MapPin, PawPrint, Search, Bell,
  ShieldCheck, Activity, CheckCircle, AlertCircle,
  AlertTriangle, Link2, ScanLine, Siren, X,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { subjectKindMeta } from "@/lib/subject-kind";
import ModeAnnouncementsBanner from "@/components/dashboard/ModeAnnouncementsBanner";
import type { ModeAnnouncementRow } from "@/types/mode-announcement";
import type { TenantPlanUsageSummary } from "@/lib/tenant-quota";
import { getLatestLocations } from "@/app/actions/pet";
import LiveLocationMap from "@/components/dashboard/LiveLocationMap";
import { type SubjectKind } from "@/lib/subject-kind";
import SafePetImage from "@/components/pet/SafePetImage";
import { DashboardNfcQuickRegisterCard } from "@/components/dashboard/DashboardNfcQuickRegisterCard";

interface SubjectWithLocation {
  id: string;
  name: string;
  breed?: string | null;
  photo_url?: string | null;
  is_lost?: number | null;
  location: {
    lat: number;
    lng: number;
    timestamp: string;
    type: string;
  } | null;
}

interface PetDashboardProps {
  session: { user: { name?: string | null; image?: string | null } };
  pets: Array<{
    id: string;
    name: string;
    breed?: string | null;
    photo_url?: string | null;
    is_lost?: number | null;
    subject_kind?: SubjectKind;
  }>;
  isAdmin: boolean;
  modeAnnouncements: ModeAnnouncementRow[];
  tenantId?: string | null;
  tenantUsage?: TenantPlanUsageSummary | null;
  tenantSuspended?: boolean;
  modeFeatureEnabled?: boolean;
  linkedTagCount?: number;
  /** 해당 테넌트(또는 개인) 범위 스캔 로그 1건 이상이면 테스트 스캔 완료 */
  petScanLogCount?: number;
}

function limitText(used: number, limit: number | null): string {
  return `${used}/${limit == null ? "∞" : limit}`;
}

const STALE_ACTION_RELOAD_KEY = "pet-dashboard-stale-action-reload-once";
const NFC_BANNER_DISMISS_KEY = "pet-dashboard-nfc-banner-dismissed";

export default function PetDashboard({
  session,
  pets,
  isAdmin,
  modeAnnouncements,
  tenantId,
  tenantUsage,
  tenantSuspended = false,
  modeFeatureEnabled = true,
  linkedTagCount = 0,
  petScanLogCount = 0
}: PetDashboardProps) {
  const [nfcSelectedSubjectId, setNfcSelectedSubjectId] = useState("");
  const [subjectsWithLocation, setSubjectsWithLocation] = useState<SubjectWithLocation[]>([]);
  const [isMapRefreshing, setIsMapRefreshing] = useState(false);
  const [tagLinkedInSession, setTagLinkedInSession] = useState(false);
  const [nfcBannerDismissed, setNfcBannerDismissed] = useState(false);
  const [mapStaleMessage, setMapStaleMessage] = useState<string | null>(null);
  const router = useRouter();

  const subjectKind = "pet";
  const meta = subjectKindMeta[subjectKind];
  const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
  const kindQs = tenantQs;
  /** 원탁 가이드·태그 연결 바로가기용 (자녀 컴포넌트 [DashboardNfcQuickRegisterCard]가 선택 id를 올려줌) → NFC 읽기 화면 */
  const nfcOnboardingHref = (() => {
    const p = new URLSearchParams();
    if (tenantId) p.set("tenant", tenantId);
    const pid = nfcSelectedSubjectId || (pets.length === 1 ? pets[0]?.id : "") || "";
    if (pid) p.set("pet", pid);
    const qs = p.toString();
    return `/dashboard/${subjectKind}/nfc${qs ? `?${qs}` : ""}`;
  })();
  const AvatarIcon = PawPrint;

  const isStaleServerActionError = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message : String(error ?? "");
    const lower = message.toLowerCase();
    return lower.includes("server action") && lower.includes("was not found on the server");
  };

  const reloadOnceForStaleAction = (): boolean => {
    if (typeof window === "undefined") return false;
    try {
      if (window.sessionStorage.getItem(STALE_ACTION_RELOAD_KEY) === "1") {
        return false;
      }
      window.sessionStorage.setItem(STALE_ACTION_RELOAD_KEY, "1");
      window.location.reload();
      return true;
    } catch {
      return false;
    }
  };

  const refreshLocations = useCallback(async () => {
    setIsMapRefreshing(true);
    setMapStaleMessage(null);
    try {
      const data = await getLatestLocations(subjectKind as SubjectKind, tenantId);
      setSubjectsWithLocation(data);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(STALE_ACTION_RELOAD_KEY);
      }
    } catch (err) {
      if (isStaleServerActionError(err)) {
        const reloaded = reloadOnceForStaleAction();
        if (!reloaded) {
          setMapStaleMessage("앱이 최신 버전으로 갱신되어야 합니다. 화면을 새로고침한 뒤 다시 시도해 주세요.");
        }
      } else {
        console.error("Map data refresh failed:", err);
      }
    } finally {
      setIsMapRefreshing(false);
    }
  }, [subjectKind, tenantId]);

  useEffect(() => {
    refreshLocations();
    const interval = setInterval(refreshLocations, 30000);
    return () => clearInterval(interval);
  }, [refreshLocations]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(NFC_BANNER_DISMISS_KEY) === "1") {
        setNfcBannerDismissed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
  };
  const lostCount = pets.filter((p) => p.is_lost).length;
  const hasLinkedTag = linkedTagCount > 0 || tagLinkedInSession;
  const hasTestScanConfirmed = petScanLogCount > 0;

  const dismissNfcBanner = () => {
    try {
      sessionStorage.setItem(NFC_BANNER_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setNfcBannerDismissed(true);
  };

  const writeLocked = tenantSuspended || !modeFeatureEnabled;
  const showNfcSetupBanner =
    !writeLocked &&
    pets.length > 0 &&
    linkedTagCount === 0 &&
    !tagLinkedInSession &&
    !nfcBannerDismissed;
  const onboardingSteps = [
    {
      id: "pet",
      title: "반려동물 등록",
      done: pets.length > 0,
      href: `/dashboard/${subjectKind}/pets/new${kindQs}`,
      cta: "등록하기",
    },
    {
      id: "tag",
      title: "NFC 태그 연결",
      done: hasLinkedTag,
      href: nfcOnboardingHref,
      cta: "바로 연결",
    },
    {
      id: "scan",
      title: "테스트 스캔 확인",
      done: hasTestScanConfirmed,
      href: `/dashboard/${subjectKind}/scans${kindQs}`,
      cta: "스캔 보기",
    },
  ] as const;
  const onboardingDoneCount = onboardingSteps.filter((step) => step.done).length;

  return (
    <div className="relative min-h-0 w-full min-w-0 overflow-x-hidden bg-[#F8FAFC] pb-6 font-outfit">
      <div className="pointer-events-none absolute left-0 top-0 h-[300px] w-full bg-gradient-to-b from-teal-500/10 to-transparent" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto w-full min-w-0 max-w-lg space-y-8 px-4 pt-6 sm:px-5 sm:pt-8"
      >
        <div id="mode-announcements" className="scroll-mt-28">
          <ModeAnnouncementsBanner items={modeAnnouncements} />
        </div>

        {showNfcSetupBanner && (
          <motion.section variants={itemVariants}>
            <div className="relative overflow-hidden rounded-[28px] border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-white p-4 shadow-app">
              <button
                type="button"
                onClick={dismissNfcBanner}
                className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="배너 닫기"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="pr-8">
                <p className="text-[10px] font-black uppercase tracking-wider text-teal-600">
                  최초 1회 · NFC 태그 연결
                </p>
                <p className="mt-1 text-sm font-black leading-snug text-slate-900">
                  발견 시 공개 프로필로 연결하려면 태그를 한 번만 연결해 주세요.
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  아래 NFC 빠른 등록으로 스캔하거나 UID를 입력하면 됩니다. 별도 주소 입력은 필요 없어요.
                </p>
                <button
                  type="button"
                  onClick={() => router.push(nfcOnboardingHref)}
                  className="mt-4 inline-flex items-center justify-center rounded-2xl bg-teal-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-teal-500/25 transition hover:bg-teal-600 active:scale-[0.98]"
                >
                  NFC 연결하기
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {isAdmin && (
          <motion.section variants={itemVariants}>
            <div className="glass-dark rounded-[32px] p-5 text-white flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs">관리자 모드 🛡️</h4>
                  <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest leading-none">Access Console</p>
                </div>
              </div>
              <a
                href="/admin"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "inline-flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white font-black rounded-xl text-[10px] h-8 px-4 transition-all active:scale-90"
                )}
              >
                관리센터 이동
              </a>
            </div>
          </motion.section>
        )}

        <motion.section variants={itemVariants} className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-black text-teal-700">
                반려동물 모드
              </span>
              <a href="/hub" className="text-[10px] font-black text-slate-400 hover:text-teal-600 uppercase tracking-widest">
                모드 변경
              </a>
            </div>
            {tenantId && (
              <div className="inline-flex flex-col gap-1 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2">
                <p className="text-[10px] font-black text-teal-700">{tenantUsage?.tenantName ?? "조직"}</p>
                {tenantUsage ? (
                  <p className="text-[10px] font-bold text-teal-800">
                    {tenantUsage.planName} · 펫 {limitText(tenantUsage.petUsed, tenantUsage.petLimit)} · 태그 {limitText(tenantUsage.tagUsed, tenantUsage.tagLimit)}
                  </p>
                ) : (
                  <p className="text-[10px] font-bold text-amber-600">활성 조직 플랜 없음</p>
                )}
              </div>
            )}
            {writeLocked ? (
              <div className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700">
                현재 모드는 조회만 가능합니다. 쓰기 기능이 잠겨 있습니다.
              </div>
            ) : null}
            <div className="flex items-center gap-1.5 text-teal-600 font-bold text-[11px] uppercase tracking-wider">
               <MapPin className="w-3.5 h-3.5" />
               SEOUL, KOREA
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
               안녕하세요, <br />
               <span className="text-teal-500">{session.user.name || "보호자"}</span>님! 👋
            </h1>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-teal-200 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
            <div className="w-14 h-14 rounded-full border-4 border-white shadow-xl overflow-hidden relative z-10 bg-white">
               {session.user.image ? (
                 <Image src={session.user.image.replace("http://", "https://")} alt="" width={56} height={56} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-500"><AvatarIcon className="w-6 h-6" /></div>
               )}
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="반려동물 이름을 찾아보세요..."
            className="w-full h-16 glass rounded-[24px] pl-14 pr-5 text-sm font-bold shadow-app shadow-app-hover outline-none transition-all focus:ring-2 focus:ring-teal-500/20"
          />
        </motion.section>

        <motion.section variants={itemVariants}>
          <Card className="border-none rounded-[40px] bg-slate-900 text-white overflow-hidden relative shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)]">
            <div className="absolute inset-0 z-0">
              <Image
                src={meta.dashboardBgImage}
                alt=""
                fill
                className="object-cover opacity-60"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-transparent" />
            </div>

            <div className="p-8 space-y-5 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                   <span className="text-[10px] font-black tracking-widest text-teal-400 uppercase">실시간 안심</span>
                </div>
                <h2 className="text-xl font-black leading-[1.2]">반려동물 동행</h2>
              </div>
              <p className="text-white/80 text-[11px] font-bold leading-relaxed max-w-[70%] drop-shadow-md">
                 NFC로 빠르게 연결하고, BLE·안심 구역은 단계적으로 더해집니다.
              </p>
              <a
                href={`/dashboard/${subjectKind}/scans${tenantQs}`}
                className={cn(
                  buttonVariants({}),
                  "rounded-2xl font-black bg-teal-500 text-white hover:bg-teal-600 px-6 h-11 text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center transition-all active:scale-95"
                )}
              >
                상세 리포트 보기
              </a>
            </div>
          </Card>
        </motion.section>

        <motion.section variants={itemVariants}>
          <Card className="rounded-[32px] border-none shadow-app bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">원탭 시작 가이드</h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    등록 → 태그 연결 → 스캔 확인까지 3단계로 빠르게 시작하세요.
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black text-teal-700">
                  {onboardingDoneCount}/3 완료
                </span>
              </div>
              <div className="space-y-2">
                {onboardingSteps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      {step.done ? (
                        <CheckCircle className="h-4 w-4 text-teal-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-slate-400" />
                      )}
                      <span className={`text-xs font-black ${step.done ? "text-teal-700" : "text-slate-700"}`}>
                        {step.title}
                      </span>
                    </div>
                    <a
                      href={step.href}
                      className="text-[11px] font-black text-teal-600 underline underline-offset-2"
                    >
                      {step.cta}
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={nfcOnboardingHref}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm"
            >
              <Link2 className="mx-auto h-4 w-4 text-teal-600" />
              <p className="mt-1 text-[10px] font-black text-slate-700">태그 연결</p>
            </a>
            <a
              href={`/dashboard/${subjectKind}/scans${kindQs}`}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm"
            >
              <ScanLine className="mx-auto h-4 w-4 text-indigo-600" />
              <p className="mt-1 text-[10px] font-black text-slate-700">스캔 히스토리</p>
            </a>
            <a
              href={`/dashboard/${subjectKind}/pets${kindQs}`}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm"
            >
              <Siren className="mx-auto h-4 w-4 text-rose-600" />
              <p className="mt-1 text-[10px] font-black text-slate-700">분실모드 관리</p>
            </a>
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <DashboardNfcQuickRegisterCard
            subjectKind={subjectKind}
            subjects={pets}
            tenantId={tenantId}
            tenantSuspended={writeLocked}
            linkedTagCount={linkedTagCount}
            emptyRegisterHint={meta.emptyRegisterHint}
            subtitle="태그를 스캔하거나 UID를 입력해 연결하고, 태그 주소 기록까지 한 번에 진행해요."
            onSelectedSubjectIdChange={setNfcSelectedSubjectId}
            onTagLinkSessionSuccess={() => setTagLinkedInSession(true)}
          />
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-2">
          {mapStaleMessage ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
              {mapStaleMessage}
            </p>
          ) : null}
          <LiveLocationMap
            subjects={subjectsWithLocation}
            subjectKind={subjectKind}
            onRefresh={refreshLocations}
            isRefreshing={isMapRefreshing}
          />
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900">함께하는 아이들</h3>
              <a href={`/dashboard/${subjectKind}/pets${kindQs}`} className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline transition-all">View All</a>
           </div>

           {pets.some((p) => p.is_lost) && (
             <div className="flex items-start gap-3 rounded-[20px] bg-rose-500 px-4 py-3 shadow-lg shadow-rose-300/30">
               <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5 animate-pulse" />
               <div className="flex-1 min-w-0">
                 <p className="text-xs font-black text-white">🚨 실종 신고 중인 아이가 있어요</p>
                 <p className="text-[10px] text-white/80 font-bold mt-0.5">
                   {pets.filter((p) => p.is_lost).map((p) => p.name).join(", ")} — 공개 프로필에 긴급 배너가 표시 중입니다.
                 </p>
               </div>
             </div>
           )}

           <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide -mx-5 px-5">
              {pets.map((pet) => (
                <motion.div
                  key={pet.id}
                  whileTap={{ scale: 0.95 }}
                  className="min-w-[150px]"
                >
                  <a href={`/profile/${pet.id}${kindQs}`}>
                    <Card className="rounded-[32px] border-none shadow-app shadow-app-hover overflow-hidden bg-white text-center p-0">
                       <div className="h-28 bg-slate-100 relative overflow-hidden">
                          <SafePetImage
                            src={pet.photo_url}
                            alt={pet.name}
                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                            fallbackClassName="h-full w-full flex items-center justify-center bg-slate-100 text-slate-300"
                            iconClassName="h-12 w-12"
                          />
                       </div>
                       <CardContent className="p-4 space-y-0.5">
                          <h4 className="font-black text-slate-800 text-sm">{pet.name}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{pet.breed || "UNKNOWN"}</p>
                       </CardContent>
                    </Card>
                  </a>
                </motion.div>
              ))}

              <motion.div whileTap={{ scale: writeLocked ? 1 : 0.95 }}>
                <a
                  href={writeLocked ? "#" : `/dashboard/${subjectKind}/pets/new${kindQs}`}
                  aria-disabled={writeLocked}
                  className={writeLocked ? "pointer-events-none opacity-50" : ""}
                >
                   <div className="min-w-[150px] h-full min-h-[176px] rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-teal-50/50 hover:border-teal-500 transition-all group">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-500 group-hover:text-white transition-all shadow-sm">
                         <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-teal-500 uppercase tracking-wider">추가</span>
                   </div>
                </a>
              </motion.div>
           </div>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900">최근 보호 활동</h3>
              <Activity className="w-5 h-5 text-slate-300" />
           </div>

          <Card className="rounded-[32px] border-none shadow-app p-6 bg-white relative overflow-hidden group hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4 relative z-10">
                 <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-sm ${
                   lostCount > 0 ? "bg-rose-50 text-rose-500 shadow-rose-100" : "bg-teal-50 text-teal-600 shadow-teal-100"
                 }`}>
                    {lostCount > 0 ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <Bell className="w-6 h-6" />}
                 </div>
                 <div className="space-y-0.5">
                    <h4 className="font-black text-slate-800 text-sm">
                      {lostCount > 0 ? `주의가 필요한 아이 ${lostCount}명` : "최근 보호 활동 요약"}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                      {lostCount > 0
                        ? "분실모드 상태와 공개 프로필 긴급 연락 정보를 다시 확인해 주세요."
                        : "스캔 히스토리와 위치 이력을 주기적으로 확인하면 더 안심할 수 있어요."}
                    </p>
                 </div>
              </div>
              <div className="relative z-10 mt-4 flex gap-2">
                <a
                  href={`/dashboard/${subjectKind}/scans${kindQs}`}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black text-white hover:bg-teal-600"
                >
                  스캔 기록 보기
                </a>
                <a
                  href={`/dashboard/${subjectKind}/pets${kindQs}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-700 hover:bg-slate-50"
                >
                  분실모드/프로필 관리
                </a>
              </div>
              <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-slate-50 rounded-full group-hover:bg-teal-50 transition-colors" />
           </Card>
        </motion.section>
      </motion.div>
    </div>
  );
}
