"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Plus, MapPin, PawPrint, Search, Bell,
  ShieldCheck, Activity, Smartphone, CheckCircle, AlertCircle,
  AlertTriangle, Link2, ScanLine, Siren,
} from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { linkTagSafe } from "@/app/actions/tag";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { subjectKindMeta } from "@/lib/subject-kind";
import ModeAnnouncementsBanner from "@/components/dashboard/ModeAnnouncementsBanner";
import type { ModeAnnouncementRow } from "@/types/mode-announcement";
import type { TenantPlanUsageSummary } from "@/lib/tenant-quota";
import { getLatestLocations } from "@/app/actions/pet";
import LiveLocationMap from "@/components/dashboard/LiveLocationMap";
import { type SubjectKind } from "@/lib/subject-kind";
import SafePetImage from "@/components/pet/SafePetImage";
import { isWebNfcReadSupported, readNfcTagUidOnce } from "@/lib/web-nfc-read-uid";
import { normalizeTagUid } from "@/lib/tag-uid-format";

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
  pets: Array<{ id: string; name: string; breed?: string | null; photo_url?: string | null; is_lost?: number | null }>;
  isAdmin: boolean;
  modeAnnouncements: ModeAnnouncementRow[];
  tenantId?: string | null;
  tenantUsage?: TenantPlanUsageSummary | null;
  tenantSuspended?: boolean;
  linkedTagCount?: number;
}

function limitText(used: number, limit: number | null): string {
  return `${used}/${limit == null ? "∞" : limit}`;
}

const STALE_ACTION_RELOAD_KEY = "pet-dashboard-stale-action-reload-once";

type NDEFWriterCtor = new () => {
  write(message: { records: Array<{ recordType: string; data: string }> }): Promise<void>;
};

function getNdefWriterClass(): NDEFWriterCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { NDEFWriter?: NDEFWriterCtor };
  return w.NDEFWriter ?? null;
}

