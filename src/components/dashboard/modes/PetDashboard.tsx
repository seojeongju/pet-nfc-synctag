"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Plus, MapPin, PawPrint, Search, Bell,
  ShieldCheck, Activity, Smartphone, CheckCircle, AlertCircle,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { linkTag } from "@/app/actions/tag";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { subjectKindMeta } from "@/lib/subject-kind";
import ModeAnnouncementsBanner from "@/components/dashboard/ModeAnnouncementsBanner";
import type { ModeAnnouncementRow } from "@/types/mode-announcement";
import type { TenantPlanUsageSummary } from "@/lib/tenant-quota";

interface PetDashboardProps {
  session: { user: { name?: string | null; image?: string | null } };
  pets: Array<{ id: string; name: string; breed?: string | null; photo_url?: string | null; is_lost?: number | null }>;
  isAdmin: boolean;
  modeAnnouncements: ModeAnnouncementRow[];
  tenantId?: string | null;
  tenantUsage?: TenantPlanUsageSummary | null;
  tenantSuspended?: boolean;
}

function limitText(used: number, limit: number | null): string {
  return `${used}/${limit == null ? "∞" : limit}`;
}

export default function PetDashboard({
  session,
  pets,
  isAdmin,
  modeAnnouncements,
  tenantId,
  tenantUsage,
  tenantSuspended = false
}: PetDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPetId, setSelectedPetId] = useState("");
  const [tagId, setTagId] = useState("");
  const [tagMessage, setTagMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  
  const subjectKind = "pet";
  const meta = subjectKindMeta[subjectKind];
  const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
  const kindQs = tenantQs;
  const AvatarIcon = PawPrint;

  useEffect(() => {
    if (pets.length > 0 && !selectedPetId) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  const handleQuickNfcRegister = () => {
    if (tenantSuspended) return;
    if (!selectedPetId || !tagId.trim()) return;
    setTagMessage(null);
    startTransition(async () => {
      try {
        await linkTag(selectedPetId, tagId.trim());
        setTagMessage({ type: "success", text: "NFC 태그가 반려동물에 연결되었습니다." });
        setTagId("");
        router.refresh();
      } catch (e: unknown) {
        const err = e instanceof Error ? e.message : "NFC 태그 등록에 실패했습니다.";
        setTagMessage({ type: "error", text: err });
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit pb-32 overflow-x-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto px-5 pt-8 space-y-8"
      >
        <div id="mode-announcements" className="scroll-mt-28">
          <ModeAnnouncementsBanner items={modeAnnouncements} />
        </div>

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
                <p className="text-[10px] font-black text-teal-700">조직 플랜 배지</p>
                {tenantUsage ? (
                  <p className="text-[10px] font-bold text-teal-800">
                    {tenantUsage.planName} · 펫 {limitText(tenantUsage.petUsed, tenantUsage.petLimit)} · 태그 {limitText(tenantUsage.tagUsed, tenantUsage.tagLimit)}
                  </p>
                ) : (
                  <p className="text-[10px] font-bold text-amber-600">활성 조직 플랜 없음</p>
                )}
              </div>
            )}
            {tenantSuspended ? (
              <div className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700">
                조직이 중지 상태라 쓰기 기능이 잠겨 있습니다.
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
              <Button className="rounded-2xl font-black bg-teal-500 text-white hover:bg-teal-600 px-6 h-11 text-xs shadow-lg shadow-teal-500/20">
                상세 리포트 보기
              </Button>
            </div>
          </Card>
        </motion.section>

        <motion.section variants={itemVariants}>
          <Card className="rounded-[32px] border-none shadow-app bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">NFC 빠른 등록</h3>
                  <p className="text-[11px] text-slate-400 font-bold">인식표 뒷면의 태그를 폰에 갖다 대거나 UID를 입력하세요.</p>
                </div>
              </div>

              {pets.length > 0 ? (
                <>
                  <select
                    value={selectedPetId}
                    onChange={(e) => setSelectedPetId(e.target.value)}
                    disabled={tenantSuspended}
                    className="w-full h-12 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    {pets.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} {pet.breed ? `(${pet.breed})` : ""}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <Input
                      value={tagId}
                      onChange={(e) => setTagId(e.target.value)}
                      disabled={tenantSuspended}
                      placeholder="NFC 태그 UID 입력"
                      className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                    />
                    <Button
                      onClick={handleQuickNfcRegister}
                      disabled={tenantSuspended || isPending || !selectedPetId || !tagId.trim()}
                      className="h-12 rounded-2xl bg-slate-900 hover:bg-teal-500 text-white px-5 font-black"
                    >
                      등록
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-500">먼저 반려동물을 등록해야 NFC 태그를 연결할 수 있어요.</p>
                  <a
                    href={tenantSuspended ? "#" : `/dashboard/${subjectKind}/pets/new${kindQs}`}
                    aria-disabled={tenantSuspended}
                    className={cn(
                      "text-xs font-black underline underline-offset-4",
                      tenantSuspended ? "pointer-events-none text-slate-400" : "text-teal-600"
                    )}
                  >
                    등록하러 가기
                  </a>
                </div>
              )}

              {tagMessage && (
                <div
                  className={`rounded-2xl px-4 py-3 text-xs font-bold flex items-center gap-2 ${
                    tagMessage.type === "success" ? "bg-teal-50 text-teal-600" : "bg-rose-50 text-rose-500"
                  }`}
                >
                  {tagMessage.type === "success" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{tagMessage.text}</span>
                </div>
              )}
            </CardContent>
          </Card>
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
                          {pet.photo_url ? (
                            <Image src={pet.photo_url} alt={pet.name} width={150} height={112} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><AvatarIcon className="w-12 h-12" /></div>
                          )}
                       </div>
                       <CardContent className="p-4 space-y-0.5">
                          <h4 className="font-black text-slate-800 text-sm">{pet.name}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{pet.breed || "UNKNOWN"}</p>
                       </CardContent>
                    </Card>
                  </a>
                </motion.div>
              ))}

              <motion.div whileTap={{ scale: tenantSuspended ? 1 : 0.95 }}>
                <a
                  href={tenantSuspended ? "#" : `/dashboard/pets/new${kindQs}`}
                  aria-disabled={tenantSuspended}
                  className={tenantSuspended ? "pointer-events-none opacity-50" : ""}
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
                 <div className="w-14 h-14 rounded-[20px] bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm shadow-rose-100">
                    <Bell className="w-6 h-6 animate-pulse" />
                 </div>
                 <div className="space-y-0.5">
                    <h4 className="font-black text-slate-800 text-sm">최근 스캔 내역이 없습니다</h4>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">우리 아이들의 인식표가 모두 안전한 상태입니다.</p>
                 </div>
              </div>
              <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-slate-50 rounded-full group-hover:bg-teal-50 transition-colors" />
           </Card>
        </motion.section>
      </motion.div>
    </div>
  );
}
