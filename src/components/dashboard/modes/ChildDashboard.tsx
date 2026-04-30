"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Plus, MapPin, Baby, Search, Bell,
  ShieldCheck, Activity,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { subjectKindMeta } from "@/lib/subject-kind";
import ModeAnnouncementsBanner from "@/components/dashboard/ModeAnnouncementsBanner";
import type { ModeAnnouncementRow } from "@/types/mode-announcement";
import type { TenantPlanUsageSummary } from "@/lib/tenant-quota";
import { getLatestLocations } from "@/app/actions/pet";
import LiveLocationMap from "@/components/dashboard/LiveLocationMap";
import { DashboardNfcQuickRegisterCard } from "@/components/dashboard/DashboardNfcQuickRegisterCard";
import { type SubjectKind } from "@/lib/subject-kind";

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

interface ChildDashboardProps {
  session: { user: { name?: string | null; image?: string | null } };
  subjects: Array<{
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
}

function limitText(used: number, limit: number | null): string {
  return `${used}/${limit == null ? "∞" : limit}`;
}

export default function ChildDashboard({
  session,
  subjects,
  isAdmin,
  modeAnnouncements,
  tenantId,
  tenantUsage,
  tenantSuspended = false,
  modeFeatureEnabled = true,
  linkedTagCount = 0
}: ChildDashboardProps) {
  const [subjectsWithLocation, setSubjectsWithLocation] = useState<SubjectWithLocation[]>([]);
  const [isMapRefreshing, setIsMapRefreshing] = useState(false);
  
  const subjectKind = "child";
  const meta = subjectKindMeta[subjectKind];
  const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
  const kindQs = tenantQs;
  const AvatarIcon = Baby;
  const writeLocked = tenantSuspended || !modeFeatureEnabled;

  const refreshLocations = useCallback(async () => {
    setIsMapRefreshing(true);
    try {
      const data = await getLatestLocations(subjectKind as SubjectKind, tenantId);
      setSubjectsWithLocation(data);
    } catch (err) {
      console.error("Map data refresh failed:", err);
    } finally {
      setIsMapRefreshing(false);
    }
  }, [subjectKind, tenantId]);

  useEffect(() => {
    refreshLocations();
    const interval = setInterval(refreshLocations, 30000);
    return () => clearInterval(interval);
  }, [refreshLocations]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <div className="relative min-h-0 w-full min-w-0 overflow-x-hidden bg-[#F8FAFC] pb-6 font-outfit">
      <div className="pointer-events-none absolute left-0 top-0 h-[300px] w-full bg-gradient-to-b from-sky-500/10 to-transparent" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto w-full min-w-0 max-w-lg space-y-8 px-4 pt-6 sm:px-5 sm:pt-8"
      >
        <div id="mode-announcements" className="scroll-mt-28">
          <ModeAnnouncementsBanner items={modeAnnouncements} />
        </div>

        {isAdmin && (
          <motion.section variants={itemVariants}>
            <div className="glass-dark rounded-[32px] p-5 text-white flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400">
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
                  "inline-flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl text-[10px] h-8 px-4 transition-all active:scale-90"
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
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-black text-sky-700">
                우리 아이 안심 모드
              </span>
              <a href="/hub" className="text-[10px] font-black text-slate-400 hover:text-sky-600 uppercase tracking-widest">
                모드 변경
              </a>
            </div>
            {tenantId && (
              <div className="inline-flex flex-col gap-1 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
                <p className="text-[10px] font-black text-sky-700">{tenantUsage?.tenantName}</p>
                {tenantUsage ? (
                  <p className="text-[10px] font-bold text-sky-800">
                    {tenantUsage.planName} · 관리 {limitText(tenantUsage.petUsed, tenantUsage.petLimit)} · 태그 {limitText(tenantUsage.tagUsed, tenantUsage.tagLimit)}
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
            <div className="flex items-center gap-1.5 text-sky-600 font-bold text-[11px] uppercase tracking-wider">
               <MapPin className="w-3.5 h-3.5" />
               SEOUL, KOREA
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
               안녕하세요, <br />
               <span className="text-sky-500">{session.user.name || "보호자"}</span>님! 👋
            </h1>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-sky-200 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
            <div className="w-14 h-14 rounded-full border-4 border-white shadow-xl overflow-hidden relative z-10 bg-white">
               {session.user.image ? (
                 <Image src={session.user.image.replace("http://", "https://")} alt="" width={56} height={56} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-sky-50 text-sky-500"><AvatarIcon className="w-6 h-6" /></div>
               )}
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="아이 이름을 찾아보세요..."
            className="w-full h-16 glass rounded-[24px] pl-14 pr-5 text-sm font-bold shadow-app shadow-app-hover outline-none transition-all focus:ring-2 focus:ring-sky-500/20"
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
                   <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                   <span className="text-[10px] font-black tracking-widest text-sky-400 uppercase">키즈 안심</span>
                </div>
                <h2 className="text-xl font-black leading-[1.2]">우리 아이 안심 동행</h2>
              </div>
              <p className="text-white/80 text-[11px] font-bold leading-relaxed max-w-[70%] drop-shadow-md">
                 NFC로 비상 연락처를 연결하고, 안심 구역으로 우리 아이의 위치를 확인하세요.
              </p>
              <a
                href={`/dashboard/${subjectKind}/scans${tenantQs}`}
                className={cn(
                  buttonVariants({}),
                  "rounded-2xl font-black bg-sky-500 text-white hover:bg-sky-600 px-6 h-11 text-xs shadow-lg shadow-sky-500/20 flex items-center justify-center transition-all active:scale-95"
                )}
              >
                상세 리포트 보기
              </a>
            </div>
          </Card>
        </motion.section>

        <motion.section variants={itemVariants}>
          <DashboardNfcQuickRegisterCard
            subjectKind={subjectKind}
            subjects={subjects}
            tenantId={tenantId}
            tenantSuspended={writeLocked}
            linkedTagCount={linkedTagCount}
            emptyRegisterHint={meta.emptyRegisterHint}
            subtitle="태그를 스캔하거나 UID를 입력해 연결하고, 태그 주소 기록까지 한 번에 진행해요."
          />
        </motion.section>

        <motion.section variants={itemVariants}>
           <LiveLocationMap
             subjects={subjectsWithLocation}
             subjectKind={subjectKind}
             onRefresh={refreshLocations}
             isRefreshing={isMapRefreshing}
           />
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-slate-900">우리 아이 프로필</h3>
              <a href={`/dashboard/${subjectKind}/pets${kindQs}`} className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:underline transition-all">View All</a>
           </div>

           {subjects.some((s) => s.is_lost) && (
             <div className="flex items-start gap-3 rounded-[20px] bg-rose-500 px-4 py-3 shadow-lg shadow-rose-300/30">
               <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5 animate-pulse" />
               <div className="flex-1 min-w-0">
                 <p className="text-xs font-black text-white">🚨 보호가 필요한 상황이 발생했어요</p>
                 <p className="text-[10px] text-white/80 font-bold mt-0.5">
                   {subjects.filter((s) => s.is_lost).map((s) => s.name).join(", ")} — 실종/긴급 알림이 활성화되었습니다.
                 </p>
               </div>
             </div>
           )}

           <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide -mx-5 px-5">
              {subjects.map((s) => (
                <motion.div
                  key={s.id}
                  whileTap={{ scale: 0.95 }}
                  className="min-w-[150px]"
                >
                  <a href={`/profile/${s.id}${kindQs}`}>
                    <Card className="rounded-[32px] border-none shadow-app shadow-app-hover overflow-hidden bg-white text-center p-0">
                       <div className="h-28 bg-slate-100 relative overflow-hidden">
                          {s.photo_url ? (
                            <Image src={s.photo_url} alt={s.name} width={150} height={112} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><AvatarIcon className="w-12 h-12" /></div>
                          )}
                       </div>
                       <CardContent className="p-4 space-y-0.5">
                          <h4 className="font-black text-slate-800 text-sm">{s.name}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{s.breed || "KIDS"}</p>
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
                   <div className="min-w-[150px] h-full min-h-[176px] rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-sky-50/50 hover:border-sky-500 transition-all group">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-sm">
                         <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-sky-500 uppercase tracking-wider">추가</span>
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
                 <div className="w-14 h-14 rounded-[20px] bg-sky-50 flex items-center justify-center text-sky-500 shadow-sm shadow-sky-100">
                    <Bell className="w-6 h-6 animate-pulse" />
                 </div>
                 <div className="space-y-0.5">
                    <h4 className="font-black text-slate-800 text-sm">최근 스캔 내역이 없습니다</h4>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">우리 아이들이 안전하게 보호받고 있습니다.</p>
                 </div>
              </div>
              <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-slate-50 rounded-full group-hover:bg-sky-50 transition-colors" />
           </Card>
        </motion.section>
      </motion.div>
    </div>
  );
}
