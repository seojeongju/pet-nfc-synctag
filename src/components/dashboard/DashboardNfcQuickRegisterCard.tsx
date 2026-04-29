"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkTagSafe, logGuardianNfcAppEvent, prepareGuardianNfcNativeHandoff } from "@/app/actions/tag";
import { CheckCircle, AlertCircle, Smartphone, ScanLine, TriangleAlert, PenLine, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { type SubjectKind } from "@/lib/subject-kind";
import { isWebNfcReadSupported, readNfcTagUidOnce } from "@/lib/web-nfc-read-uid";
import { normalizeTagUid } from "@/lib/tag-uid-format";
import { getNfcOriginMismatchMessage, normalizeAppBaseUrl } from "@/lib/nfc-app-origin-guard";

const STALE_ACTION_RELOAD_KEY = "dashboard-nfc-stale-action-reload-once";
const SHOW_NFC_NATIVE_HANDOFF = process.env.NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED === "true";
const NFC_NATIVE_APP_STORE_URL = (process.env.NEXT_PUBLIC_NFC_NATIVE_APP_STORE_URL || "").trim();

type NDEFWriterCtor = new () => {
  write(message: { records: Array<{ recordType: string; data: string }> }): Promise<void>;
};

function getNdefWriterClass(): NDEFWriterCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { NDEFWriter?: NDEFWriterCtor };
  return w.NDEFWriter ?? null;
}

type TagUrlWriteResult =
  | { ok: true }
  | {
      ok: false;
      reason: "unsupported" | "app_url_missing" | "write_failed" | "origin_or_config_mismatch";
      message: string;
    };

export type DashboardNfcSubject = { id: string; name: string; breed?: string | null };

type Props = {
  subjectKind: SubjectKind;
  subjects: DashboardNfcSubject[];
  tenantId?: string | null;
  tenantSuspended: boolean;
  linkedTagCount?: number;
  /** subjectKindMeta.emptyRegisterHint */
  emptyRegisterHint: string;
  /** 보조 문구: NFC 스캔·UID 입력 안내 */
  subtitle: string;
  /**
   * 선택 id가 바뀔 때 (온보딩 링크·배너용). Pet 대시보드에서만 쓰면 됨.
   */
  onSelectedSubjectIdChange?: (id: string) => void;
  /**
   * 이번 세션에서 링크 성공 시 (온보딩 "태그 연결" 완료 체크용)
   */
  onTagLinkSessionSuccess?: () => void;
};

/**
 * Pet/Elder/Child/Luggage/Gold 대시보드 공통: Web NFC 스캔·링크, URL 기록, 네이티브 handoff, `petidconnect` 앱 열기.
 */
