"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { AlertTriangle, LocateFixed, MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type KakaoLatLng = { getLat: () => number; getLng: () => number };
type KakaoMap = {
  relayout: () => void;
  setCenter: (p: unknown) => void;
  setLevel: (n: number) => void;
  getCenter: () => KakaoLatLng;
  getLevel: () => number;
  panTo?: (p: unknown) => void;
};

type Props = {
  /** 폼 `fieldset disabled`와 맞춤 */
  disabled?: boolean;
  /** 기본 중심 (최초 1회) */
  defaultLat?: number;
  defaultLng?: number;
  defaultRadiusMeters?: number;
};

const SEOUL_LAT = 37.5665;
const SEOUL_LNG = 126.978;
const R_MIN = 10;
const R_MAX = 100_000;

function clampR(n: number): number {
  if (!Number.isFinite(n)) return 300;
  return Math.max(R_MIN, Math.min(R_MAX, Math.round(n)));
}

type KakaoMapsNS = {
  maps: {
    load: (cb: () => void) => void;
    LatLng: new (a: number, b: number) => unknown;
    Map: new (el: HTMLElement, o: { center: unknown; level: number }) => unknown;
    Marker: new (o: Record<string, unknown>) => unknown;
    Circle: new (o: Record<string, unknown>) => { setMap: (m: unknown) => void };
    event: { addListener: (t: unknown, e: string, h: (e: unknown) => void) => void };
  };
};

/** window.kakao — LiveLocationMap의 Window 병합과 충돌하지 않도록 국소 단언 */
function kakaoSdk(): KakaoMapsNS | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { kakao?: KakaoMapsNS }).kakao;
}

