"use client";

import { useCallback, useState } from "react";
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

type SyncResponse = {
  ok?: boolean;
  error?: string;
  detail?: string;
  hint?: string;
  results?: SyncResultItem[];
};

type Props = {
  stations: WayfinderSyncStationOption[];
};

export function WayfinderAccessibilitySyncCard({ stations }: Props) {
  const [stationId, setStationId] = useState(stations[0]?.id ?? "");
  const [customId, setCustomId] = useState("");
  const [loading, setLoading] = useState<"all" | "one" | null>(null);
  const [lastResponse, setLastResponse] = useState<SyncResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const runSync = useCallback(async (body: Record<string, unknown>, mode: "all" | "one") => {
    setLoading(mode);
    setFetchError(null);
    setLastResponse(null);
    try {
      const res = await fetch("/api/admin/wayfinder/sync-accessibility", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as SyncResponse;
      if (!res.ok) {
        setFetchError(
          data.error ? `${data.error}${data.detail ? `: ${data.detail}` : ""}` : `HTTP ${res.status}`
        );
        setLastResponse(data);
        return;
      }
      setLastResponse(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }, []);

  const effectiveId = customId.trim() || stationId.trim();

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
              엘리베이터·휠체어리프트·장애인 화장실 등을 가져와 D1에 저장합니다. 방문자 역 상세(
              <span className="font-mono text-[10px]">/wayfinder/stations/…</span>)에 반영됩니다.
            </p>
            <p className="text-[11px] font-semibold text-amber-800">
              Cloudflare에 <span className="font-mono">PUBLIC_DATA_API_KEY</span>가 설정되어 있어야 합니다.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runSync({}, "all")}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border-b-4 border-teal-800 bg-teal-600 px-4 py-3 text-sm font-black text-white shadow-md transition active:scale-[0.99] hover:bg-teal-700 disabled:opacity-60 sm:min-w-[200px] sm:flex-none"
            )}
          >
            {loading === "all" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            파일럿 역 전체 동기화
          </button>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">역 단위 동기화</p>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-700">등록된 역 (D1 파일럿)</span>
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
            <span className="text-xs font-bold text-slate-700">또는 역 ID 직접 입력</span>
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
            disabled={loading !== null || !effectiveId}
            onClick={() => void runSync({ stationId: effectiveId }, "one")}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-black text-teal-800 hover:bg-teal-50 disabled:opacity-50 sm:w-auto"
          >
            {loading === "one" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <TrainFront className="h-4 w-4" aria-hidden />
            )}
            선택 역 동기화
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

      {lastResponse?.ok && lastResponse.results ? (
        <AdminCard variant="subtle" className="space-y-3 p-4">
          <p className="text-sm font-black text-teal-900">동기화 완료</p>
          <ul className="space-y-2">
            {lastResponse.results.map((r) => (
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
        </AdminCard>
      ) : null}
    </div>
  );
}
