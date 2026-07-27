"use client";

import { AdminCard } from "@/components/admin/ui/AdminCard";
import type { TagOpsStats } from "@/types/admin-tags";

const cells: Array<{
  key: keyof TagOpsStats | "activationRate" | "nativeRecoveryRate7d";
  label: string;
  value: (s: TagOpsStats | undefined) => string | number;
  color: string;
  hint?: (s: TagOpsStats | undefined) => string | null;
}> = [
  { key: "totalCount", label: "전체", value: (s) => s?.totalCount ?? 0, color: "text-slate-900" },
  { key: "activeCount", label: "활성", value: (s) => s?.activeCount ?? 0, color: "text-teal-600" },
  { key: "unsoldCount", label: "미판매", value: (s) => s?.unsoldCount ?? 0, color: "text-amber-600" },
  {
    key: "activationRate",
    label: "활성률",
    value: (s) => `${s?.activationRate ?? 0}%`,
    color: "text-indigo-600",
  },
  { key: "recentLinks", label: "연결 7d", value: (s) => s?.recentLinks ?? 0, color: "text-teal-600" },
  {
    key: "failedRegistrations7d",
    label: "실패 7d",
    value: (s) => s?.failedRegistrations7d ?? 0,
    color: "text-rose-600",
  },
  {
    key: "nativeRecoveryRate7d",
    label: "복구율 7d",
    value: (s) => `${s?.nativeRecoveryRate7d ?? 0}%`,
    color: "text-violet-600",
    hint: (s) =>
      s
        ? `${s.nativeWriteSuccessFromWebFail7d ?? 0}/${s.webWriteFailures7d ?? 0}`
        : null,
  },
];

export function TagOpsKpiCards({ opsStats }: { opsStats: TagOpsStats }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {cells.map((c) => (
        <AdminCard key={c.key} variant="kpi" className="!p-3 sm:!p-3.5">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{c.label}</p>
          <p className={`mt-1 text-xl font-black tabular-nums sm:text-2xl ${c.color}`}>{c.value(opsStats)}</p>
          {c.hint?.(opsStats) ? (
            <p className="mt-0.5 text-[10px] font-bold tabular-nums text-slate-400">{c.hint(opsStats)}</p>
          ) : null}
        </AdminCard>
      ))}
    </div>
  );
}
