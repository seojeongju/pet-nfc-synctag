"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Download, Smartphone } from "lucide-react";
import type { SubjectKind } from "@/lib/subject-kind";
import { usePwaInstall } from "@/components/pwa-install-context";

const GATE_KEY_PREFIX = "linku_finder_gate_";

export type FinderGatePayload = { v: 1; loc: boolean };

export function readFinderGateSession(tagId: string): FinderGatePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${GATE_KEY_PREFIX}${tagId}`);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<FinderGatePayload>;
    if (j.v === 1 && typeof j.loc === "boolean") return { v: 1, loc: j.loc };
    return null;
  } catch {
    return null;
  }
}

function introBodyLines(kind: SubjectKind): string[] {
  switch (kind) {
    case "child":
      return [
        "태그를 통해 이 화면에 오신 것, 정말 감사합니다.",
        "가족이 아이를 찾는 데 도움이 되도록, **대략적인 위치**를 전달하는 것에 동의해 주시겠어요?",
        "동의하지 않으셔도 **전화·문자**로 연락하는 것만으로도 큰 도움이 됩니다.",
      ];
    case "elder":
      return [
        "태그를 통해 이 화면에 오신 것, 정말 감사합니다.",
        "가족이 연락을 이어갈 수 있도록, **대략적인 위치**를 전달하는 것에 동의해 주시겠어요?",
        "동의하지 않으셔도 **전화·문자**로 연락하는 것만으로도 큰 도움이 됩니다.",
      ];
    case "luggage":
      return [
        "태그를 통해 이 화면에 오신 것, 감사합니다.",
        "분실·연락에 도움이 되도록 **대략적인 위치**를 전달하는 것에 동의해 주시겠어요?",
        "동의하지 않으셔도 **전화·문자**로 알리는 것만으로도 충분합니다.",
      ];
    case "gold":
      return [
        "태그를 통해 이 화면에 오신 것, 감사합니다.",
        "보호자에게 연락이 이어지도록 **대략적인 위치**를 전달하는 것에 동의해 주시겠어요?",
        "동의하지 않으셔도 **전화·문자**로 알리는 것만으로도 충분합니다.",
      ];
    case "pet":
    default:
      return [
        "인식표(태그)로 이 화면에 오신 것, 정말 감사합니다.",
        "가족이 반려동물을 찾는 데 도움이 되도록, **대략적인 위치**를 전달하는 것에 동의해 주시겠어요?",
        "동의하지 않으셔도 **전화·문자**로 연락하는 것만으로도 큰 도움이 됩니다.",
      ];
  }
}

function renderIntroLine(line: string) {
  const parts = line.split("**");
  return (
    <span className="leading-relaxed">
      {parts.map((chunk, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-slate-900 font-black">
            {chunk}
          </strong>
        ) : (
          <span key={i}>{chunk}</span>
        )
      )}
    </span>
  );
}

type Step = 1 | 2;

export function FinderTagConsentFlow({
  tagId,
  subjectKind,
  onComplete,
}: {
  tagId: string;
  subjectKind: SubjectKind;
  onComplete: (payload: FinderGatePayload) => void;
}) {
  const { isIOS, setPauseGlobalInstallChip, triggerInstallPrompt, deferredPrompt } = usePwaInstall();
  const [step, setStep] = useState<Step>(1);
  const [locationAgreed, setLocationAgreed] = useState<boolean | null>(null);

  useEffect(() => {
    setPauseGlobalInstallChip(true);
    return () => setPauseGlobalInstallChip(false);
  }, [setPauseGlobalInstallChip]);

  const finish = (loc: boolean) => {
    const payload: FinderGatePayload = { v: 1, loc };
    try {
      sessionStorage.setItem(`${GATE_KEY_PREFIX}${tagId}`, JSON.stringify(payload));
    } catch {
      /* private mode */
    }
    setPauseGlobalInstallChip(false);
    onComplete(payload);
  };

  const handleStep1Yes = () => {
    setLocationAgreed(true);
    setStep(2);
  };

  const handleStep1No = () => {
    setLocationAgreed(false);
    setStep(2);
  };

  const handleStep2Later = () => {
    if (locationAgreed === null) return;
    finish(locationAgreed);
  };

  const handleStep2Install = async () => {
    if (locationAgreed === null) return;
    if (isIOS) {
      finish(locationAgreed);
      return;
    }
    await triggerInstallPrompt();
    finish(locationAgreed);
  };

  const lines = introBodyLines(subjectKind);

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-black/55 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finder-consent-title"
    >
      <div className="w-full max-w-md rounded-[28px] bg-[#FDFCFB] shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <Heart className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p id="finder-consent-title" className="text-lg font-black leading-tight">
                {step === 1 ? "도움을 주실 수 있을까요?" : "홈 화면에 추가해 주실래요?"}
              </p>
              <p className="mt-1 text-[11px] font-bold text-white/85 leading-snug">
                {step === 1
                  ? "선택은 자유이며, 언제든 브라우저에서 철회할 수 있어요."
                  : "다음에 태그만 스쳐도 빠르게 이 화면을 열 수 있어요. (선택)"}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[min(52vh,420px)] overflow-y-auto">
          {step === 1 ? (
            <>
              <div className="space-y-3 text-[13px] font-semibold text-slate-600">
                {lines.map((line, idx) => (
                  <p key={idx}>{renderIntroLine(line)}</p>
                ))}
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  type="button"
                  className="h-12 w-full rounded-2xl bg-teal-600 font-black text-white hover:bg-teal-700"
                  onClick={handleStep1Yes}
                >
                  도움 주기 (위치 공유 동의)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-slate-200 font-bold text-slate-700"
                  onClick={handleStep1No}
                >
                  프로필만 보기 (전화·문자)
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2 text-[13px] font-semibold text-slate-600 leading-relaxed">
                <p>
                  링크유를 <strong className="text-slate-900">홈 화면(앱처럼)</strong>에 추가하면,
                  다음에 같은 태그로 들어올 때 더 빠르게 열 수 있어요.
                </p>
                {isIOS ? (
                  <p className="text-[12px] text-slate-500 font-medium">
                    Safari에서 <Smartphone className="inline h-4 w-4 align-text-bottom" aria-hidden />{" "}
                    공유 → <strong>홈 화면에 추가</strong>를 눌러 주세요.
                  </p>
                ) : deferredPrompt ? (
                  <p className="text-[12px] text-slate-500 font-medium">
                    아래 버튼을 누르면 브라우저 설치 창이 열릴 수 있어요.
                  </p>
                ) : (
                  <p className="text-[12px] text-slate-500 font-medium">
                    이 브라우저에서는 자동 설치 창이 지원되지 않을 수 있어요. 필요하면 메뉴에서
                    &apos;앱 설치&apos; 또는 &apos;홈 화면에 추가&apos;를 찾아 주세요.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 pt-1">
                {!isIOS && deferredPrompt ? (
                  <Button
                    type="button"
                    className="h-12 w-full rounded-2xl bg-slate-900 font-black text-white hover:bg-slate-800"
                    onClick={() => void handleStep2Install()}
                  >
                    <Download className="mr-2 inline h-4 w-4" aria-hidden />
                    설치·추가 화면 열기
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-slate-200 font-bold text-slate-700"
                  onClick={handleStep2Later}
                >
                  {isIOS || !deferredPrompt ? "알겠어요, 계속하기" : "나중에 할게요"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
