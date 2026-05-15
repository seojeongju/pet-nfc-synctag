"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type KakaoMap = {
  relayout: () => void;
  setCenter: (p: unknown) => void;
};

type KakaoMapsNS = {
  maps: {
    load: (cb: () => void) => void;
    LatLng: new (a: number, b: number) => unknown;
    Map: new (el: HTMLElement, o: { center: unknown; level: number }) => unknown;
    Marker: new (o: Record<string, unknown>) => unknown;
  };
};

function kakaoSdk(): KakaoMapsNS | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { kakao?: KakaoMapsNS }).kakao;
}

type Props = {
  latitude: number;
  longitude: number;
  label: string;
  className?: string;
};

export function WayfinderStationMap({ latitude, longitude, label, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const [appKey, setAppKey] = useState<string | null>(null);
  const [configState, setConfigState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [mapReady, setMapReady] = useState(false);
  const [mapScriptError, setMapScriptError] = useState(false);

  useEffect(() => {
    let c = false;
    void (async () => {
      try {
        const res = await fetch("/api/kakao-map-config", { cache: "no-store" });
        if (!res.ok) throw new Error("cfg");
        const d = (await res.json()) as { appKey: string | null };
        if (c) return;
        if (d.appKey) {
          setAppKey(d.appKey);
          setConfigState("ready");
        } else {
          setConfigState("missing");
        }
      } catch {
        if (!c) setConfigState("error");
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const initMap = useCallback(() => {
    const K = kakaoSdk();
    if (!K || !containerRef.current || mapRef.current) return;
    K.maps.load(() => {
      const K2 = kakaoSdk();
      if (!K2 || !containerRef.current) return;
      const center = new K2.maps.LatLng(latitude, longitude);
      const map = new K2.maps.Map(containerRef.current, { center, level: 3 }) as unknown as KakaoMap;
      mapRef.current = map;
      new K2.maps.Marker({ position: center, map, title: label });
      [0, 80, 200].forEach((ms) =>
        setTimeout(() => {
          map.relayout();
          map.setCenter(new K2.maps.LatLng(latitude, longitude));
        }, ms)
      );
      setMapReady(true);
    });
  }, [latitude, longitude, label]);

  useEffect(() => {
    if (!mapReady || !containerRef.current) return;
    const ro = new ResizeObserver(() => mapRef.current?.relayout());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [mapReady]);

  const shell = "overflow-hidden rounded-2xl border border-slate-200 shadow-inner";

  if (configState === "loading") {
    return (
      <div className={cn(shell, "flex min-h-[220px] items-center justify-center bg-slate-50 text-[12px] font-bold text-slate-500", className)}>
        지도를 불러오는 중…
      </div>
    );
  }

  if (configState === "missing" || configState === "error" || mapScriptError) {
    return (
      <div
        className={cn(
          shell,
          "flex min-h-[160px] flex-col items-center justify-center gap-1 bg-amber-50/80 px-4 py-6 text-center text-xs font-semibold text-amber-900",
          className
        )}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        지도를 표시할 수 없습니다. 아래 「카카오맵에서 보기」를 이용해 주세요.
      </div>
    );
  }

  return (
    <div className={cn(shell, className)}>
      {appKey ? (
        <Script
          strategy="afterInteractive"
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`}
          onLoad={() => {
            setMapScriptError(false);
            setTimeout(() => initMap(), 0);
          }}
          onError={() => setMapScriptError(true)}
        />
      ) : null}
      <div
        ref={containerRef}
        className="min-h-[220px] h-[min(42vh,320px)] w-full bg-slate-100"
        role="application"
        aria-label={`${label} 위치 지도`}
      />
      {!mapReady ? (
        <p className="px-3 py-2 text-[11px] font-semibold text-slate-500">지도를 불러오는 중…</p>
      ) : null}
    </div>
  );
}
