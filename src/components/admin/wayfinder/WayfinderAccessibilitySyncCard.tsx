"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Accessibility, ExternalLink, Loader2, RefreshCw, TrainFront } from "lucide-react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { cn } from "@/lib/utils";

export type WayfinderSyncStationOption = { id: string; name: string };

type SyncResultItem = {
  stationId: string;
  stationName: string;
  upserted: number;
  operations: { operation: string; itemCount: number; skipped?: string }[];
  errors: string[];
};

type SyncMeta = {
  scope: string;
  total: number;
  offset: number;
  batchSize: number;
  nextOffset: number | null;
  done: boolean;
};

type SyncResponse = {
  ok?: boolean;
  error?: string;
  detail?: string;
  hint?: string;
  results?: SyncResultItem[];
  meta?: SyncMeta;
  summary?: { facilitiesUpserted?: number; stationsWithErrors?: number };
};

type SyncStats = {
  pilotStationCount: number;
  metroStationCount: number;
  metroBatchDefault: number;
};

type Props = {
  stations: WayfinderSyncStationOption[];
  initialMetroStationCount?: number;
};

export function WayfinderAccessibilitySyncCard({
  stations,
  initialMetroStationCount,
}: Props) {
  const [stationId, setStationId] = useState(stations[0]?.id ?? "");
  const [customId, setCustomId] = useState("");
  const [loading, setLoading] = useState<"pilot" | "metro" | "one" | null>(null);
  const [lastResponse, setLastResponse] = useState<SyncResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [stats, setStats] = useState<SyncStats | null>(
    initialMetroStationCount != null
      ? {
          pilotStationCount: stations.length,
          metroStationCount: initialMetroStationCount,
          metroBatchDefault: 8,
        }
      : null
  );
  const [metroProgress, setMetroProgress] = useState<{
    processed: number;
    total: number;
    facilities: number;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/wayfinder/sync-accessibility", {
          credentials: "include",
        });
        if (res.ok) {
          const data = (await res.json()) as SyncStats;
          setStats(data);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const runSync = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/wayfinder/sync-accessibility", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as SyncResponse;
    if (!res.ok) {
      throw new Error(
        data.error ? `${data.error}${data.detail ? `: ${data.detail}` : ""}` : `HTTP ${res.status}`
      );
    }
    return data;
  }, []);

  const runPilotSync = useCallback(async () => {
    setLoading("pilot");
    setFetchError(null);
    setLastResponse(null);
    setMetroProgress(null);
    try {
      const data = await runSync({ scope: "pilot" });
      setLastResponse(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }, [runSync]);

  const runMetroFullSync = useCallback(async () => {
    setLoading("metro");
    setFetchError(null);
    setLastResponse(null);
    const batchSize = stats?.metroBatchDefault ?? 8;
    let offset = 0;
    let total = stats?.metroStationCount ?? 0;
    let allResults: SyncResultItem[] = [];
    let facilitiesTotal = 0;

    setMetroProgress({ processed: 0, total, facilities: 0 });

    try {
      for (;;) {
        const data = await runSync({ scope: "metro", offset, batchSize });
        if (data.meta) {
          total = data.meta.total;
        }
        const batchResults = data.results ?? [];
        allResults = allResults.concat(batchResults);
        facilitiesTotal += data.summary?.facilitiesUpserted ?? batchResults.reduce((n, r) => n + r.upserted, 0);
        const processed = data.meta?.done
          ? total
          : (data.meta?.nextOffset ?? offset + batchResults.length);
        setMetroProgress({ processed, total, facilities: facilitiesTotal });

        if (data.meta?.done) {
          setLastResponse({
            ok: true,
            results: allResults,
            meta: data.meta,
            summary: {
              facilitiesUpserted: facilitiesTotal,
              stationsWithErrors: allResults.filter((r) => r.errors.length > 0).length,
            },
          });
          break;
        }
        offset = data.meta?.nextOffset ?? offset + batchSize;
      }
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : String(e));
      if (allResults.length > 0) {
        setLastResponse({ ok: true, results: allResults, summary: { facilitiesUpserted: facilitiesTotal } });
      }
    } finally {
      setLoading(null);
      setMetroProgress(null);
    }
  }, [runSync, stats?.metroBatchDefault, stats?.metroStationCount]);

  const runOneSync = useCallback(async () => {
    const effectiveId = customId.trim() || stationId.trim();
    if (!effectiveId) return;
    setLoading("one");
    setFetchError(null);
    setLastResponse(null);
    setMetroProgress(null);
    try {
      const data = await runSync({ stationId: effectiveId });
      setLastResponse(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }, [customId, stationId, runSync]);

  const metroCount = stats?.metroStationCount;
  const pilotCount = stats?.pilotStationCount ?? stations.length;
  const displayResults = lastResponse?.results ?? [];
  const showCompactResults = displayResults.length > 12;

  return (
    <div className="space-y-6">
      <AdminCard variant="section" className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
            <Accessibility className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-sm font-black text-slate-900">교통약자 편의시설 동기화</h2>
            <p className="text-xs font-semibold leading-relaxed text-slate-600">
              공공데이터포털 <strong className="text-slate-800">서울교통공사 교통약자이용정보</strong> API에서
              역별 시설을 D1에 저장합니다. GPS 근처 역 검색에 쓰는{" "}
              <strong className="text-slate-800">수도권 역 목록 전체</strong>를 동기화하려면 아래 「수도권 전체」를
              사용하세요.
            </p>
            <p className="text-[11px] font-semibold text-slate-500">
              D1 파일럿 등록 역 {pilotCount}개 · 수도권 고유 역명{" "}
              {metroCount != null ? `${metroCount}개` : "…"}
            </p>
          </div>

        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runMetroFullSync()}
            className={cn(
              "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
            )}
          >
            {loading === "metro" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            수도권 전체 역 동기화
            {metroCount != null ? ` (약 ${metroCount}역)` : ""}
          </button>
          {metroProgress ? (
            <p className="text-center text-xs font-bold text-indigo-800" role="status">
              진행 중… {metroProgress.processed}/{metroProgress.total}역 · 시설 {metroProgress.facilities}건
            </p>
          ) : null}
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runPilotSync()}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading === "pilot" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            D1 파일럿만 동기화 ({pilotCount}역)
          </button>
        </div>
        <p className="text-[11px] font-semibold leading-relaxed text-amber-800">
          전체 동기화는 API 호출이 많아 배치(역 {stats?.metroBatchDefault ?? 8}개씩)로 나눕니다. 완료까지 수 분 걸릴 수
          있으며, 공공데이터 일일 한도(개발계정 약 1만 건)에 유의하세요.
        </p>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">역 단위 동기화</p>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">파일럿 역 (D1)</span>
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              disabled={loading !== null || stations.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900"
            >
              {stations.length === 0 ? (
                <option value="">역 목록 없음</option>
              ) : (
                stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">또는 역 ID 직접 입력 (수도권 포함)</span>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="예: stn--107, seoul-station"
              disabled={loading !== null}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400"
            />
          </label>
          <button
            type="button"
            disabled={loading !== null || !(customId.trim() || stationId.trim())}
            onClick={() => void runOneSync()}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-black text-teal-800 hover:bg-teal-50 disabled:opacity-50 sm:w-auto"
          >
            {loading === "one" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <TrainFront className="h-4 w-4" aria-hidden />
            )}
            선택 역 1개 동기화
          </button>
        </div>
      </AdminCard>

      {fetchError ? (
        <AdminCard variant="subtle" className="border-rose-200 bg-rose-50/80 p-4">
          <p className="text-sm font-black text-rose-900">동기화 실패</p>
          <p className="mt-1 text-xs font-semibold text-rose-800">{fetchError}</p>
          {lastResponse?.hint ? (
            <p className="mt-2 text-xs font-semibold text-rose-700">{lastResponse.hint}</p>
          ) : null}
        </AdminCard>
      ) : null}

      {lastResponse?.ok && displayResults.length > 0 ? (
        <AdminCard variant="subtle" className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-teal-900">동기화 완료</p>
            {lastResponse.summary?.facilitiesUpserted != null ? (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-black text-teal-800">
                시설 {lastResponse.summary.facilitiesUpserted}건 · 역 {displayResults.length}개
              </span>
            ) : null}
          </div>
          {showCompactResults ? (
            <p className="text-xs font-semibold text-slate-600">
              {displayResults.length}개 역 처리됨
              {lastResponse.summary?.stationsWithErrors
                ? ` · 오류 ${lastResponse.summary.stationsWithErrors}역`
                : ""}
              . 상세는 D1·방문자 역 페이지에서 확인하세요.
            </p>
          ) : (
            <ul className="space-y-2">
              {displayResults.map((r) => (
                <li
                  key={r.stationId}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-black text-slate-900">
                      {r.stationName}{" "}
                      <span className="font-mono text-[10px] font-bold text-slate-500">({r.stationId})</span>
                    </span>
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-black text-teal-800">
                      시설 {r.upserted}건
                    </span>
                  </div>
                  {r.errors.length > 0 ? (
                    <p className="mt-1 text-[11px] text-amber-800">경고: {r.errors.join(" · ")}</p>
                  ) : null}
                  <Link
                    href={`/wayfinder/stations/${encodeURIComponent(r.stationId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-indigo-600 hover:text-indigo-800"
                  >
                    방문자 역 페이지 보기
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      ) : null}
    </div>
  );
}
