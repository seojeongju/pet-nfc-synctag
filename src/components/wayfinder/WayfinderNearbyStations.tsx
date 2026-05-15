"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, LocateFixed, MapPin, Navigation2, RefreshCw } from "lucide-react";
import { linkuCompanionMenuTitle } from "@/lib/wayfinder/copy";
import { cn } from "@/lib/utils";

type NearbyStation = {
  id: string;
  name: string;
  lines: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
  distanceLabel: string;
};

type GeoPhase = "idle" | "locating" | "ready" | "denied" | "unsupported" | "error";

export function WayfinderNearbyStations() {
  const [phase, setPhase] = useState<GeoPhase>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [stations, setStations] = useState<NearbyStation[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingStations, setLoadingStations] = useState(false);

  const loadNearby = useCallback(async (lat: number, lng: number) => {
    setLoadingStations(true);
    setFetchError(null);
    try {
      const q = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        limit: "8",
      });
      const res = await fetch(`/api/wayfinder/nearby-stations?${q}`, { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
        throw new Error(body.detail ?? body.error ?? "역 목록을 불러오지 못했습니다.");
      }
      const data = (await res.json()) as { stations: NearbyStation[] };
      setStations(data.stations ?? []);
    } catch (e) {
      setStations([]);
      setFetchError(e instanceof Error ? e.message : "역 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingStations(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPhase("unsupported");
      return;
    }
    setPhase("locating");
    setFetchError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setPhase("ready");
        void loadNearby(lat, lng);
      },
      () => setPhase("denied"),
      { enableHighAccuracy: true, maximumAge: 20000, timeout: 20000 }
    );
  }, [loadNearby]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const refresh = () => {
    if (coords) {
      setPhase("locating");
      void loadNearby(coords.lat, coords.lng).finally(() => setPhase("ready"));
      return;
    }
    requestLocation();
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="wf-nearby-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="wf-nearby-heading"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600"
          >
            <LocateFixed className="h-4 w-4" aria-hidden />
            근처 지하철역
          </h2>
          <button
            type="button"
            onClick={refresh}
            disabled={phase === "locating" || loadingStations}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", (phase === "locating" || loadingStations) && "animate-spin")} aria-hidden />
            다시 찾기
          </button>
        </div>

        {phase === "locating" || (phase === "ready" && loadingStations && stations.length === 0) ? (
          <p className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm font-semibold text-indigo-900">
            GPS로 위치를 확인한 뒤 가까운 역을 찾고 있습니다…
          </p>
        ) : null}

        {phase === "unsupported" ? (
          <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            이 브라우저에서는 위치(GPS)를 사용할 수 없습니다. HTTPS 환경의 스마트폰 브라우저를 이용해 주세요.
          </p>
        ) : null}

        {phase === "denied" ? (
          <div className="space-y-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            <p>위치 권한이 필요합니다. 브라우저 설정에서 위치 접근을 허용한 뒤 다시 시도해 주세요.</p>
            <button
              type="button"
              onClick={requestLocation}
              className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-xs font-black text-white"
            >
              위치 허용 후 다시 시도
            </button>
          </div>
        ) : null}

        {fetchError ? (
          <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
            {fetchError}
            {fetchError.includes("no such table") || fetchError.includes("wayfinder_stations") ? (
              <span className="mt-1 block text-xs font-medium">
                운영 DB에 마이그레이션 0036·0037 적용이 필요할 수 있습니다.
              </span>
            ) : null}
          </p>
        ) : null}
      </section>

      {stations.length > 0 ? (
        <ul className="space-y-2" aria-label="가까운 지하철역 목록">
          {stations.map((s) => (
            <li key={s.id}>
              <Link
                href={`/wayfinder/stations/${encodeURIComponent(s.id)}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30 active:scale-[0.99]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <MapPin className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black text-slate-900">{s.name}</span>
                  {s.lines ? (
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">{s.lines}</span>
                  ) : null}
                  <span className="mt-1 block text-[11px] font-black text-indigo-600">약 {s.distanceLabel}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : phase === "ready" && !loadingStations && !fetchError ? (
        <p className="text-sm font-semibold text-slate-600">근처에 등록된 파일럿 역이 없습니다.</p>
      ) : null}

      <section className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-[11px] font-semibold leading-relaxed text-slate-600">
        <p className="flex items-start gap-2">
          <Navigation2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden />
          <span>
            {linkuCompanionMenuTitle} 1단계: GPS로 가까운 역을 찾습니다. 역을 선택하면 카카오맵에서 위치·길찾기를
            이용할 수 있습니다. NFC 태그 안내는{" "}
            <span className="font-mono text-[10px] text-slate-700">/wayfinder/s/스팟-slug</span> 로 연결됩니다.
          </span>
        </p>
      </section>
    </div>
  );
}
