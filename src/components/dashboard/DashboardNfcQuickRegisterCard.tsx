"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkTagSafe, logGuardianNfcAppEvent, prepareGuardianNfcNativeHandoff } from "@/app/actions/tag";
import { CheckCircle, AlertCircle, Smartphone, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import { isWebNfcReadSupported, readNfcTagUidOnce } from "@/lib/web-nfc-read-uid";
import { normalizeTagUid } from "@/lib/tag-uid-format";
import { normalizeAppBaseUrl } from "@/lib/nfc-app-origin-guard";

const STALE_ACTION_RELOAD_KEY = "dashboard-nfc-stale-action-reload-once";
const NFC_NATIVE_APP_STORE_URL = (process.env.NEXT_PUBLIC_NFC_NATIVE_APP_STORE_URL || "").trim();

export type DashboardNfcSubject = {
  id: string;
  name: string;
  breed?: string | null;
  subject_kind?: SubjectKind;
};

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
  const [isNativeWriteOpening, setIsNativeWriteOpening] = useState(false);
  const [nfcSectionHighlight, setNfcSectionHighlight] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onboardingNfcHandledRef = useRef(false);
  const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
  const kindQs = tenantQs;
  const webNfcSupported = isWebNfcReadSupported();

  /** 서버/캐시 이슈에도 현재 대시보드 모드와 일치하는 대상만 선택 목록에 노출 */
  const subjectsInMode = useMemo(
    () => subjects.filter((s) => parseSubjectKind(s.subject_kind) === subjectKind),
    [subjects, subjectKind]
  );

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

  /**
   * petidconnect 딥링크 (nfc/write → nfc/pet) + 미설치 시 /install?next= 또는 스토어. 연결(서버 linkTag) 직후에만 사용.
   */
  const runPetIdConnectAppLaunch = async (input: { petId: string; tagIdRaw: string }) => {
    if (tenantSuspended || typeof window === "undefined") return;
    const { petId, tagIdRaw } = input;
    setIsNativeWriteOpening(true);
    setTagMessage({
      type: "success",
      text: "앱을 띄우는 중이에요. 앱이 없으면 설치 안내로 이어집니다. 열리면 보호자연동(Link-U 전용 모드)에서 태그에 대고 저장하세요. (정보는 자동)",
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

  /** Web NFC로 UID만 읽어서 칸에 넣습니다. 연결(서버 반영+앱)은 별도 버튼. */
  const handleReadNfcTag = async () => {
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
      setTagMessage({
        type: "success",
        text: "태그 UID를 읽었습니다. 아래 「연결하고 앱에서 저장」을 누르면 서버에 연결한 뒤 앱(또는 설치 안내)이 열립니다.",
      });
    } finally {
      setIsNfcScanning(false);
    }
  };

  useEffect(() => {
    if (subjectsInMode.length === 0) {
      setSelectedSubjectId("");
      onSelectedSubjectIdChange?.("");
      return;
    }
    const subQ = searchParams.get("pet");
    if (subQ && subjectsInMode.some((p) => p.id === subQ)) {
      setSelectedSubjectId(subQ);
      onSelectedSubjectIdChange?.(subQ);
      return;
    }
    setSelectedSubjectId((prev) => {
      const next = prev && subjectsInMode.some((p) => p.id === prev) ? prev : subjectsInMode[0]!.id;
      onSelectedSubjectIdChange?.(next);
      return next;
    });
  }, [subjectsInMode, searchParams, onSelectedSubjectIdChange]);

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

        {subjectsInMode.length > 0 ? (
          <>
            <ol className="list-decimal space-y-1.5 pl-4 text-[11px] font-bold text-slate-600 leading-relaxed">
              <li>연결할 대상(프로필)을 고릅니다.</li>
              <li>태그를 휴대폰에 대서 NFC로 읽거나, 태그/패키지에 적힌 UID를 직접 넣어 번호를 맞춥니다.</li>
              <li>
                <span className="font-black text-slate-800">「연결하고 앱에서 저장」</span>을 누르면 서버에 태그가 연결되고, 이어서 앱이
                열립니다. (앱이 없으면 설치 안내로 먼저 갑니다.)
              </li>
              <li>앱의 <span className="font-black text-slate-800">보호자연동(Link-U 전용 모드)</span> 화면(UID·URL은 자동)에서 태그에 대고 <span className="font-black text-slate-800">저장</span>으로 마칩니다.</li>
            </ol>
            <p className="text-[10px] font-bold text-slate-400">이 화면에서는 URL을 길게 입력하거나 복사할 일이 없습니다. 주소는 연결·앱 쪽에서 맞춥니다.</p>
            <select
              value={selectedSubjectId}
              onChange={(e) => onChangeSubject(e.target.value)}
              disabled={tenantSuspended}
              className="h-12 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {subjectsInMode.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.breed ? `(${s.breed})` : ""}
                </option>
              ))}
            </select>

            <p className="text-[11px] font-bold text-slate-700">태그 UID</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Input
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                disabled={tenantSuspended || isPending || isNfcScanning}
                placeholder="NFC로 읽기 또는 옆/패키지 번호 입력"
                className="h-12 min-w-0 flex-1 rounded-2xl border-slate-100 bg-slate-50 font-bold"
              />
              <Button
                type="button"
                onClick={() => void handleReadNfcTag()}
                disabled={tenantSuspended || isPending || isNfcScanning || isNativeWriteOpening || !selectedSubjectId || !webNfcSupported}
                className="h-12 w-full shrink-0 rounded-2xl bg-teal-600 px-4 font-black text-white hover:bg-teal-500 sm:min-w-[7.5rem] sm:w-auto"
              >
                {isNfcScanning ? "읽는 중…" : "NFC로 읽기"}
              </Button>
            </div>
            {!webNfcSupported ? (
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <ScanLine className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                <p className="text-[10px] font-bold text-slate-600">
                  이 기기/브라우저에서는 Web NFC로 읽기를 쓰지 못할 수 있어요. 태그에 표시된 번호를 위 칸에만 넣고 이어가면 됩니다.
                </p>
              </div>
            ) : null}
            <Button
              type="button"
              onClick={handleQuickNfcRegister}
              disabled={
                tenantSuspended ||
                isPending ||
                isNfcScanning ||
                isNativeWriteOpening ||
                !selectedSubjectId ||
                !tagId.trim()
              }
              className="h-12 w-full rounded-2xl bg-indigo-600 font-black text-white hover:bg-indigo-500"
            >
              {isPending ? "서버에 연결하는 중…" : isNativeWriteOpening ? "앱을 여는 중…" : "연결하고 앱에서 저장"}
            </Button>
            <p className="text-center text-[10px] font-bold text-slate-500 leading-relaxed">
              앱이 이미 있으면 보호자연동(Link-U 전용 모드)으로 바로 이어지고, 없을 때는 설치를 거친 뒤에도 위와 같은 화면만 밟으면 됩니다.
            </p>
            {selectedSubjectId ? (
              <a
                href={`/dashboard/${subjectKind}/pets/${selectedSubjectId}${tenantQs ? `${tenantQs}&` : "?"}nfc=1`}
                className="text-[11px] font-black text-slate-400 underline underline-offset-2"
              >
                태그 목록·해제·추가는 상세 NFC 화면에서
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
