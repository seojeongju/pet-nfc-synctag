"use client";

import { AdminCard } from "@/components/admin/ui/AdminCard";
import type { TagOpsStats } from "@/types/admin-tags";

export function TagOpsKpiCards({ opsStats }: { opsStats: TagOpsStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      <AdminCard variant="kpi">
        <p className="text-[10px] text-slate-500 font-black uppercase">총 태그</p>
        <p className="text-2xl font-black text-slate-900 mt-2">{opsStats?.totalCount ?? 0}</p>
      </AdminCard>
      <AdminCard variant="kpi">
        <p className="text-[10px] text-slate-500 font-black uppercase">활성</p>
        <p className="text-2xl font-black text-teal-500 mt-2">{opsStats?.activeCount ?? 0}</p>
      </AdminCard>
      <AdminCard variant="kpi">
        <p className="text-[10px] text-slate-500 font-black uppercase">미판매</p>
        <p className="text-2xl font-black text-amber-500 mt-2">{opsStats?.unsoldCount ?? 0}</p>
      </AdminCard>
      <AdminCard variant="kpi">
        <p className="text-[10px] text-slate-500 font-black uppercase">활성화율</p>
        <p className="text-2xl font-black text-indigo-500 mt-2">{opsStats?.activationRate ?? 0}%</p>
      </AdminCard>
      <AdminCard variant="kpi">
        <p className="text-[10px] text-slate-500 font-black uppercase">최근 7일 연결</p>
        <p className="text-2xl font-black text-teal-500 mt-2">{opsStats?.recentLinks ?? 0}</p>
      </AdminCard>
      <AdminCard variant="kpi">
        <p className="text-[10px] text-slate-500 font-black uppercase">최근 7일 실패 등록</p>
        <p className="text-2xl font-black text-rose-500 mt-2">{opsStats?.failedRegistrations7d ?? 0}</p>
      </AdminCard>
      <AdminCard variant="kpi">
        <p className="text-[10px] text-slate-500 font-black uppercase">웹실패→네이티브 복구율(7일)</p>
        <p className="text-2xl font-black text-violet-500 mt-2">{opsStats?.nativeRecoveryRate7d ?? 0}%</p>
        <p className="mt-1 text-[10px] font-bold text-slate-400">
          {opsStats?.nativeWriteSuccessFromWebFail7d ?? 0}/{opsStats?.webWriteFailures7d ?? 0}
        </p>
      </AdminCard>
    </div>
  );
}
