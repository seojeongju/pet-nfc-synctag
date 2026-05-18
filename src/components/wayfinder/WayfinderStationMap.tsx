"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { AlertTriangle } from "lucide-react";
import type { FacilityMapPoint } from "@/lib/wayfinder/facility-map-layout";
import { cn } from "@/lib/utils";

type KakaoLatLng = unknown;
type KakaoMap = {
  relayout: () => void;
  setCenter: (p: KakaoLatLng) => void;
  setLevel: (n: number) => void;
  panTo: (p: KakaoLatLng) => void;
};
type KakaoMarker = { setMap: (map: unknown) => void };
type KakaoInfoWindow = { open: (map: KakaoMap, marker: KakaoMarker) => void };

type KakaoMapsNS = {
  maps: {
    load: (cb: () => void) => void;
    LatLng: new (a: number, b: number) => KakaoLatLng;
    Map: new (el: HTMLElement, o: { center: KakaoLatLng; level: number }) => KakaoMap;
    Marker: new (o: Record<string, unknown>) => KakaoMarker;
    InfoWindow: new (o: { content: string; removable?: boolean }) => KakaoInfoWindow;
    event: {
      addListener: (target: unknown, type: string, handler: () => void) => void;
    };
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
  facilities?: FacilityMapPoint[];
  selectedFacilityId?: string | null;
  onSelectFacility?: (id: string | null) => void;
  className?: string;
};

export function WayfinderStationMap({
  latitude,
  longitude,
  label,
  facilities = [],
  selectedFacilityId = null,
  onSelectFacility,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const stationMarkerRef = useRef<KakaoMarker | null>(null);
  const facilityMarkersRef = useRef<Array<{ id: string; marker: KakaoMarker; infowindow: KakaoInfoWindow }>>(
    []
  );
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

  const clearFacilityMarkers = useCallback(() => {
    for (const f of facilityMarkersRef.current) {
      f.marker.setMap(null);
    }
    facilityMarkersRef.current = [];
  }, []);

  const syncFacilityMarkers = useCallback(() => {
    const K = kakaoSdk();
    const map = mapRef.current;
    if (!K || !map) return;

    clearFacilityMarkers();

    for (const f of facilities) {
      const pos = new K.maps.LatLng(f.latitude, f.longitude);
      const marker = new K.maps.Marker({
        position: pos,
        map,
        title: f.label,
        opacity: f.id === selectedFacilityId ? 1 : 0.85,
        zIndex: f.id === selectedFacilityId ? 10 : 2,
      });
      const approxNote = f.mapApproximate
        ? '<p style="margin:4px 0 0;font-size:11px;color:#b45309">대략 위치(역 중심 기준)</p>'
        : "";
      const infowindow = new K.maps.InfoWindow({
        content: `<div style="padding:6px 8px;font-size:12px;font-weight:700;max-width:200px">${f.label}${approxNote}</div>`,
        removable: true,
      });
      K.maps.event.addListener(marker, "click", () => {
        onSelectFacility?.(f.id);
        infowindow.open(map, marker);
      });
      facilityMarkersRef.current.push({ id: f.id, marker, infowindow });
    }
  }, [clearFacilityMarkers, facilities, onSelectFacility, selectedFacilityId]);

  const initMap = useCallback(() => {
    const K = kakaoSdk();
    if (!K || !containerRef.current || mapRef.current) return;
    K.maps.load(() => {
      const K2 = kakaoSdk();
      if (!K2 || !containerRef.current) return;
      const center = new K2.maps.LatLng(latitude, longitude);
      const map = new K2.maps.Map(containerRef.current, { center, level: 3 });
      mapRef.current = map;
      stationMarkerRef.current = new K2.maps.Marker({
        position: center,
        map,
        title: label,
        zIndex: 1,
      });
      [0, 80, 200].forEach((ms) =>
        setTimeout(() => {
          map.relayout();
          map.setCenter(new K2.maps.LatLng(latitude, longitude));
        }, ms)
      );
      setMapReady(true);
    });
  }, [label, latitude, longitude]);

  useEffect(() => {
    if (!mapReady) return;
    syncFacilityMarkers();
  }, [mapReady, syncFacilityMarkers]);

  useEffect(() => {
    const K = kakaoSdk();
    const map = mapRef.current;
    if (!K || !map || !selectedFacilityId) return;
    const entry = facilityMarkersRef.current.find((m) => m.id === selectedFacilityId);
    const point = facilities.find((f) => f.id === selectedFacilityId);
    if (entry && point) {
      const pos = new K.maps.LatLng(point.latitude, point.longitude);
      map.panTo(pos);
      map.setLevel(2);
      entry.infowindow.open(map, entry.marker);
    }
  }, [facilities, selectedFacilityId, mapReady]);

  useEffect(() => {
    if (!mapReady || !containerRef.current) return;
    const ro = new ResizeObserver(() => mapRef.current?.relayout());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [mapReady]);

  const shell = "overflow-hidden rounded-2xl border border-slate-200 shadow-inner";

  if (configState === "loading") {
    return (
      <div
        className={cn(
          shell,
          "flex min-h-[220px] items-center justify-center bg-slate-50 text-[12px] font-bold text-slate-500",
          className
        )}
      >
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
        aria-label={`${label} 위치·편의시설 지도`}
      />
      {!mapReady ? (
        <p className="px-3 py-2 text-[11px] font-semibold text-slate-500">지도를 불러오는 중…</p>
      ) : facilities.length > 0 ? (
        <p className="px-3 py-2 text-[10px] font-semibold text-slate-500">
          마커를 누르면 시설을 선택합니다. 주황 안내는 좌표가 없어 역 근처에 표시된 위치입니다.
        </p>
      ) : null}
    </div>
  );
}