export function DashboardNfcQuickRegisterCard({
  subjectKind,
  subjects,
  tenantId,
  tenantSuspended,
  linkedTagCount = 0,
  emptyRegisterHint,
  subtitle,
  onSelectedSubjectIdChange,
  onTagLinkSessionSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [tagId, setTagId] = useState("");
  const [tagMessage, setTagMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [isNfcWriting, setIsNfcWriting] = useState(false);
  const [isNativeWriteOpening, setIsNativeWriteOpening] = useState(false);
  const [showWebFallback, setShowWebFallback] = useState(false);
  const [nfcSectionHighlight, setNfcSectionHighlight] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onboardingNfcHandledRef = useRef(false);
  const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
  const kindQs = tenantQs;
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

  const toKoreanNfcWriteError = (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("not supported")) return "이 브라우저/기기에서는 NFC URL 기록을 지원하지 않습니다.";
    if (m.includes("permission denied") || m.includes("notallowederror")) return "NFC 기록 권한이 거부되었습니다. 브라우저 권한을 확인해 주세요.";
    if (m.includes("no tag detected")) return "태그를 인식하지 못했습니다. 태그를 휴대폰 뒷면에 다시 가까이 대주세요.";
    if (m.includes("format error") || m.includes("invalid")) return "태그에 기록할 수 없습니다. 다른 NFC 태그인지 확인해 주세요.";
    if (m.includes("cancelled") || m.includes("abort")) return "NFC 기록이 취소되었습니다.";
    return "NFC URL 기록 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  };

  const writeTagUrlToNfc = async (uidRaw: string, options?: { silent?: boolean }): Promise<TagUrlWriteResult> => {
    const Writer = getNdefWriterClass();
    if (!Writer) {
      const message =
        "이 기기/브라우저는 NFC URL 기록(NDEFWriter)을 지원하지 않습니다. 안드로이드 Chrome(HTTPS)으로 이 페이지를 연 뒤 다시 시도해 주세요.";
      if (!options?.silent) {
        setTagMessage({ type: "error", text: message });
      }
      return { ok: false, reason: "unsupported", message };
    }
    const normalizedUid = normalizeTagUid(uidRaw);
    if (typeof window !== "undefined") {
      const originGuard = getNfcOriginMismatchMessage(process.env.NEXT_PUBLIC_APP_URL, window.location.origin);
      if (originGuard) {
        if (!options?.silent) {
          setTagMessage({ type: "error", text: originGuard });
        }
        return { ok: false, reason: "origin_or_config_mismatch", message: originGuard };
      }
    }
    const envBase = normalizeAppBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
    const appBase = envBase || (typeof window !== "undefined" ? window.location.origin : "");
    if (!appBase) {
      const message = "앱 주소를 확인할 수 없어 URL 기록을 진행할 수 없습니다.";
      if (!options?.silent) {
        setTagMessage({ type: "error", text: message });
      }
      return { ok: false, reason: "app_url_missing", message };
    }
    const tagUrl = `${appBase}/t/${encodeURIComponent(normalizedUid)}`;
    setIsNfcWriting(true);
    try {
      const writer = new Writer();
      await writer.write({
        records: [{ recordType: "url", data: tagUrl }],
      });
      if (!options?.silent) {
        setTagMessage({
          type: "success",
          text: "태그에 프로필 주소 기록이 완료되었습니다. 이제 태그를 스캔하면 프로필이 열립니다.",
        });
      }
      return { ok: true };
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      const message = toKoreanNfcWriteError(err);
      if (!options?.silent) {
        setTagMessage({
          type: "error",
          text: `태그에 프로필 주소 기록에 실패했습니다: ${message}`,
        });
      }
      return { ok: false, reason: "write_failed", message };
    } finally {
      setIsNfcWriting(false);
    }
  };

  const registerTagToSubject = (uid: string) => {
    if (!selectedSubjectId) return;
    setTagMessage(null);
    startTransition(async () => {
      try {
        const result = await linkTagSafe(selectedSubjectId, uid.trim());
        if (!result.ok) {
          if (isStaleServerActionError(new Error(result.error))) {
            const reloaded = reloadOnceForStaleAction();
            if (!reloaded) {
              setTagMessage({
                type: "error",
                text: "앱이 최신 버전으로 갱신되어야 합니다. 화면을 새로고침한 뒤 다시 시도해 주세요.",
              });
            }
          } else {
            setTagMessage({ type: "error", text: result.error });
          }
          return;
        }
        const writeResult = await writeTagUrlToNfc(uid, { silent: true });
        if (writeResult.ok) {
          setTagMessage({
            type: "success",
            text: "NFC 태그 연결과 프로필 주소 기록이 완료되었습니다. 이제 태그를 스캔하면 프로필이 열립니다.",
          });
        } else {
          setTagMessage({
            type: "success",
            text: `NFC 태그 연결은 완료되었습니다. 다만 태그에 프로필 주소 자동 기록은 되지 않았습니다 (${writeResult.message}). 아래 '태그에 프로필 주소 기록'으로 다시 시도해 주세요.`,
          });
        }
        onTagLinkSessionSuccess?.();
        setTagId(normalizeTagUid(uid));
        router.refresh();
      } catch (e: unknown) {
        if (isStaleServerActionError(e)) {
          const reloaded = reloadOnceForStaleAction();
          if (!reloaded) {
            setTagMessage({
              type: "error",
              text: "앱이 최신 버전으로 갱신되어야 합니다. 화면을 새로고침한 뒤 다시 시도해 주세요.",
            });
          }
          return;
        }
        const err = e instanceof Error ? e.message : "NFC 태그 등록에 실패했습니다.";
        setTagMessage({ type: "error", text: err });
      }
    });
  };

  const openNativeAppForNfcWrite = async () => {
    if (!selectedSubjectId || !tagId.trim()) {
      setTagMessage({ type: "error", text: "먼저 연결할 대상과 태그 UID를 확인해 주세요." });
      return;
    }
    setIsNativeWriteOpening(true);
    setTagMessage(null);
    try {
      const handoff = await prepareGuardianNfcNativeHandoff({
        petId: selectedSubjectId,
        tagIdRaw: tagId,
      });
      if (!handoff.ok) {
        setTagMessage({ type: "error", text: handoff.error });
        return;
      }
      if (typeof window !== "undefined") {
        window.location.href = handoff.appLink;
      }
      setTagMessage({
        type: "success",
        text: "기록 앱 실행을 시도했습니다. 앱에서 태그 기록 후 다시 돌아오면 연결 상태를 확인할 수 있습니다.",
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      setTagMessage({ type: "error", text: `앱 실행 준비에 실패했습니다: ${err}` });
    } finally {
      setIsNativeWriteOpening(false);
    }
  };

  const handleQuickNfcRegister = () => {
    if (tenantSuspended) return;
    if (!selectedSubjectId || !tagId.trim()) return;
    registerTagToSubject(tagId);
  };

  const handleReadNfcAndRegister = async () => {
    if (tenantSuspended) return;
    if (!selectedSubjectId) {
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
      registerTagToSubject(result.uid);
    } finally {
      setIsNfcScanning(false);
    }
  };

  const openAppFirstRegister = async () => {
    if (tenantSuspended) return;
    if (!selectedSubjectId) {
      setTagMessage({ type: "error", text: "먼저 연결할 관리 대상을 선택해 주세요." });
      return;
    }
    if (typeof window === "undefined") return;

    setIsNativeWriteOpening(true);
    setTagMessage({
      type: "success",
      text: "전용 앱 실행을 시도합니다. 앱이 열리면 NFC 등록을 진행해 주세요.",
    });

    const envBase = normalizeAppBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
    const appBase = envBase || (typeof window !== "undefined" ? window.location.origin : "");
    const normalizedTag = normalizeTagUid(tagId);
    const hasUid = Boolean(normalizedTag && normalizedTag.trim().length > 0);

    let appHref = "";
    if (hasUid) {
      try {
        const handoff = await prepareGuardianNfcNativeHandoff({
          petId: selectedSubjectId,
          tagIdRaw: normalizedTag,
        });
        if (handoff.ok) {
          appHref = handoff.appLink;
        }
      } catch {
        /* ignore and fallback to nfc/pet */
      }
    }
    if (!appHref) {
      const params = new URLSearchParams();
      params.set("kind", subjectKind);
      params.set("pet_id", selectedSubjectId);
      if (tenantId?.trim()) params.set("tenant", tenantId.trim());
      params.set("entry", "dashboard_quick_register");
      if (appBase) params.set("app_base", appBase);
      if (hasUid) params.set("uid", normalizedTag);
      appHref = `petidconnect://nfc/pet?${params.toString()}`;
    }

    const installFallback = `/install?next=${encodeURIComponent(appHref)}`;
    const fallbackHref = NFC_NATIVE_APP_STORE_URL || installFallback;
    const logEvent = (event: "app_open_attempt" | "app_opened" | "store_fallback" | "install_page_fallback") => {
      void logGuardianNfcAppEvent({
        event,
        subjectKind,
        petId: selectedSubjectId,
        tenantId,
      }).catch(() => {});
    };
    logEvent("app_open_attempt");

    const fallbackTimer = window.setTimeout(() => {
      logEvent(NFC_NATIVE_APP_STORE_URL ? "store_fallback" : "install_page_fallback");
      window.location.href = fallbackHref;
    }, 1200);
    const clearFallback = () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", clearFallback);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        logEvent("app_opened");
        clearFallback();
      }
    };
    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", clearFallback);

    window.location.href = appHref;
    window.setTimeout(() => setIsNativeWriteOpening(false), 1400);
  };

  useEffect(() => {
    if (subjects.length === 0) {
      setSelectedSubjectId("");
      onSelectedSubjectIdChange?.("");
      return;
    }
    const subQ = searchParams.get("pet");
    if (subQ && subjects.some((p) => p.id === subQ)) {
      setSelectedSubjectId(subQ);
      onSelectedSubjectIdChange?.(subQ);
      return;
    }
    setSelectedSubjectId((prev) => {
      const next = prev || subjects[0].id;
      onSelectedSubjectIdChange?.(next);
      return next;
    });
  }, [subjects, searchParams, onSelectedSubjectIdChange]);

  useEffect(() => {
    if (searchParams.get("onboarding") !== "nfc") {
      onboardingNfcHandledRef.current = false;
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("onboarding") !== "nfc") return;
    if (onboardingNfcHandledRef.current) return;
    onboardingNfcHandledRef.current = true;
    const scrollT = window.setTimeout(() => {
      document.getElementById("quick-nfc-register")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 400);
    setNfcSectionHighlight(true);
    const hlT = window.setTimeout(() => setNfcSectionHighlight(false), 5200);
    const p = new URLSearchParams(searchParams.toString());
    p.delete("onboarding");
    p.delete("pet");
    const next = p.toString();
    router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    return () => {
      window.clearTimeout(scrollT);
      window.clearTimeout(hlT);
    };
  }, [searchParams, pathname, router]);

  const onChangeSubject = (id: string) => {
    setSelectedSubjectId(id);
    onSelectedSubjectIdChange?.(id);
  };

  return (
    <Card
      id="quick-nfc-register"
      className={cn(
        "rounded-[32px] border-none shadow-app bg-white scroll-mt-24 transition-shadow duration-500",
        nfcSectionHighlight && "ring-2 ring-teal-400 ring-offset-2 shadow-teal-100/80"
      )}
    >
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-500">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">NFC 연결 관리</h3>
            <p className="text-[11px] font-bold text-slate-400">{subtitle}</p>
          </div>
        </div>

        {subjects.length > 0 ? (
          <>
            <select
              value={selectedSubjectId}
              onChange={(e) => onChangeSubject(e.target.value)}
              disabled={tenantSuspended}
              className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.breed ? `(${s.breed})` : ""}
                </option>
              ))}
            </select>

            <Button
              type="button"
              onClick={openAppFirstRegister}
              disabled={
                tenantSuspended ||
                isNativeWriteOpening ||
                !selectedSubjectId
              }
              className="h-12 w-full rounded-2xl bg-indigo-600 font-black text-white hover:bg-indigo-500"
            >
              {isNativeWriteOpening ? "앱 실행 중…" : "앱으로 NFC 등록하기"}
            </Button>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
              <div className="flex items-start gap-2">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-indigo-800">기기·브라우저 상관없이 앱에서 등록</p>
                  <p className="mt-0.5 text-[11px] font-bold text-indigo-700/90 leading-relaxed">
                    등록 버튼 한 번으로 앱 실행을 먼저 시도합니다. 앱이 없으면 설치 화면으로 자동 이동합니다.
                  </p>
                </div>
              </div>
            </div>
            <a
              href={NFC_NATIVE_APP_STORE_URL || "/install"}
              className="inline-flex items-center text-[11px] font-black text-indigo-700 underline underline-offset-2"
            >
              앱이 없나요? {NFC_NATIVE_APP_STORE_URL ? "스토어에서 설치하기" : "설치 안내 보기"}
            </a>
            <button
              type="button"
              onClick={() => setShowWebFallback((prev) => !prev)}
              className="text-[11px] font-black text-slate-500 underline underline-offset-2"
            >
              {showWebFallback ? "브라우저 직접 등록 접기" : "브라우저에서 직접 등록(고급) 열기"}
            </button>
            {showWebFallback ? (
              <>
                <div className="flex items-center gap-2">
                  <Input
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value)}
                    disabled={tenantSuspended || isPending || isNfcScanning}
                    placeholder="NFC 태그 UID 입력"
                    className="h-12 flex-1 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                  />
                  <Button
                    type="button"
                    onClick={handleReadNfcAndRegister}
                    disabled={tenantSuspended || isPending || isNfcScanning || isNfcWriting || !selectedSubjectId}
                    className="h-12 shrink-0 rounded-2xl bg-teal-600 px-4 font-black text-white hover:bg-teal-500"
                  >
                    {isNfcScanning ? "스캔 중…" : "NFC 스캔"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleQuickNfcRegister}
                    disabled={tenantSuspended || isPending || isNfcScanning || isNfcWriting || !selectedSubjectId || !tagId.trim()}
                    className="h-12 shrink-0 rounded-2xl bg-slate-900 px-5 font-black text-white hover:bg-teal-500"
                  >
                    등록
                  </Button>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    void writeTagUrlToNfc(tagId);
                  }}
                  disabled={
                    tenantSuspended ||
                    isPending ||
                    isNfcScanning ||
                    isNfcWriting ||
                    isNativeWriteOpening ||
                    !tagId.trim() ||
                    !webNfcWriteSupported
                  }
                  className="h-11 w-full rounded-2xl bg-emerald-600 font-black text-white hover:bg-emerald-500"
                >
                  {isNfcWriting ? "기록 중…" : "태그에 프로필 주소 기록"}
                </Button>
                {!webNfcSupported ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start gap-2">
                      <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-700">NFC 스캔 미지원 브라우저</p>
                        <p className="mt-0.5 text-[11px] font-bold text-slate-500 leading-relaxed">
                          현재 기기에서는 NFC 스캔이 어려워요. 위 입력칸에 UID를 직접 넣어 등록해 주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3">
                    <div className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-teal-800">빠른 스캔 안내</p>
                        <p className="mt-0.5 text-[11px] font-bold text-teal-700/90 leading-relaxed">
                          안드로이드 Chrome에서 NFC 스캔 버튼을 누른 뒤, 태그를 휴대폰 뒷면에 가까이 대 주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!webNfcWriteSupported ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-start gap-2">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-amber-800">브라우저 직접 기록 제한</p>
                        <p className="mt-0.5 text-[11px] font-bold text-amber-700 leading-relaxed">
                          이 브라우저에서는 태그 주소를 바로 쓰기 어려울 수 있어요. 가능하면 위의 앱 등록 버튼을 사용해 주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                    <div className="flex items-start gap-2">
                      <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-emerald-800">자동 주소 기록 지원</p>
                        <p className="mt-0.5 text-[11px] font-bold text-emerald-700/90 leading-relaxed">
                          주소를 직접 입력하지 않아도 됩니다. 버튼을 누른 뒤 태그를 폰 뒷면에 대면 서비스가 자동 기록해요.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!webNfcWriteSupported ? (
                  <Button
                    type="button"
                    onClick={() => {
                      void openNativeAppForNfcWrite();
                    }}
                    disabled={
                      tenantSuspended ||
                      isPending ||
                      isNfcScanning ||
                      isNfcWriting ||
                      isNativeWriteOpening ||
                      !selectedSubjectId ||
                      !tagId.trim()
                    }
                    className="h-11 w-full rounded-2xl bg-indigo-600 font-black text-white hover:bg-indigo-500"
                  >
                    {isNativeWriteOpening
                      ? "앱 실행 중…"
                      : SHOW_NFC_NATIVE_HANDOFF
                        ? "앱으로 태그 주소 기록"
                        : "앱 설치/열기"}
                  </Button>
                ) : null}
              </>
            ) : null}
            {selectedSubjectId ? (
              <a
                href={`/dashboard/${subjectKind}/pets/${selectedSubjectId}${tenantQs ? `${tenantQs}&` : "?"}nfc=1`}
                className="text-[11px] font-black text-slate-400 underline underline-offset-2"
              >
                상세 NFC 관리 화면으로 이동
              </a>
            ) : null}
            {linkedTagCount > 0 ? (
              <p className="text-[11px] font-bold text-teal-600">연결된 태그: {linkedTagCount}개</p>
            ) : null}
          </>
        ) : (
          <div className="relative z-10 space-y-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs font-bold text-slate-500">{emptyRegisterHint}</p>
            <button
              type="button"
              onClick={() => {
                if (tenantSuspended) return;
                router.push(`/dashboard/${subjectKind}/pets/new${kindQs}`);
              }}
              disabled={tenantSuspended}
              className={cn(
                "min-h-11 w-full max-w-sm rounded-lg px-2 text-xs font-black underline underline-offset-4 transition active:scale-[0.99]",
                tenantSuspended
                  ? "cursor-not-allowed text-slate-400"
                  : "cursor-pointer text-teal-600 hover:text-teal-700"
              )}
            >
              등록하러 가기
            </button>
          </div>
        )}

        {tagMessage && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold",
              tagMessage.type === "success" ? "bg-teal-50 text-teal-600" : "bg-rose-50 text-rose-500"
            )}
          >
            {tagMessage.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{tagMessage.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
