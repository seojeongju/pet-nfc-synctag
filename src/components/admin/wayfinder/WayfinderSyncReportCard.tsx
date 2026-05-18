"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import type { WayfinderSyncReport } from "@/lib/wayfinder/sync-accessibility-report";

function formatSyncedAt(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function WayfinderSyncReportCard() {
  const [report, setReport] = useState<WayfinderSyncReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/wayfinder/sync-report", { credentials: "include" });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = (await res.json()) as { report?: WayfinderSyncReport };
        setReport(data.report ?? null);
      } catch {
        setError("리포트를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminCard variant="section" className="space-y-4 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <BarChart3 className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-sm font-black text-slate-900">동기화 현황</h2>
          <p className="text-xs font-semibold text-slate-600">
            D1 편의시설 캐시·Cron 배치 진행 상태입니다.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          불러오는 중…
        </p>
      ) : error ? (
        <p className="text-sm font-semibold text-amber-800">{error}</p>
      ) : report ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-bold text-slate-500">마지막 동기화</dt>
            <dd className="font-black text-slate-900">{formatSyncedAt(report.lastSyncedAt)}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">시설 행 수</dt>
            <dd className="font-black text-slate-900">{report.facilityRowCount.toLocaleString("ko-KR")}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">시설 있는 역</dt>
            <dd className="font-black text-slate-900">
              {report.stationsWithFacilities.toLocaleString("ko-KR")} /{" "}
              {report.metroStationTotal.toLocaleString("ko-KR")}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">시설 0건 역(추정)</dt>
            <dd className="font-black text-slate-900">{report.stationsEmptyCount.toLocaleString("ko-KR")}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">Cron 다음 offset</dt>
            <dd className="font-mono text-xs font-bold text-slate-800">{report.metroCronOffset}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">파일럿 역(D1)</dt>
            <dd className="font-black text-slate-900">{report.pilotStationCount}</dd>
          </div>
        </dl>
      ) : null}
      <p className="text-[11px] font-semibold text-slate-500">
        주기 동기화: Cloudflare Cron →{" "}
        <code className="font-mono">GET /api/cron/wayfinder-sync-accessibility</code> (Authorization: Bearer
        CRON_SECRET)
      </p>
    </AdminCard>
  );
}