export default function PetDashboard({
  session,
  pets,
  isAdmin,
  modeAnnouncements,
  tenantId,
  tenantUsage,
  tenantSuspended = false,
  linkedTagCount = 0
}: PetDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPetId, setSelectedPetId] = useState("");
  const [tagId, setTagId] = useState("");
  const [tagMessage, setTagMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [subjectsWithLocation, setSubjectsWithLocation] = useState<SubjectWithLocation[]>([]);
  const [isMapRefreshing, setIsMapRefreshing] = useState(false);
  const [tagLinkedInSession, setTagLinkedInSession] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [isNfcWriting, setIsNfcWriting] = useState(false);
  const router = useRouter();
  
  const subjectKind = "pet";
  const meta = subjectKindMeta[subjectKind];
  const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
  const kindQs = tenantQs;
  const AvatarIcon = PawPrint;
  const webNfcSupported = isWebNfcReadSupported();
  const webNfcWriteSupported = Boolean(getNdefWriterClass());

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

  const toKoreanNfcError = (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("not supported")) return "이 브라우저/기기에서는 NFC 읽기를 지원하지 않습니다.";
    if (m.includes("permission denied") || m.includes("notallowederror")) return "NFC 권한이 거부되었습니다. 브라우저 권한을 확인해 주세요.";
    if (m.includes("no tag detected")) return "태그를 인식하지 못했습니다. 태그를 휴대폰 뒷면에 다시 가까이 대주세요.";
    if (m.includes("reading error")) return "NFC 읽기 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    if (m.includes("invalid uid format")) return "인식한 태그 UID 형식이 올바르지 않습니다.";
    if (m.includes("cancelled")) return "NFC 읽기가 취소되었습니다.";
    return "NFC 태그를 읽지 못했습니다. 다시 시도해 주세요.";
  };

  const registerTagToSelectedPet = (uid: string) => {
    setTagMessage(null);
    startTransition(async () => {
      try {
        const result = await linkTagSafe(selectedPetId, uid.trim());
        if (!result.ok) {
          setTagMessage({ type: "error", text: result.error });
          return;
        }
        setTagMessage({ type: "success", text: "NFC 태그가 반려동물에 연결되었습니다." });
        setTagLinkedInSession(true);
        setTagId("");
        router.refresh();
      } catch (e: unknown) {
        const err = e instanceof Error ? e.message : "NFC 태그 등록에 실패했습니다.";
        setTagMessage({ type: "error", text: err });
      }
    });
  };

  const writeTagUrlToNfc = async (uidRaw: string) => {
    const Writer = getNdefWriterClass();
    if (!Writer) {
      setTagMessage({
        type: "error",
        text: "이 기기/브라우저는 NFC URL 기록(NDEFWriter)을 지원하지 않습니다. 관리자의 URL 기록 기능을 사용해 주세요.",
      });
      return;
    }
    const normalizedUid = normalizeTagUid(uidRaw);
    const appBase =
      (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "") ||
      (typeof window !== "undefined" ? window.location.origin : "");
    if (!appBase) {
      setTagMessage({ type: "error", text: "앱 주소를 확인할 수 없어 URL 기록을 진행할 수 없습니다." });
      return;
    }
    const tagUrl = `${appBase}/t/${encodeURIComponent(normalizedUid)}`;

    setIsNfcWriting(true);
    try {
      const writer = new Writer();
      await writer.write({
        records: [{ recordType: "url", data: tagUrl }],
      });
      setTagMessage({
        type: "success",
        text: "NFC 태그에 공개 URL 기록이 완료되었습니다. 이제 태그 스캔 시 프로필이 열립니다.",
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      setTagMessage({
        type: "error",
        text: `태그 연결은 완료됐지만 URL 기록에 실패했습니다: ${toKoreanNfcError(err)}`,
      });
    } finally {
      setIsNfcWriting(false);
    }
  };

  const refreshLocations = useCallback(async () => {
    setIsMapRefreshing(true);
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
          setTagMessage({
            type: "error",
            text: "앱이 최신 버전으로 갱신되어야 합니다. 화면을 새로고침한 뒤 다시 시도해 주세요.",
          });
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
    if (pets.length > 0 && !selectedPetId) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  const handleQuickNfcRegister = () => {
    if (tenantSuspended) return;
    if (!selectedPetId || !tagId.trim()) return;
    registerTagToSelectedPet(tagId);
  };

  const handleReadNfcAndRegister = async () => {
    if (tenantSuspended) return;
    if (!selectedPetId) {
      setTagMessage({ type: "error", text: "먼저 연결할 관리 대상을 선택해 주세요." });
      return;
    }
    if (!webNfcSupported) {
      setTagMessage({ type: "error", text: "이 브라우저/기기에서는 NFC 읽기를 지원하지 않습니다." });
      return;
    }

    setTagMessage(null);
    setIsNfcScanning(true);
    try {
      const result = await readNfcTagUidOnce({ timeoutMs: 30_000 });
      if (!result.ok) {
        setTagMessage({ type: "error", text: toKoreanNfcError(result.error) });
        return;
      }
      setTagId(result.uid);
      registerTagToSelectedPet(result.uid);
    } finally {
      setIsNfcScanning(false);
    }
  };

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
      href: "#quick-nfc-register",
      cta: "바로 연결",
    },
    {
      id: "scan",
      title: "테스트 스캔 확인",
      done: false,
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
              href="#quick-nfc-register"
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
          <Card id="quick-nfc-register" className="rounded-[32px] border-none shadow-app bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">NFC 빠른 등록</h3>
                  <p className="text-[11px] text-slate-400 font-bold">NFC 스캔으로 UID를 자동 인식해 바로 등록할 수 있어요.</p>
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
                      disabled={tenantSuspended || isPending || isNfcScanning}
                      placeholder="NFC 태그 UID 입력"
                      className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                    />
                    <Button
                      onClick={handleReadNfcAndRegister}
                      disabled={tenantSuspended || isPending || isNfcScanning || isNfcWriting || !selectedPetId}
                      className="h-12 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white px-4 font-black"
                    >
                      {isNfcScanning ? "스캔 중..." : "NFC 스캔"}
                    </Button>
                    <Button
                      onClick={handleQuickNfcRegister}
                      disabled={tenantSuspended || isPending || isNfcScanning || isNfcWriting || !selectedPetId || !tagId.trim()}
                      className="h-12 rounded-2xl bg-slate-900 hover:bg-teal-500 text-white px-5 font-black"
                    >
                      등록
                    </Button>
                  </div>
                  <Button
                    onClick={() => void writeTagUrlToNfc(tagId)}
                    disabled={
                      tenantSuspended ||
                      isPending ||
                      isNfcScanning ||
                      isNfcWriting ||
                      !tagId.trim() ||
                      !webNfcWriteSupported
                    }
                    className="h-11 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black"
                  >
                    {isNfcWriting ? "URL 기록 중..." : "태그에 프로필 URL 기록"}
                  </Button>
                  {!webNfcSupported ? (
                    <p className="text-[11px] font-bold text-slate-400">
                      현재 기기/브라우저는 NFC 스캔을 지원하지 않아 UID 수동 입력으로 등록할 수 있습니다.
                    </p>
                  ) : (
                    <p className="text-[11px] font-bold text-slate-400">
                      안드로이드 Chrome에서 NFC 스캔 버튼을 누른 뒤 태그를 휴대폰 뒷면에 가까이 대주세요.
                    </p>
                  )}
                  {!webNfcWriteSupported ? (
                    <p className="text-[11px] font-bold text-amber-600">
                      이 기기에서는 NFC URL 기록이 지원되지 않을 수 있습니다. 이 경우 관리자의 URL 기록 메뉴에서 기록해 주세요.
                    </p>
                  ) : null}
                  {linkedTagCount > 0 ? (
                    <p className="text-[11px] font-bold text-teal-600">
                      현재 연결된 NFC 태그: {linkedTagCount}개
                    </p>
                  ) : null}
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
