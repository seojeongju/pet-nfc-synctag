"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkTagSafe, prepareGuardianNfcNativeHandoff } from "@/app/actions/tag";
import { CheckCircle, AlertCircle, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { type SubjectKind } from "@/lib/subject-kind";
import { OpenNativePetNfcSectionButton } from "@/components/pet/OpenNativePetNfcSectionButton";
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
            {!webNfcSupported ? (
              <p className="text-[11px] font-bold text-slate-400">
                현재 기기/브라우저는 NFC 스캔을 지원하지 않아 UID 수동 입력으로 등록할 수 있습니다.
              </p>
            ) : (
              <p className="text-[11px] font-bold text-slate-400">
                안드로이드 Chrome에서 NFC 스캔 버튼을 누른 뒤 태그를 휴대폰 뒷면에 가깝게 대 주세요.
              </p>
            )}
            {!webNfcWriteSupported ? (
              <p className="text-[11px] font-bold text-amber-600">
                이 브라우저에서는 태그에 주소를 바로 쓸 수 없을 수 있어요.
                {SHOW_NFC_NATIVE_HANDOFF
                  ? " 위의 '앱으로 태그 주소 기록' 버튼으로 전용 앱을 열어 진행해 주세요."
                  : " 위의 '앱 설치/열기'를 누르면 전용 앱이 열리고, 앱에서 태그에 주소를 기록할 수 있어요. 앱이 없다면 아래 '스토어에서 설치하기'를 이용해 주세요."}
              </p>
            ) : (
              <p className="text-[11px] font-bold text-slate-400">
                주소를 직접 입력하지 않아도 됩니다. 버튼을 누른 뒤 태그를 폰 뒷면에 대면 서비스가 알아서 기록해요.
              </p>
            )}
            {!webNfcWriteSupported && NFC_NATIVE_APP_STORE_URL ? (
              <a
                href={NFC_NATIVE_APP_STORE_URL}
                className="inline-flex items-center text-[11px] font-black text-indigo-700 underline underline-offset-2"
              >
                앱이 없나요? 스토어에서 설치하기
              </a>
            ) : null}
            {selectedSubjectId ? (
              <OpenNativePetNfcSectionButton kind={subjectKind} petId={selectedSubjectId} tenantId={tenantId ?? null} />
            ) : null}
            {linkedTagCount > 0 ? (
              <p className="text-[11px] font-bold text-teal-600">연결된 태그: {linkedTagCount}개</p>
            ) : null}
          </>
        ) : (
          <div className="space-y-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs font-bold text-slate-500">{emptyRegisterHint}</p>
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
