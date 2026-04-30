"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkTagSafe, logGuardianNfcAppEvent, prepareGuardianNfcNativeHandoff } from "@/app/actions/tag";
import { CheckCircle, AlertCircle, Smartphone, ScanLine, TriangleAlert, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { type SubjectKind } from "@/lib/subject-kind";
import { isWebNfcReadSupported, readNfcTagUidOnce } from "@/lib/web-nfc-read-uid";
import { normalizeTagUid } from "@/lib/tag-uid-format";
import { getNfcOriginMismatchMessage, normalizeAppBaseUrl } from "@/lib/nfc-app-origin-guard";

const STALE_ACTION_RELOAD_KEY = "dashboard-nfc-stale-action-reload-once";
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

  /**
   * petidconnect 딥링크 (nfc/write → nfc/pet) + 미설치 시 /install?next= 또는 스토어. 연결 직후·상단 CTA·고급 보조 버튼에서 공통 사용.
   */
  const runPetIdConnectAppLaunch = async (input: { petId: string; tagIdRaw: string }) => {
    if (tenantSuspended || typeof window === "undefined") return;
    const { petId, tagIdRaw } = input;
    setIsNativeWriteOpening(true);
    setTagMessage({
      type: "success",
      text: "앱을 띄우는 중이에요. 열리면 보호자 연동 화면에서 태그에 대고 저장하세요. 앱이 없으면 설치 안내로 이어갑니다.",
    });

    const envBase = normalizeAppBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
    const appBase = envBase || window.location.origin;
    const normalizedTag = normalizeTagUid(tagIdRaw);
    const hasUid = Boolean(normalizedTag && normalizedTag.trim().length > 0);

    let appHref = "";
    if (hasUid) {
      try {
        const handoff = await prepareGuardianNfcNativeHandoff({
          petId,
          tagIdRaw: normalizedTag,
        });
        if (handoff.ok) {
          appHref = handoff.appLink;
        }
      } catch {
        /* nfc/pet */
      }
    }
    if (!appHref) {
      const params = new URLSearchParams();
      params.set("kind", subjectKind);
      params.set("pet_id", petId);
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
        petId,
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
        onTagLinkSessionSuccess?.();
        setTagId(normalizeTagUid(uid));
        router.refresh();
        void runPetIdConnectAppLaunch({ petId: selectedSubjectId, tagIdRaw: uid });
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
    await runPetIdConnectAppLaunch({ petId: selectedSubjectId, tagIdRaw: tagId });
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
            <h3 className="text-base font-black text-slate-900">태그에 프로필 연결</h3>
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed">스캔하면 이 대상의 안내로 이어집니다.</p>
            {subtitle ? <p className="text-[10px] font-bold text-slate-400 leading-relaxed">{subtitle}</p> : null}
          </div>
        </div>

        {subjects.length > 0 ? (
          <>
            <ol className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500">
              <li className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                <span className="font-black text-teal-600">1</span> 대상 선택
              </li>
              <span className="text-slate-300" aria-hidden>
                →
              </span>
              <li className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                <span className="font-black text-indigo-600">2</span> 아래 버튼으로 앱
              </li>
              <span className="text-slate-300" aria-hidden>
                →
              </span>
              <li className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                <span className="font-black text-slate-600">3</span> 앱에서 태그에 대고 저장
              </li>
            </ol>
            <p className="text-xs font-bold text-slate-600 leading-snug">
              주소(URL)는 앱·서비스가 맞춰 둡니다. 길게 입력하거나 복사할 일은 거의 없어요.
            </p>
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
              {isNativeWriteOpening ? "앱을 여는 중…" : "앱에서 이어서 연결·저장"}
            </Button>
            <p className="text-[11px] font-bold text-slate-500 text-center leading-relaxed">
              앱이 없으면 잠시 뒤 설치 안내(또는 스토어)로 안내해 드려요. 설치 뒤에는 같은 화면만 이어가면 됩니다.
            </p>
            <a
              href={NFC_NATIVE_APP_STORE_URL || "/install"}
              className="block text-center text-[11px] font-bold text-indigo-600 underline underline-offset-2"
            >
              앱이 전혀 없을 때만: {NFC_NATIVE_APP_STORE_URL ? "스토어에서 설치" : "설치 방법 보기"}
            </a>
            <button
              type="button"
              onClick={() => setShowWebFallback((prev) => !prev)}
              className="w-full text-[11px] font-bold text-slate-500 underline underline-offset-2"
            >
              {showWebFallback
                ? "닫기 — 앱 쓰기 권장"
                : "이 휴대폰의 Chrome에서만 직접 하기(고급) — 앱이 더 쉬워요"}
            </button>
            {showWebFallback ? (
              <>
                <p className="text-[11px] font-bold text-slate-600">
                  <span className="font-black text-slate-800">고급(Chrome + NFC):</span>{" "}
                  <span className="text-teal-700">스캔(또는 번호 입력)</span> →{" "}
                  <span className="text-slate-800">① 연결</span>하면 서버에 묶이고, 곧바로{" "}
                  <span className="text-indigo-700">앱</span>이 열려 보호자 연동에서 UID·주소를 맞춥니다. 앱이 없으면 설치/스토어로
                  이어집니다.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value)}
                    disabled={tenantSuspended || isPending || isNfcScanning}
                    placeholder="탭 옆에 적힌 번호를 넣거나"
                    className="h-12 flex-1 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                  />
                  <Button
                    type="button"
                    onClick={handleReadNfcAndRegister}
                    disabled={tenantSuspended || isPending || isNfcScanning || isNfcWriting || !selectedSubjectId}
                    className="h-12 shrink-0 rounded-2xl bg-teal-600 px-4 font-black text-white hover:bg-teal-500"
                  >
                    {isNfcScanning ? "스캔 중…" : "NFC로 읽기"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleQuickNfcRegister}
                    disabled={tenantSuspended || isPending || isNfcScanning || isNfcWriting || !selectedSubjectId || !tagId.trim()}
                    className="h-12 shrink-0 rounded-2xl bg-slate-900 px-5 font-black text-white hover:bg-teal-500"
                  >
                    ① 연결
                  </Button>
                </div>
                <p className="text-[10px] font-bold text-slate-400">선택: Chrome에서 태그에 바로 NDEF 쓰기(① 연결 후, 앱 없이 끝낼 때만)</p>
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
                  className="h-10 w-full rounded-2xl border border-emerald-200 bg-white font-bold text-emerald-800 hover:bg-emerald-50/80"
                  variant="outline"
                >
                  {isNfcWriting ? "쓰는 중…" : "이 브라우저로 태그에 주소 쓰기(선택)"}
                </Button>
                {!webNfcSupported && (
                  <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <ScanLine className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <p className="text-[10px] font-bold text-slate-600">이 환경에서는 스캔이 안 될 수 있어요. 윗칸에 번호를 직접 넣어 주세요.</p>
                  </div>
                )}
                {webNfcSupported && !webNfcWriteSupported && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <p className="text-[10px] font-bold text-amber-900/90">
                      이 브라우저는 주소 &quot;쓰기&quot;가 막힐 수 있어요. ① 연결 뒤 자동으로 열리는 <strong>앱</strong>을 쓰는 편이 가장 쉽습니다.
                    </p>
                  </div>
                )}
                {webNfcSupported && webNfcWriteSupported && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5">
                    <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <p className="text-[10px] font-bold text-emerald-900/85">위 &quot;선택&quot; 쓰기는 NDEF가 될 때만. 보통은 ① 연결 후 뜨는 앱이면 됩니다.</p>
                  </div>
                )}
                <Button
                  type="button"
                  onClick={() => {
                    void runPetIdConnectAppLaunch({ petId: selectedSubjectId, tagIdRaw: tagId });
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
                  {isNativeWriteOpening ? "앱을 여는 중…" : "이미 연결돼 있을 때: 앱으로 다시 열기"}
                </Button>
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
