"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { type SubjectKind } from "@/lib/subject-kind";
import { Card } from "@/components/ui/card";
import {
  Activity,
  RefreshCw,
  AlertTriangle,
  LocateFixed,
  Compass,
  Navigation,
  Siren,
  Play,
  Pause,
  RotateCcw,
  Grid3X3,
  Wifi,
  WifiOff,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationData {
  lat: number;
  lng: number;
  timestamp: string;
  type: string;
}

interface SubjectWithLocation {
  id: string;
  name: string;
  breed?: string | null;
  photo_url?: string | null;
  is_lost?: number | null;
  location: LocationData | null;
}

interface LiveLocationMapProps {
  subjects: SubjectWithLocation[];
  subjectKind: SubjectKind;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type KakaoLatLng = unknown;
type KakaoMarker = { setMap: (map: unknown) => void; setPosition?: (pos: KakaoLatLng) => void };
type KakaoBounds = { extend: (pos: KakaoLatLng) => void };
type KakaoCircle = { setMap: (map: unknown) => void };
type KakaoMarkerClusterer = {
  clear: () => void;
  addMarkers: (markers: KakaoMarker[]) => void;
  getClusters?: () => Array<{ getCenter: () => KakaoLatLng }>;
};
type KakaoMapInstance = {
  setBounds: (bounds: KakaoBounds) => void;
  setCenter?: (pos: KakaoLatLng) => void;
  panTo?: (pos: KakaoLatLng) => void;
  setLevel?: (level: number) => void;
  getLevel?: () => number;
  getCenter?: () => { getLat: () => number; getLng: () => number };
  setHeading?: (heading: number) => void;
};

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Map: new (container: HTMLElement, options: unknown) => KakaoMapInstance;
        Marker: new (options: unknown) => KakaoMarker;
        Circle: new (options: unknown) => KakaoCircle;
        MarkerClusterer?: new (options: unknown) => KakaoMarkerClusterer;
        LatLngBounds: new () => KakaoBounds;
        InfoWindow: new (options: unknown) => { open: (map: unknown, marker: unknown) => void };
        event: {
          addListener: (target: unknown, type: string, handler: (...args: unknown[]) => void) => void;
        };
      };
    };
  }
}

