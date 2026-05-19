"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Play, Zap } from "lucide-react";
import { SEOUL_COMPANION_APP } from "@/lib/wayfinder/accessible-routing-links";
import {
  detectInAppBrowser,
  detectSeoulCompanionPlatform,
  launchSeoulCompanionAppFromBrowser,
  readSeoulCompanionInstalledFlag,
  type SeoulCompanionPlatform,
} from "@/lib/wayfinder/seoul-companion-app-launch";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

const primaryButtonClassName =
  "flex w-full min-h-12 items-center justify-center gap-2.5 rounded-xl border-b-4 border-sky-900/40 bg-white px-4 py-3.5 text-sm font-black text-sky-900 shadow-md transition hover:bg-sky-50 active:scale-[0.99]";

export function WayfinderSeoulCompanionLaunchButton({ className }: Props) {
  const [installedHint, setInstalledHint] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [platform, setPlatform] = useState<SeoulCompanionPlatform>("other");
  const [inAppBrowser, setInAppBrowser] = useState(false);

  useEffect(() => {
    setPlatform(detectSeoulCompanionPlatform());
    setInAppBrowser(detectInAppBrowser());
    setInstalledHint(readSeoulCompanionInstalledFlag());
    setHydrated(true);
  }, []);

  const isMobile = platform === "android" || platform === "ios";

  const handlePrimaryClick = useCallback(() => {
    launchSeoulCompanionAppFromBrowser({
      onOpened: () => setInstalledHint(true),
    });
  }, []);

  const primaryLabel = !hydrated
    ? "서울동행맵 열기"
    : isMobile
      ? "서울동행앱 실행"
      : installedHint
        ? "서울동행앱 실행"
        : "서울동행맵 설치";

  const PrimaryIcon = isMobile || installedHint ? Zap : Play;

  return (
    <div className={cn("space-y-2", className)}>
      {hydrated && inAppBrowser ? (
        <p className="rounded-lg bg-amber-500/20 px-2.5 py-2 text-[10px] font-semibold leading-snug text-amber-50">
          카카오톡·인스타 등 앱 안 브라우저에서는 실행이 막힐 수 있습니다. 메뉴에서 「Chrome으로
          열기」를 선택한 뒤 다시 시도해 주세요.
        </p>
      ) : null}

      <button type="button" onClick={handlePrimaryClick} className={primaryButtonClassName}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
          <PrimaryIcon className="h-4 w-4 text-sky-800" aria-hidden />
        </span>
        {primaryLabel}
      </button>

      {hydrated && isMobile ? (
        <p className="px-1 text-center text-[10px] font-semibold leading-snug text-sky-100/90">
          설치된 서울동행맵이 바로 열립니다. 앱이 없으면 아래 Play·iOS·원스토어에서 설치하세요.
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <a
          href={SEOUL_COMPANION_APP.playStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-white/30 bg-white/10 px-2 py-2 text-[10px] font-black text-white hover:bg-white/20"
        >
          Play
          <ExternalLink className="h-3 w-3 opacity-80" aria-hidden />
        </a>
        <a
          href={SEOUL_COMPANION_APP.appStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-white/30 bg-white/10 px-2 py-2 text-[10px] font-black text-white hover:bg-white/20"
        >
          iOS
          <ExternalLink className="h-3 w-3 opacity-80" aria-hidden />
        </a>
        <a
          href={SEOUL_COMPANION_APP.oneStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-white/30 bg-white/10 px-2 py-2 text-[10px] font-black text-white hover:bg-white/20"
        >
          원스토어
          <ExternalLink className="h-3 w-3 opacity-80" aria-hidden />
        </a>
      </div>
    </div>
  );
}
