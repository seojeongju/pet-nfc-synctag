"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Play, Zap } from "lucide-react";
import { SEOUL_COMPANION_APP } from "@/lib/wayfinder/accessible-routing-links";
import {
  openSeoulCompanionApp,
  readSeoulCompanionInstalledFlag,
} from "@/lib/wayfinder/seoul-companion-app-launch";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function WayfinderSeoulCompanionLaunchButton({ className }: Props) {
  const [installed, setInstalled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInstalled(readSeoulCompanionInstalledFlag());
    setHydrated(true);
  }, []);

  const handlePrimaryClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      openSeoulCompanionApp({
        assumeInstalled: installed,
        onOpened: () => setInstalled(true),
      });
    },
    [installed]
  );

  const primaryLabel = !hydrated
    ? "서울동행맵 열기"
    : installed
      ? "서울동행앱 실행"
      : "서울동행맵 설치";

  const PrimaryIcon = installed ? Zap : Play;

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={handlePrimaryClick}
        className="flex w-full min-h-12 items-center justify-center gap-2.5 rounded-xl border-b-4 border-sky-900/40 bg-white px-4 py-3.5 text-sm font-black text-sky-900 shadow-md transition hover:bg-sky-50 active:scale-[0.99]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
          <PrimaryIcon
            className={cn("h-4 w-4 text-sky-800", !installed && "fill-sky-800")}
            aria-hidden
          />
        </span>
        {primaryLabel}
        {installed ? null : (
          <ExternalLink className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        )}
      </button>

      {!installed && hydrated ? (
        <p className="px-1 text-center text-[10px] font-semibold text-sky-100/90">
          버튼을 누르면 앱이 설치되어 있을 때 실행되고, 없으면 스토어로 이동합니다.
        </p>
      ) : null}

      {installed ? (
        <p className="px-1 text-center text-[10px] font-semibold text-sky-100/90">
          이 기기에서 이전에 앱을 연 적이 있어 실행으로 표시됩니다.
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