export default function LiveLocationMap({
  subjects,
  subjectKind,
  onRefresh,
  isRefreshing,
}: LiveLocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<KakaoMapInstance | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const clustererRef = useRef<KakaoMarkerClusterer | null>(null);
  const markerEntryRef = useRef<Array<{ subjectId: string; marker: KakaoMarker; pos: KakaoLatLng }>>([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  /** CI 빌드에 잘못된 키가 박혀도 Cloudflare 런타임 env를 쓰도록 API에서 조회 */
  const [appKey, setAppKey] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [scriptLoadFailed, setScriptLoadFailed] = useState(false);
  const [followMyLocation, setFollowMyLocation] = useState(false);
  const [compassMode, setCompassMode] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [showLostOnly, setShowLostOnly] = useState(false);
  const [useClustering, setUseClustering] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackItems, setPlaybackItems] = useState<Array<{ subjectId: string; name: string; ts: number; label: string }>>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);
  const playbackTimerRef = useRef<number | null>(null);
  const autoRefreshTimerRef = useRef<number | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "paused">("online");
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [avgRefreshMs, setAvgRefreshMs] = useState<number | null>(null);
  const [refreshErrorCount, setRefreshErrorCount] = useState(0);
  const [refreshTimeoutCount, setRefreshTimeoutCount] = useState(0);
  const telemetrySentAtRef = useRef<number>(0);
  const myLocationMarkerRef = useRef<KakaoMarker | null>(null);
  const myAccuracyCircleRef = useRef<KakaoCircle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastMyLatLngRef = useRef<KakaoLatLng | null>(null);
  const mapStateStorageKeyRef = useRef(`live-map-state:${subjectKind}`);
  /** 좁은 화면에서 좌측 관제 패널만 접기 (우측 도구는 상시 노출) */
  const [mapLeftOpen, setMapLeftOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/kakao-map-config", { cache: "no-store" });
        if (!res.ok) throw new Error("config fetch failed");
        const data = (await res.json()) as { appKey: string | null };
        if (cancelled) return;
        if (data.appKey) {
          setAppKey(data.appKey);
          setConfigStatus("ready");
        } else {
          setAppKey(null);
          setConfigStatus("missing");
        }
      } catch {
        if (!cancelled) setConfigStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // SDK 초기화 및 지도 생성
  const initMap = () => {
    if (!window.kakao || !mapContainerRef.current || mapInstanceRef.current) return;
    const container = mapContainerRef.current;

    window.kakao.maps.load(() => {
      let centerLat = 37.5665;
      let centerLng = 126.978;
      let level = 3;
      try {
        const saved = localStorage.getItem(mapStateStorageKeyRef.current);
        if (saved) {
          const parsed = JSON.parse(saved) as { centerLat?: number; centerLng?: number; level?: number };
          if (typeof parsed.centerLat === "number" && typeof parsed.centerLng === "number") {
            centerLat = parsed.centerLat;
            centerLng = parsed.centerLng;
          }
          if (typeof parsed.level === "number") {
            level = parsed.level;
          }
        }
      } catch {
        // noop
      }
      const options = {
        center: new window.kakao.maps.LatLng(centerLat, centerLng),
        level,
      };
      mapInstanceRef.current = new window.kakao.maps.Map(container, options);
      if (window.kakao.maps.MarkerClusterer) {
        clustererRef.current = new window.kakao.maps.MarkerClusterer({
          map: mapInstanceRef.current,
          averageCenter: true,
          minLevel: 6,
        });
        window.kakao.maps.event.addListener(clustererRef.current, "clusterclick", (cluster: unknown) => {
          const c = cluster as { getCenter?: () => KakaoLatLng };
          const center = c.getCenter?.();
          if (!center || !mapInstanceRef.current) return;
          if (mapInstanceRef.current.setCenter) {
            mapInstanceRef.current.setCenter(center);
          } else if (mapInstanceRef.current.panTo) {
            mapInstanceRef.current.panTo(center);
          }
          if (mapInstanceRef.current.getLevel && mapInstanceRef.current.setLevel) {
            const current = mapInstanceRef.current.getLevel();
            mapInstanceRef.current.setLevel(Math.max(1, current - 1));
          }
        });
      }
      window.kakao.maps.event.addListener(mapInstanceRef.current, "dragstart", () => {
        setFollowMyLocation(false);
      });
      window.kakao.maps.event.addListener(mapInstanceRef.current, "idle", () => {
        const map = mapInstanceRef.current;
        if (!map?.getCenter || !map?.getLevel) return;
        const center = map.getCenter();
        localStorage.setItem(
          mapStateStorageKeyRef.current,
          JSON.stringify({
            centerLat: center.getLat(),
            centerLng: center.getLng(),
            level: map.getLevel(),
          })
        );
      });
      setMapReady(true);
    });
  };

  const moveToMyLocation = (usePan = true) => {
    if (!mapInstanceRef.current || !lastMyLatLngRef.current) return;
    if (usePan && mapInstanceRef.current.panTo) {
      mapInstanceRef.current.panTo(lastMyLatLngRef.current);
    } else if (mapInstanceRef.current.setCenter) {
      mapInstanceRef.current.setCenter(lastMyLatLngRef.current);
    }
  };

  // 마커 업데이트
  useEffect(() => {
    if (!sdkLoaded || !mapReady || !mapInstanceRef.current) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    markerEntryRef.current = [];
    clustererRef.current?.clear();

    const bounds = new window.kakao.maps.LatLngBounds();
    let hasLocation = false;
    const visibleSubjects = showLostOnly ? subjects.filter((s) => Boolean(s.is_lost)) : subjects;

    visibleSubjects.forEach((subject) => {
      if (!subject.location) return;

      hasLocation = true;
      const pos = new window.kakao.maps.LatLng(subject.location.lat, subject.location.lng);
      bounds.extend(pos);

      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: pos,
        title: subject.name,
      });

      // 인포윈도우 커스텀
      const content = `
        <div style="padding:15px; min-width:180px; font-family: 'Outfit', -apple-system, sans-serif;">
            <div style="font-weight:900; font-size:14px; color:#0f172a; margin-bottom:4px;">${subject.name}</div>
            <div style="font-size:11px; color:#64748b; font-weight:700;">${subject.location.type} · ${new Date(subject.location.timestamp).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
            ${subject.is_lost ? '<div style="margin-top:8px; font-size:10px; color:#ffffff; font-weight:900; background:#f43f5e; padding:3px 8px; border-radius:8px; display:inline-block; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);">실종 신고 중</div>' : ''}
            ${subject.is_lost ? '<div style="margin-top:6px; font-size:10px; color:#be123c; font-weight:900;">긴급 관찰 대상</div>' : ''}
        </div>
      `;

      const infowindow = new window.kakao.maps.InfoWindow({
        content: content,
        removable: true
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
      markerEntryRef.current.push({ subjectId: subject.id, marker, pos });
    });

    if (useClustering && clustererRef.current) {
      clustererRef.current.addMarkers(markersRef.current);
    } else {
      markersRef.current.forEach((marker) => marker.setMap(mapInstanceRef.current));
    }

    if (hasLocation) {
      mapInstanceRef.current.setBounds(bounds);
    }
  }, [subjects, sdkLoaded, mapReady, showLostOnly, useClustering]);

  useEffect(() => {
    const visibleSubjects = (showLostOnly ? subjects.filter((s) => Boolean(s.is_lost)) : subjects).filter((s) => s.location);
    const items = visibleSubjects
      .map((s) => ({
        subjectId: s.id,
        name: s.name,
        ts: new Date(s.location?.timestamp ?? 0).getTime(),
        label: new Date(s.location?.timestamp ?? "").toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      }))
      .sort((a, b) => a.ts - b.ts);
    setPlaybackItems(items);
    setPlaybackIndex(0);
    setPlaybackActive(false);
  }, [subjects, showLostOnly]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => setIsDocumentVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    setIsOnline(window.navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!playbackActive || playbackItems.length === 0) {
      if (playbackTimerRef.current != null) {
        window.clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      return;
    }
    playbackTimerRef.current = window.setInterval(() => {
      setPlaybackIndex((prev) => {
        const next = prev + 1;
        if (next >= playbackItems.length) {
          setPlaybackActive(false);
          return prev;
        }
        return next;
      });
    }, playbackSpeed === 2 ? 800 : 1500);
    return () => {
      if (playbackTimerRef.current != null) {
        window.clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };
  }, [playbackActive, playbackItems.length, playbackSpeed]);

  useEffect(() => {
    if (!mapInstanceRef.current || playbackItems.length === 0) return;
    const current = playbackItems[playbackIndex];
    if (!current) return;
    const entry = markerEntryRef.current.find((m) => m.subjectId === current.subjectId);
    if (!entry) return;
    if (mapInstanceRef.current.panTo) {
      mapInstanceRef.current.panTo(entry.pos);
    } else if (mapInstanceRef.current.setCenter) {
      mapInstanceRef.current.setCenter(entry.pos);
    }
  }, [playbackIndex, playbackItems]);

  useEffect(() => {
    if (!onRefresh || !autoRefreshEnabled) {
      setConnectionStatus(isOnline ? "paused" : "offline");
      if (autoRefreshTimerRef.current != null) {
        window.clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
      return;
    }
    if (!isOnline) {
      setConnectionStatus("offline");
      if (autoRefreshTimerRef.current != null) {
        window.clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
      return;
    }

    const intervalMs = !isDocumentVisible ? 60000 : followMyLocation ? 8000 : 15000;
    setConnectionStatus("online");

    const runRefresh = () => {
      const start = Date.now();
      const timeoutMs = 12000;
      const timeoutPromise = new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("refresh-timeout")), timeoutMs)
      );
      Promise.race([Promise.resolve(onRefresh()), timeoutPromise])
        .then(() => {
          const elapsed = Date.now() - start;
          setLastRefreshAt(new Date().toISOString());
          setRefreshCount((prev) => {
            const next = prev + 1;
            setAvgRefreshMs((prevAvg) => {
              if (prevAvg == null) return elapsed;
              return Math.round((prevAvg * (next - 1) + elapsed) / next);
            });
            return next;
          });
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.message === "refresh-timeout") {
            setRefreshTimeoutCount((prev) => prev + 1);
          } else {
            setRefreshErrorCount((prev) => prev + 1);
          }
          // 새로고침 실패는 상위 UI에서 처리하므로 여기서는 상태만 유지
        });
    };

    runRefresh();
    autoRefreshTimerRef.current = window.setInterval(runRefresh, intervalMs);

    return () => {
      if (autoRefreshTimerRef.current != null) {
        window.clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [onRefresh, autoRefreshEnabled, isOnline, isDocumentVisible, followMyLocation]);

  useEffect(() => {
    const now = Date.now();
    if (now - telemetrySentAtRef.current < 30000) return;
    telemetrySentAtRef.current = now;

    const payload = {
      subjectKind,
      refreshCount,
      refreshErrorCount,
      refreshTimeoutCount,
      avgRefreshMs,
      autoRefreshEnabled,
      connectionStatus,
      followMyLocation,
      compassMode,
      useClustering,
      playbackActive,
      playbackSpeed,
      pageVisible: isDocumentVisible,
      at: new Date().toISOString(),
    };

    try {
      fetch("/api/diag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // telemetry는 비핵심 경로이므로 무시
      });
    } catch {
      // telemetry는 비핵심 경로이므로 무시
    }
  }, [
    subjectKind,
    refreshCount,
    refreshErrorCount,
    refreshTimeoutCount,
    avgRefreshMs,
    autoRefreshEnabled,
    connectionStatus,
    followMyLocation,
    compassMode,
    useClustering,
    playbackActive,
    playbackSpeed,
    isDocumentVisible,
  ]);

  useEffect(() => {
    if (!sdkLoaded || !mapReady || !mapInstanceRef.current || !window.kakao || !navigator.geolocation) return;
    const map = mapInstanceRef.current;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoDenied(false);
        setGeoMessage(null);
        const latLng = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        lastMyLatLngRef.current = latLng;

        if (!myLocationMarkerRef.current) {
          myLocationMarkerRef.current = new window.kakao.maps.Marker({
            position: latLng,
            map,
            title: "내 위치",
          });
        } else {
          if (myLocationMarkerRef.current.setPosition) {
            myLocationMarkerRef.current.setPosition(latLng);
          } else {
            myLocationMarkerRef.current.setMap(null);
            myLocationMarkerRef.current = new window.kakao.maps.Marker({
              position: latLng,
              map,
              title: "내 위치",
            });
          }
        }

        if (myAccuracyCircleRef.current) {
          myAccuracyCircleRef.current.setMap(null);
        }
        myAccuracyCircleRef.current = new window.kakao.maps.Circle({
          center: latLng,
          radius: Math.max(10, Math.min(pos.coords.accuracy || 30, 300)),
          strokeWeight: 1,
          strokeColor: "#14b8a6",
          strokeOpacity: 0.35,
          strokeStyle: "solid",
          fillColor: "#14b8a6",
          fillOpacity: 0.12,
          map,
        });

        if (followMyLocation) {
          moveToMyLocation(true);
          if (map.setLevel) {
            map.setLevel(3);
          }
        }

        if (compassMode && map.setHeading && pos.coords.heading != null) {
          map.setHeading(pos.coords.heading);
        } else if (!compassMode && map.setHeading) {
          map.setHeading(0);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoDenied(true);
          setGeoMessage("위치 권한이 꺼져 있어 현재 위치 기능을 사용할 수 없습니다.");
        } else {
          setGeoMessage("현재 위치를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setMap(null);
      }
      if (myAccuracyCircleRef.current) {
        myAccuracyCircleRef.current.setMap(null);
      }
    };
  }, [sdkLoaded, mapReady, followMyLocation, compassMode]);

  const onClickMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage("이 기기/브라우저에서는 위치 기능을 지원하지 않습니다.");
      return;
    }
    if (!lastMyLatLngRef.current) {
      setGeoMessage("현재 위치를 확인 중입니다. 잠시 후 다시 눌러 주세요.");
      return;
    }
    moveToMyLocation(true);
    setFollowMyLocation(true);
  };

  const leftStatusStack = (
    <>
      <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-md">
        <div className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
        <span className="text-[10px] font-black uppercase leading-none tracking-widest text-slate-800">실시간 위치 관제</span>
      </div>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[10px] font-black shadow-sm backdrop-blur-md",
          connectionStatus === "online"
            ? "border-teal-100 bg-white/90 text-teal-600"
            : connectionStatus === "offline"
              ? "border-rose-100 bg-white/90 text-rose-600"
              : "border-slate-100 bg-white/90 text-slate-500"
        )}
      >
        {connectionStatus === "offline" ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
        {connectionStatus === "online" ? "연결 정상" : connectionStatus === "offline" ? "오프라인" : "자동 갱신 일시정지"}
      </div>
      <button
        type="button"
        onClick={() => setShowLostOnly((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[10px] font-black shadow-sm backdrop-blur-md transition-all",
          showLostOnly
            ? "border-rose-200 bg-white/90 text-rose-600"
            : "border-slate-100 bg-white/90 text-slate-500 hover:border-rose-100 hover:text-rose-500"
        )}
        title="실종 대상만 보기"
        aria-label="실종 대상만 보기 토글"
      >
        <Siren className="h-3.5 w-3.5" />
        {showLostOnly ? "실종만 보는 중" : "전체 보기"}
      </button>
      <button
        type="button"
        onClick={() => setUseClustering((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[10px] font-black shadow-sm backdrop-blur-md transition-all",
          useClustering
            ? "border-teal-200 bg-white/90 text-teal-600"
            : "border-slate-100 bg-white/90 text-slate-500 hover:border-teal-100 hover:text-teal-500"
        )}
        title="마커 클러스터링"
        aria-label="마커 클러스터링 토글"
      >
        <Grid3X3 className="h-3.5 w-3.5" />
        {useClustering ? "클러스터 ON" : "클러스터 OFF"}
      </button>
      <button
        type="button"
        onClick={() => setAutoRefreshEnabled((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-[10px] font-black shadow-sm backdrop-blur-md transition-all",
          autoRefreshEnabled
            ? "border-teal-200 bg-white/90 text-teal-600"
            : "border-slate-100 bg-white/90 text-slate-500 hover:border-teal-100 hover:text-teal-500"
        )}
        title="자동 갱신 토글"
        aria-label="자동 갱신 토글"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", autoRefreshEnabled && "animate-spin")} />
        {autoRefreshEnabled ? "자동 갱신 ON" : "자동 갱신 OFF"}
      </button>
    </>
  );

  const mapToolButtons = (
    <div className="flex flex-col gap-1.5 md:gap-2">
      <button
        type="button"
        onClick={onRefresh}
        className={cn(
          "flex h-9 w-9 touch-manipulation items-center justify-center rounded-xl bg-white text-slate-600 shadow-md ring-1 ring-slate-200/80 transition-all hover:text-teal-500 active:scale-95 md:h-10 md:w-10 md:rounded-2xl md:shadow-lg md:ring-0",
          isRefreshing && "animate-spin"
        )}
        title="새로고침"
        aria-label="지도 데이터 새로고침"
      >
        <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />
      </button>
      <button
        type="button"
        onClick={onClickMyLocation}
        className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-xl bg-white text-slate-600 shadow-md ring-1 ring-slate-200/80 transition-all hover:text-teal-500 active:scale-95 md:h-10 md:w-10 md:rounded-2xl md:shadow-lg md:ring-0"
        title="현재 위치로 이동"
        aria-label="현재 위치로 이동"
      >
        <LocateFixed className="h-3.5 w-3.5 md:h-4 md:w-4" />
      </button>
      <button
        type="button"
        onClick={() => setFollowMyLocation((v) => !v)}
        className={cn(
          "flex h-9 w-9 touch-manipulation items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-slate-200/80 transition-all active:scale-95 md:h-10 md:w-10 md:rounded-2xl md:shadow-lg md:ring-0",
          followMyLocation ? "text-teal-600 ring-2 ring-teal-200" : "text-slate-600 hover:text-teal-500"
        )}
        title="자동 추적"
        aria-label="내 위치 자동 추적 토글"
      >
        <Navigation className="h-3.5 w-3.5 md:h-4 md:w-4" />
      </button>
      <button
        type="button"
        onClick={() => setCompassMode((v) => !v)}
        className={cn(
          "flex h-9 w-9 touch-manipulation items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-slate-200/80 transition-all active:scale-95 md:h-10 md:w-10 md:rounded-2xl md:shadow-lg md:ring-0",
          compassMode ? "text-teal-600 ring-2 ring-teal-200" : "text-slate-600 hover:text-teal-500"
        )}
        title="나침반 모드"
        aria-label="나침반 모드 토글"
      >
        <Compass className="h-3.5 w-3.5 md:h-4 md:w-4" />
      </button>
    </div>
  );

  const telemetryPanel =
    lastRefreshAt || refreshCount > 0 ? (
      <div className="rounded-2xl border border-slate-100 bg-white/95 px-3 py-2 shadow-sm backdrop-blur max-md:break-words">
        <p className="text-[10px] font-bold text-slate-500">
          관측: {refreshCount}회 갱신
          {avgRefreshMs != null ? ` · 평균 ${avgRefreshMs}ms` : ""}
        </p>
        <p className="text-[10px] font-bold text-slate-400">
          실패 {refreshErrorCount}회 · 타임아웃 {refreshTimeoutCount}회
        </p>
        {lastRefreshAt ? (
          <p className="text-[10px] font-bold text-slate-400">
            최근: {new Date(lastRefreshAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        ) : null}
      </div>
    ) : null;

  const playbackControlsRow = (
    <div className="flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-white/95 px-2 py-2 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => {
          if (playbackItems.length === 0) return;
          setPlaybackActive((v) => !v);
        }}
        disabled={playbackItems.length === 0}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition",
          playbackItems.length === 0 ? "cursor-not-allowed opacity-40" : "hover:bg-slate-100",
          playbackActive && "text-teal-600"
        )}
        title="이벤트 재생"
        aria-label="이벤트 재생 토글"
      >
        {playbackActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={() => {
          setPlaybackActive(false);
          setPlaybackIndex(0);
        }}
        disabled={playbackItems.length === 0}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition",
          playbackItems.length === 0 ? "cursor-not-allowed opacity-40" : "hover:bg-slate-100"
        )}
        title="재생 초기화"
        aria-label="재생 초기화"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setPlaybackSpeed((v) => (v === 1 ? 2 : 1))}
        disabled={playbackItems.length === 0}
        className={cn(
          "h-8 rounded-xl px-2 text-[10px] font-black text-slate-600 transition",
          playbackItems.length === 0 ? "cursor-not-allowed opacity-40" : "hover:bg-slate-100",
          playbackSpeed === 2 && "text-teal-600"
        )}
        title="재생 속도 변경"
        aria-label="재생 속도 변경"
      >
        {playbackSpeed}x
      </button>
    </div>
  );

  /** 좁은 우측 레일용 — 한 줄로 수납 */
  const playbackControlsRowCompact = (
    <div className="flex items-center justify-center gap-0.5 rounded-xl border border-slate-100 bg-white/95 px-1 py-1.5 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => {
          if (playbackItems.length === 0) return;
          setPlaybackActive((v) => !v);
        }}
        disabled={playbackItems.length === 0}
        className={cn(
          "flex h-7 w-7 touch-manipulation items-center justify-center rounded-lg text-slate-600 transition",
          playbackItems.length === 0 ? "cursor-not-allowed opacity-40" : "hover:bg-slate-100",
          playbackActive && "text-teal-600"
        )}
        title="이벤트 재생"
        aria-label="이벤트 재생 토글"
      >
        {playbackActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={() => {
          setPlaybackActive(false);
          setPlaybackIndex(0);
        }}
        disabled={playbackItems.length === 0}
        className={cn(
          "flex h-7 w-7 touch-manipulation items-center justify-center rounded-lg text-slate-600 transition",
          playbackItems.length === 0 ? "cursor-not-allowed opacity-40" : "hover:bg-slate-100"
        )}
        title="재생 초기화"
        aria-label="재생 초기화"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setPlaybackSpeed((v) => (v === 1 ? 2 : 1))}
        disabled={playbackItems.length === 0}
        className={cn(
          "h-7 min-w-[1.75rem] touch-manipulation rounded-lg px-1 text-[9px] font-black text-slate-600 transition",
          playbackItems.length === 0 ? "cursor-not-allowed opacity-40" : "hover:bg-slate-100",
          playbackSpeed === 2 && "text-teal-600"
        )}
        title="재생 속도 변경"
        aria-label="재생 속도 변경"
      >
        {playbackSpeed}x
      </button>
    </div>
  );

  const playbackInfoPanel =
    playbackItems.length > 0 ? (
      <div className="rounded-2xl border border-slate-100 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        <p className="text-[10px] font-bold text-slate-500">
          재생 {Math.min(playbackIndex + 1, playbackItems.length)} / {playbackItems.length}
        </p>
        <p className="text-[11px] font-black leading-snug text-slate-700">
          {playbackItems[Math.min(playbackIndex, playbackItems.length - 1)]?.name} ·{" "}
          {playbackItems[Math.min(playbackIndex, playbackItems.length - 1)]?.label}
        </p>
      </div>
    ) : null;

  const playbackInfoPanelCompact =
    playbackItems.length > 0 ? (
      <div className="rounded-xl border border-slate-100 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur">
        <p className="text-[9px] font-bold text-slate-500">
          {Math.min(playbackIndex + 1, playbackItems.length)}/{playbackItems.length}
        </p>
        <p className="line-clamp-2 text-[9px] font-black leading-tight text-slate-700">
          {playbackItems[Math.min(playbackIndex, playbackItems.length - 1)]?.name}
        </p>
      </div>
    ) : null;

  return (
    <Card className="relative overflow-hidden rounded-[40px] border-none bg-white shadow-app">
      {mapLeftOpen && (
        <button
          type="button"
          className="absolute bottom-0 left-0 right-[7.5rem] top-0 z-[21] bg-slate-900/35 md:hidden"
          aria-label="패널 닫기"
          onClick={() => {
            setMapLeftOpen(false);
          }}
        />
      )}

      {/* 좌측: 데스크톱 항상 표시 */}
      <div className="absolute left-5 top-5 z-[22] hidden flex-col gap-2 md:flex">{leftStatusStack}</div>

      {/* 좌측: 모바일 접기/펼치기 */}
      <div className="md:hidden">
        {!mapLeftOpen ? (
          <button
            type="button"
            className="absolute left-1 top-1/2 z-[23] flex h-11 w-9 -translate-y-1/2 touch-manipulation items-center justify-center rounded-r-xl border border-slate-200 bg-white/95 text-slate-600 shadow-lg ring-1 ring-slate-200/60 active:scale-95"
            aria-expanded={false}
            aria-label="관제·필터 패널 열기"
            onClick={() => {
              setMapLeftOpen(true);
            }}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        ) : (
          <div
            className="animate-in fade-in slide-in-from-left-2 absolute left-2 top-3 z-[23] flex max-h-[min(72vh,calc(100%-1.5rem))] w-[min(17.5rem,calc(100%-9.5rem))] flex-col gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-xl duration-200"
            role="dialog"
            aria-label="관제·필터"
            aria-modal="true"
          >
            <div className="mb-1 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-800">관제·필터</span>
              <button
                type="button"
                className="flex h-8 w-8 touch-manipulation items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                onClick={() => setMapLeftOpen(false)}
                aria-label="패널 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {leftStatusStack}
            {telemetryPanel}
          </div>
        )}
      </div>

      {/* 우측: 데스크톱 */}
      <div className="absolute right-5 top-5 z-[22] hidden md:block">{mapToolButtons}</div>

      {/* 우측: 모바일 — 고정 레일(겹침 방지). 백드롭은 이 영역을 비움 */}
      <div className="pointer-events-none md:hidden">
        <div className="pointer-events-auto absolute right-2 top-3 z-[24] flex max-h-[min(78vh,calc(100%-0.75rem))] w-[7rem] flex-col items-center gap-1.5 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl ring-1 ring-slate-200/60">
          <span className="w-full select-none border-b border-slate-100 pb-1.5 text-center text-[9px] font-black uppercase tracking-wider text-slate-500">
            도구·재생
          </span>
          {mapToolButtons}
          {playbackControlsRowCompact}
          {playbackInfoPanelCompact}
        </div>
      </div>

      {(followMyLocation || compassMode || geoMessage) && (
        <div className="absolute bottom-4 left-4 right-4 z-[22] rounded-2xl border border-slate-100 bg-white/95 px-3 py-2 shadow-sm backdrop-blur max-md:bottom-[max(1rem,env(safe-area-inset-bottom,0px))] max-md:left-2 max-md:right-[calc(7.5rem+0.75rem)]">
          <p className="text-[11px] font-bold leading-relaxed text-slate-600">
            {followMyLocation ? "내 위치 자동 추적 중" : "내 위치 자동 추적 꺼짐"}
            {compassMode ? " · 나침반 모드 ON" : ""}
            {geoMessage ? ` · ${geoMessage}` : ""}
            {geoDenied ? " · 브라우저 위치 권한을 허용해 주세요." : ""}
          </p>
        </div>
      )}

      {/* 재생·관측: 데스크톱만 지도 모서리 고정 */}
      <div className="absolute bottom-4 right-4 z-[22] hidden md:flex md:items-center md:gap-1.5">{playbackControlsRow}</div>

      <div className="absolute bottom-16 right-4 z-[22] hidden md:block">{playbackInfoPanel}</div>

      <div className="absolute bottom-4 left-4 z-[22] hidden md:block">{telemetryPanel}</div>

      <div ref={mapContainerRef} className="h-[350px] w-full bg-slate-50 transition-all" />

      {(!sdkLoaded || configStatus !== "ready" || scriptLoadFailed) && (
        <div className="absolute inset-0 z-10 bg-slate-50/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-[24px] bg-white shadow-xl flex items-center justify-center text-teal-500 mb-6">
                <Activity className="w-8 h-8 animate-pulse" />
            </div>
            <p className="text-base font-black text-slate-900 leading-tight">
                {configStatus === "loading"
                  ? "지도 설정을 불러오는 중입니다..."
                  : "지도를 불러오는 중입니다..."}
            </p>
            {configStatus === "missing" ? (
                <div className="mt-4 px-6 py-4 bg-amber-50 rounded-2xl border border-amber-100 max-w-[80%]">
                    <div className="flex items-center gap-2 text-amber-600 mb-2 justify-center">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-black uppercase">API Key Missing</span>
                    </div>
                    <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                        카카오맵 API 키(
                        NEXT_PUBLIC_KAKAO_MAP_JS_KEY 또는 NEXT_PUBLIC_KAKAO_MAP_KEY)가 설정되지 않았습니다.<br />
                        Cloudflare Pages 환경 변수를 확인해 주세요.
                    </p>
                </div>
            ) : configStatus === "error" ? (
                <div className="mt-4 px-6 py-4 bg-rose-50 rounded-2xl border border-rose-100 max-w-[80%]">
                    <p className="text-[10px] text-rose-700 font-bold leading-relaxed">
                        지도 설정을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.
                    </p>
                </div>
            ) : scriptLoadFailed ? (
                <div className="mt-4 px-6 py-4 bg-amber-50 rounded-2xl border border-amber-100 max-w-[80%]">
                    <div className="flex items-center gap-2 text-amber-600 mb-2 justify-center">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-black uppercase">SDK 로드 실패</span>
                    </div>
                    <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                        카카오 JavaScript 키·JavaScript SDK 도메인(현재 사이트 주소)이 일치하는지 확인해 주세요.
                    </p>
                </div>
            ) : configStatus === "ready" && appKey ? (
                <p className="text-[11px] text-slate-400 font-bold mt-2 font-outfit uppercase tracking-widest">Initialising SDK</p>
            ) : null}
        </div>
      )}

      {appKey && configStatus === "ready" ? (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=clusterer`}
          onLoad={() => {
            setScriptLoadFailed(false);
            setSdkLoaded(true);
            setTimeout(initMap, 200);
          }}
          onError={() => setScriptLoadFailed(true)}
        />
      ) : null}
    </Card>
  );
}
