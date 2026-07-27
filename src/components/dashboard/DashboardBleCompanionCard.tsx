"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bluetooth, ScanLine, AlertCircle, CheckCircle, Smartphone, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { type SubjectKind } from "@/lib/subject-kind";
import { logGuardianBleAppEvent, type GuardianBleCompanionTarget } from "@/app/actions/tag";
import { getBleCompanionAppStoreUrl } from "@/lib/ble-companion-feature";
import { normalizeAppBaseUrl } from "@/lib/nfc-app-origin-guard";

const BLE_COMPANION_STORE_URL = getBleCompanionAppStoreUrl();

export type DashboardBleSubject = {
  id: string;
  name: string;
};

type Props = {
  subjectKind: SubjectKind;
  subjects: DashboardBleSubject[];
  targets: GuardianBleCompanionTarget[];
  tenantId?: string | null;
  tenantSuspended: boolean;
  emptyRegisterHint: string;
};

export function DashboardBleCompanionCard({
  subjectKind,
  subjects,
  targets,
  tenantId,
  tenantSuspended,
  emptyRegisterHint,
}: Props) {
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");
  const [isOpening, setIsOpening] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setIsAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (selectedPetId && subjects.some((s) => s.id === selectedPetId)) return;
    setSelectedPetId(subjects[0]?.id ?? "");
  }, [subjects, selectedPetId]);

  const tagsForPet = useMemo(
    () => targets.filter((t) => t.pet_id === selectedPetId),
    [targets, selectedPetId]
  );

  useEffect(() => {
    const preferred = tagsForPet.find((t) => t.ble_mac) ?? tagsForPet[0];
    setSelectedTagId(preferred?.tag_id ?? "");
  }, [tagsForPet]);

  const selectedTarget = tagsForPet.find((t) => t.tag_id === selectedTagId) ?? null;

  const openCompanionApp = () => {
    if (tenantSuspended || !selectedPetId || typeof window === "undefined") return;
    setIsOpening(true);
    setMessage({
      type: "success",
      text: "동행 앱을 여는 중이에요. 앱이 없으면 설치 안내로 이어집니다.",
    });

    const appBase = normalizeAppBaseUrl(process.env.NEXT_PUBLIC_APP_URL) || window.location.origin;
    const params = new URLSearchParams();
    params.set("kind", subjectKind);
    params.set("pet_id", selectedPetId);
    if (tenantId?.trim()) params.set("tenant", tenantId.trim());
    params.set("entry", "dashboard_ble_companion");
    if (appBase) params.set("app_base", appBase);
    if (selectedTarget?.tag_id) params.set("tag_id", selectedTarget.tag_id);
    if (selectedTarget?.ble_mac) params.set("mac", selectedTarget.ble_mac);

    const appHref = `petidconnect://ble/scan?${params.toString()}`;
    const installFallback = `/install?next=${encodeURIComponent(appHref)}`;
    const fallbackHref = BLE_COMPANION_STORE_URL || installFallback;

    const logEvent = (
      event: "app_open_attempt" | "app_opened" | "store_fallback" | "install_page_fallback"
    ) => {
      void logGuardianBleAppEvent({
        event,
        subjectKind,
        petId: selectedPetId,
        tenantId,
        tagId: selectedTarget?.tag_id,
        bleMac: selectedTarget?.ble_mac,
      }).catch(() => {});
    };

    logEvent("app_open_attempt");
    const fallbackTimer = window.setTimeout(() => {
      logEvent(BLE_COMPANION_STORE_URL ? "store_fallback" : "install_page_fallback");
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
    window.setTimeout(() => setIsOpening(false), 1400);
  };

  if (subjects.length === 0) {
    return (
      <Card className="rounded-[28px] border border-slate-200 bg-white shadow-app">
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center gap-2 text-indigo-700">
            <Bluetooth className="h-5 w-5" aria-hidden />
            <h2 className="text-base font-black text-slate-900">BLE 동행 앱</h2>
          </div>
          <p className="text-sm font-semibold leading-relaxed text-slate-600">{emptyRegisterHint}</p>
        </CardContent>
      </Card>
    );
  }

  const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
  const tagsWithMac = targets.filter((t) => t.ble_mac);
  const hasLinkedTags = targets.length > 0;

  return (
    <Card className="rounded-[28px] border border-indigo-100 bg-white shadow-app">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5 text-indigo-600" aria-hidden />
            <h2 className="text-base font-black text-slate-900">BLE 동행 앱 연결</h2>
          </div>
          <p className="text-[12px] font-semibold leading-relaxed text-slate-500">
            등록된 태그의 BLE MAC을 동행 앱이 스캔해 근접·이탈 기록을 서버로 보냅니다. NFC 즉시 연락과
            함께 쓰는 옵션 기능이에요.
          </p>
        </div>

        {!hasLinkedTags ? (
          <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              연결된 NFC 태그가 없어요. 먼저{" "}
              <Link href={`/dashboard/${subjectKind}/nfc${tenantQs}`} className="underline text-amber-950">
                태그 연결
              </Link>
              을 완료해 주세요.
            </span>
          </div>
        ) : tagsWithMac.length === 0 ? (
          <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold text-amber-900">
            <Radio className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              연결된 태그에 BLE MAC이 아직 없어요. 운영자에게 출고·인벤토리 등록을 요청하거나 관리자
              화면에서 MAC을 입력해 주세요.
            </span>
          </div>
        ) : (
          <div className="flex gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-[12px] font-bold text-indigo-900">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
            <span>
              BLE MAC이 등록된 태그 {tagsWithMac.length}개 — 동행 앱에서 스캔할 수 있어요.
            </span>
          </div>
        )}

        <label className="block space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">관리 대상</span>
          <select
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
            disabled={tenantSuspended}
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {tagsForPet.length > 0 ? (
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">태그</span>
            <select
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              disabled={tenantSuspended}
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900"
            >
              {tagsForPet.map((t) => (
                <option key={t.tag_id} value={t.tag_id}>
                  {t.tag_id}
                  {t.ble_mac ? ` · ${t.ble_mac}` : " · MAC 미등록"}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {!isAndroid && (
          <p className="text-[11px] font-bold leading-snug text-slate-500">
            동행 앱은 Android를 우선 지원합니다. iOS는 추후 제공 예정이에요.
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            disabled={tenantSuspended || isOpening || !selectedTarget?.ble_mac || !isAndroid}
            onClick={openCompanionApp}
            className={cn(
              "min-h-12 flex-1 rounded-2xl font-black",
              "bg-indigo-600 hover:bg-indigo-500 text-white"
            )}
          >
            <Smartphone className="mr-2 h-4 w-4" aria-hidden />
            {isOpening ? "앱 여는 중…" : "동행 앱으로 BLE 스캔 시작"}
          </Button>
          <Link
            href={`/dashboard/${subjectKind}/scans${tenantQs}`}
            className={cn(
              "inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-slate-50"
            )}
          >
            <ScanLine className="mr-2 h-4 w-4" aria-hidden />
            스캔·BLE 기록
          </Link>
        </div>

        {message ? (
          <p
            className={cn(
              "text-[12px] font-bold leading-relaxed",
              message.type === "success" ? "text-indigo-800" : "text-rose-700"
            )}
          >
            {message.text}
          </p>
        ) : null}

        <p className="text-[10px] font-semibold leading-relaxed text-slate-400">
          개발 단계에서는 Play 스토어 대신 APK 직접 설치를 사용할 수 있어요. 자세한 계약은{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-[10px]">docs/BLE_COMPANION_APP_SPEC.md</code>
          를 참고하세요.
        </p>
      </CardContent>
    </Card>
  );
}
