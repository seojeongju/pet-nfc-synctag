"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  LocateFixed,
  MapPin,
  Navigation2,
  RefreshCw,
  TrainFront,
} from "lucide-react";
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

type GeoPhase = "idle" | "locating" | "ready" | "denied" | "unsupported";

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
      const q = new URLSearchParams({ lat: String(lat), lng: String(lng), limit: "8" });
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

  const nearest = stations[0] ?? null;
  const others = stations.slice(1);
  const isLoading = phase === "locating" || (phase === "ready" && loadingStations && stations.length === 0);

  return (
    <section className="space-y-4" aria-labelledby="wf-nearby-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="wf-nearby-heading"
          className="flex items-center gap-2 text-sm font-black text-slate-900"
        >
          <TrainFront className="h-5 w-5 text-indigo-600" aria-hidden />
          가까운 지하철역
        </h2>
        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} aria-hidden />
          위치 다시 찾기
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
            <LocateFixed className="h-4 w-4 animate-pulse" aria-hidden />
            GPS로 근처 지하철역을 찾는 중…
          </p>
        </div>
      ) : null}

      {phase === "unsupported" ? (
        <Alert tone="amber">HTTPS 스마트폰 브라우저에서 이용해 주세요. 이 환경에서는 GPS를 쓸 수 없습니다.</Alert>
      ) : null}

      {phase === "denied" ? (
        <Alert tone="amber">
          <p>지하철역 찾기에 위치 권한이 필요합니다.</p>
          <button
            type="button"
            onClick={requestLocation}
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white"
          >
            위치 허용 후 다시 시도
          </button>
        </Alert>
      ) : null}

      {fetchError ? (
        <Alert tone="rose">
          {fetchError}
          {fetchError.includes("wayfinder_stations") ? (
            <span className="mt-1 block text-[11px] font-medium opacity-90">
              운영 DB 마이그레이션(0036·0037) 적용 여부를 확인해 주세요.
            </span>
          ) : null}
        </Alert>
      ) : null}

      {nearest && phase === "ready" && !loadingStations ? (
        <div className="overflow-hidden rounded-[24px] border-2 border-indigo-200 bg-gradient-to-br from-indigo-600 to-violet-700 p-[1px] shadow-lg shadow-indigo-200/40">
          <div className="rounded-[22px] bg-white p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">가장 가까운 역</p>
            <p className="mt-1 text-xl font-black text-slate-900">{nearest.name}</p>
            {nearest.lines ? (
              <p className="mt-0.5 text-xs font-bold text-slate-500">{nearest.lines}</p>
            ) : null}
            <p className="mt-2 text-sm font-black text-indigo-600">약 {nearest.distanceLabel}</p>
            <Link
              href={`/wayfinder/stations/${encodeURIComponent(nearest.id)}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.99]"
            >
              <Navigation2 className="h-5 w-5" aria-hidden />
              이 역으로 이동 안내
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}

      {others.length > 0 ? (
        <div className="space-y-2">
          <p className="px-1 text-[11px] font-black uppercase tracking-widest text-slate-400">다른 근처 역</p>
          <ul className="space-y-2" aria-label="다른 근처 지하철역">
            {others.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/wayfinder/stations/${encodeURIComponent(s.id)}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/20 active:scale-[0.99]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-indigo-600">
                    <MapPin className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-900">{s.name}</span>
                    {s.lines ? (
                      <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">{s.lines}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[11px] font-black text-indigo-600">{s.distanceLabel}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {phase === "ready" && !loadingStations && !fetchError && stations.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
          근처에 등록된 파일럿 역이 없습니다. 서비스 지역을 확대 중입니다.
        </p>
      ) : null}
    </section>
  );
}

function Alert({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "amber" | "rose";
}) {
  const cls =
    tone === "amber"
      ? "border-amber-100 bg-amber-50 text-amber-950"
      : "border-rose-100 bg-rose-50 text-rose-950";
  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold leading-relaxed", cls)}>
      {children}
    </div>
  );
}