export function GeofenceMapPicker({
  disabled = false,
  defaultLat = SEOUL_LAT,
  defaultLng = SEOUL_LNG,
  defaultRadiusMeters = 300,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<{ setMap: (m: unknown) => void; setPosition?: (p: unknown) => void } | null>(null);
  const circleRef = useRef<{ setMap: (m: unknown) => void } | null>(null);
  const [appKey, setAppKey] = useState<string | null>(null);
  const [keySource, setKeySource] = useState<string | null>(null);
  const [configState, setConfigState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [mapReady, setMapReady] = useState(false);
  const [mapScriptError, setMapScriptError] = useState(false);
  const [siteOrigin, setSiteOrigin] = useState("");

  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [radius, setRadius] = useState(() => clampR(defaultRadiusMeters));
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const lastCenterKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setSiteOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    let c = false;
    void (async () => {
      try {
        const res = await fetch("/api/kakao-map-config", { cache: "no-store" });
        if (!res.ok) throw new Error("cfg");
        const d = (await res.json()) as { appKey: string | null; keySource?: string | null };
        if (c) return;
        if (d.appKey) {
          setAppKey(d.appKey);
          setKeySource(typeof d.keySource === "string" ? d.keySource : null);
          setConfigState("ready");
        } else {
          setAppKey(null);
          setKeySource(null);
          setConfigState("missing");
        }
      } catch {
        if (!c) {
          setKeySource(null);
          setConfigState("error");
        }
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const applyOverlay = useCallback(() => {
    const K = kakaoSdk();
    if (typeof window === "undefined" || !K || !mapRef.current) return;
    const pos = new K.maps.LatLng(lat, lng);
    if (markerRef.current?.setPosition) {
      markerRef.current.setPosition(pos);
    }
    const cKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (lastCenterKeyRef.current !== cKey) {
      lastCenterKeyRef.current = cKey;
      if (mapRef.current.panTo) {
        mapRef.current.panTo(pos);
      } else {
        mapRef.current.setCenter(pos);
      }
    }
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }
    circleRef.current = new K.maps.Circle({
      center: pos,
      radius: radius,
      strokeWeight: 2,
      strokeColor: "#0d9488",
      strokeOpacity: 0.9,
      strokeStyle: "solid",
      fillColor: "#14b8a6",
      fillOpacity: 0.15,
      map: mapRef.current,
    });
  }, [lat, lng, radius]);

  const initMap = useCallback(() => {
    const K = kakaoSdk();
    if (!K || !containerRef.current || mapRef.current) return;
    K.maps.load(() => {
      if (!containerRef.current) return;
      const K2 = kakaoSdk();
      if (!K2) return;
      const center = new K2.maps.LatLng(lat, lng);
      const map = new K2.maps.Map(containerRef.current, {
        center,
        level: 5,
      }) as unknown as KakaoMap;
      mapRef.current = map;

      const pos = new K2.maps.LatLng(lat, lng);
      const marker = new K2.maps.Marker({ position: pos, map, draggable: !disabled }) as {
        setMap: (m: unknown) => void;
        setPosition?: (p: unknown) => void;
      };
      markerRef.current = marker;
      K2.maps.event.addListener(marker, "dragend", () => {
        if (disabled) return;
        const p = (marker as unknown as { getPosition: () => KakaoLatLng }).getPosition();
        setLat(p.getLat());
        setLng(p.getLng());
      });
      K2.maps.event.addListener(map, "click", (e: unknown) => {
        if (disabled) return;
        const p = (e as { latLng: KakaoLatLng }).latLng;
        setLat(p.getLat());
        setLng(p.getLng());
        if (marker.setPosition) marker.setPosition(p);
      });

      const relayout = () => {
        map.relayout();
        if (map.getCenter) {
          const c = map.getCenter();
          map.setCenter(new K2.maps.LatLng(c.getLat(), c.getLng()));
        }
      };
      [0, 80, 200, 500].forEach((ms) => setTimeout(relayout, ms));

      setMapReady(true);
    });
  }, [disabled, lat, lng]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !kakaoSdk()) return;
    applyOverlay();
  }, [lat, lng, radius, mapReady, applyOverlay]);

  const moveToGps = () => {
    if (disabled || !navigator.geolocation) {
      setGeoMsg("이 환경에서는 위치를 사용할 수 없습니다.");
      return;
    }
    const K = kakaoSdk();
    if (typeof window === "undefined" || !K) {
      setGeoMsg("지도가 아직 준비되지 않았습니다.");
      return;
    }
    setGeoMsg(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const nlat = p.coords.latitude;
        const nlng = p.coords.longitude;
        setLat(nlat);
        setLng(nlng);
        if (mapRef.current) {
          const pz = new K.maps.LatLng(nlat, nlng);
          if (mapRef.current.setCenter) mapRef.current.setCenter(pz);
          if (mapRef.current.setLevel) mapRef.current.setLevel(4);
        }
        if (markerRef.current && markerRef.current.setPosition) {
          markerRef.current.setPosition(new K.maps.LatLng(nlat, nlng));
        }
      },
      () => setGeoMsg("위치 권한을 허용하거나 잠시 후 다시 시도해 주세요."),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 }
    );
  };

  useEffect(() => {
    if (!mapReady || !containerRef.current) return;
    const ro = new ResizeObserver(() => mapRef.current?.relayout());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [mapReady]);

  return (
    <div className={cn("space-y-3", disabled && "pointer-events-none opacity-60")}>
      <input type="hidden" name="latitude" value={lat.toFixed(6)} readOnly />
      <input type="hidden" name="longitude" value={lng.toFixed(6)} readOnly />
      <input type="hidden" name="radius_meters" value={String(radius)} readOnly />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-sm font-bold text-slate-800">구역 중심 · 지도에서 탭하거나 마커를 드래그</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl gap-1.5"
            onClick={moveToGps}
            disabled={disabled}
          >
            <LocateFixed className="h-3.5 w-3.5" />
            현재 위치로
          </Button>
        </div>
        {geoMsg ? <p className="text-[11px] font-bold text-amber-700">{geoMsg}</p> : null}

        {configState === "loading" ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-500">
            지도 설정을 불러오는 중…
          </div>
        ) : configState === "error" ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-rose-900">
            <div className="mb-1 flex items-center gap-1.5 font-black text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              지도 설정 API를 불러오지 못했습니다
            </div>
            <p className="text-[11px] font-semibold leading-relaxed text-rose-800/90">
              잠시 후 새로고침하거나, 네트워크·배포 상태를 확인해 주세요.
            </p>
          </div>
        ) : configState === "missing" ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
            <div className="mb-1 flex items-center gap-1.5 font-black text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              지도를 쓰려면 Kakao Map JavaScript 키가 필요합니다
            </div>
            <p className="text-[11px] font-semibold leading-relaxed text-amber-800/90">
              아래에서 위도·경도·반경을 직접 입력하거나, Cloudflare Pages에{" "}
              <span className="font-mono">NEXT_PUBLIC_KAKAO_MAP_JS_KEY</span> 또는{" "}
              <span className="font-mono">KAKAO_MAP_JS_KEY</span>(동일 JavaScript 키)를 설정한 뒤 재배포해 주세요.
            </p>
          </div>
        ) : configState === "ready" && appKey && mapScriptError ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
            <div className="mb-1 flex items-center gap-1.5 font-black text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              카카오 지도 SDK를 불러오지 못했습니다
            </div>
            <p className="text-[11px] font-semibold leading-relaxed text-amber-800/90">
              Kakao 개발자 콘솔 → <strong>JavaScript 키</strong> 사용 여부와, <strong>플랫폼 Web 사이트 도메인</strong>에
              아래 주소가 등록돼 있는지 확인해 주세요.
            </p>
            <p className="mt-2 text-[10px] text-amber-900 font-black leading-relaxed">
              <strong>카카오맵 → 사용 설정 → 상태</strong>를 <strong>ON</strong>으로 설정해야 합니다. (신규 앱 필수)
            </p>
            {siteOrigin ? (
              <p className="mt-2 rounded-lg bg-white/80 px-2 py-1.5 text-center font-mono text-[10px] font-bold text-slate-800 break-all">
                {siteOrigin}
              </p>
            ) : null}
            <p className="mt-2 text-[10px] text-amber-800/90 font-semibold leading-relaxed">
              Pages 미리보기(<span className="font-mono">*.pages.dev</span>)에서는 해당 미리보기 URL의 호스트를 콘솔에
              따로 등록해야 합니다.
            </p>
            {keySource ? (
              <p className="mt-2 text-[10px] text-amber-900 font-bold leading-relaxed">
                사용 중인 환경 변수: <span className="font-mono">{keySource}</span> — 403이면 다른 이름에 잘못된 키가
                남아 있을 수 있으니 삭제하거나 모두 같은 JavaScript 키로 맞추세요.
              </p>
            ) : null}
          </div>
        ) : configState === "ready" && appKey ? (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`}
              onLoad={() => {
                setMapScriptError(false);
                setTimeout(() => initMap(), 0);
              }}
              onError={() => setMapScriptError(true)}
            />
            <div
              ref={containerRef}
              className="relative z-0 min-h-[260px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner h-[min(50vh,380px)]"
              role="application"
              aria-label="안심 구역 지도, 탭하여 중심 설정"
            />
            {!mapReady && (
              <p className="text-[11px] font-semibold text-slate-500">지도를 불러오는 중…</p>
            )}
          </>
        ) : null}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="geofence_radius">반경</Label>
            <span className="text-sm font-black text-teal-700">
              {radius < 1000 ? `${radius} m` : `${(radius / 1000).toFixed(radius % 1000 ? 1 : 0)} km`}
            </span>
          </div>
          <input
            id="geofence_radius"
            type="range"
            min={R_MIN}
            max={5000}
            step={10}
            value={Math.min(radius, 5000)}
            disabled={disabled}
            onChange={(e) => setRadius(clampR(Number(e.target.value)))}
            className="h-2 w-full cursor-pointer accent-teal-600"
          />
          {radius > 5000 && (
            <p className="text-[10px] font-bold text-slate-500">5km 초과: 아래 숫자로 조정</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {[100, 200, 300, 500, 1000, 2000, 5000].map((m) => (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => setRadius(m)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-black transition",
                  radius === m
                    ? "border-teal-500 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"
                )}
              >
                {m < 1000 ? `${m}m` : `${m / 1000}km`}
              </button>
            ))}
          </div>
          <div className="flex max-w-sm items-center gap-2">
            <span className="shrink-0 text-[10px] font-bold text-slate-500">직접 (m, 최대 100km)</span>
            <Input
              type="number"
              min={R_MIN}
              max={R_MAX}
              step={1}
              value={radius}
              disabled={disabled}
              onChange={(e) => setRadius(clampR(parseInt(e.target.value, 10) || R_MIN))}
              className="h-9 rounded-xl font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowManual((v) => !v)}
        className="text-[11px] font-bold text-slate-500 underline underline-offset-2 hover:text-teal-600"
        disabled={disabled}
      >
        {showManual ? "고급(직접입력) 닫기" : "고급: 위도·경도·반경(m) 직접입력"}
      </button>
      {showManual ? (
        <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-2">
          <p className="text-[10px] font-bold text-slate-500 sm:col-span-2">숫자를 바꾸면 위 지도/숨은 필드에 반영됩니다.</p>
          <div className="space-y-1">
            <Label htmlFor="manual_lat">위도</Label>
            <Input
              id="manual_lat"
              type="text"
              inputMode="decimal"
              value={String(lat)}
              disabled={disabled}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= -90 && n <= 90) setLat(n);
              }}
              className="h-11 rounded-2xl font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="manual_lng">경도</Label>
            <Input
              id="manual_lng"
              type="text"
              inputMode="decimal"
              value={String(lng)}
              disabled={disabled}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= -180 && n <= 180) setLng(n);
              }}
              className="h-11 rounded-2xl font-mono"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="manual_r">반경 (m)</Label>
            <Input
              id="manual_r"
              type="number"
              min={R_MIN}
              max={R_MAX}
              value={radius}
              disabled={disabled}
              onChange={(e) => setRadius(clampR(parseInt(e.target.value, 10) || R_MIN))}
              className="h-11 rounded-2xl"
            />
          </div>
        </div>
      ) : null}

      <p className="text-[10px] font-bold text-slate-400">
        <MapPinned className="mb-0.5 mr-1 inline h-3.5 w-3.5 align-middle text-teal-500" />
        지도·마커로 설정한 값이 저장 시 전송됩니다. 반경은 10m ~ 100km 입니다.
      </p>
    </div>
  );
}
