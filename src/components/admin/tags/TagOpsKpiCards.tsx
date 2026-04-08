"use client";

import { AdminCard } from "@/components/admin/ui/AdminCard";
import type { TagOpsStats } from "@/types/admin-tags";

export function TagOpsKpiCards({ opsStats }: { opsStats: TagOpsStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
      <AdminCard variant="kpi" className="col-span-2 lg:col-span-1">
        <p className="text-[10px] text-slate-500 font-black uppercase">최근 7일 연결</p>
        <p className="text-2xl font-black text-teal-500 mt-2">{opsStats?.recentLinks ?? 0}</p>
      </AdminCard>
      <AdminCard variant="kpi" className="col-span-2 lg:col-span-1">
        <p className="text-[10px] text-slate-500 font-black uppercase">최근 7일 실패 등록</p>
        <p className="text-2xl font-black text-rose-500 mt-2">{opsStats?.failedRegistrations7d ?? 0}</p>
      </AdminCard>
    </div>
  );
}
