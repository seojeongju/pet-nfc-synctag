"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminTableHeadCell, AdminTableHeadRow } from "@/components/admin/ui/AdminTable";
import { Database, BarChart3, Search } from "lucide-react";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import type { AdminTag, TagOpsStats } from "@/types/admin-tags";
import { TagProductRow } from "./TagProductRow";

export function TagInventorySection({ tags, opsStats }: { tags: AdminTag[]; opsStats: TagOpsStats }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTags = useMemo(
    () =>
      tags.filter(
        (tag) =>
          tag.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tag.pet_name && tag.pet_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (tag.product_name && tag.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [tags, searchTerm]
  );

  return (
    <AdminCard variant="section" className="space-y-8 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 px-2">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-400" />
            자산 목록 ({filteredTags.length})
          </h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">검색·편집</p>
        </div>
        <div className="relative group w-full sm:w-auto sm:min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="UID · 제품명 · 펫 이름 검색..."
            className={cn(
              adminUi.searchInput,
              "min-h-[48px] w-full text-base font-semibold sm:min-h-0 sm:text-xs sm:font-bold"
            )}
          />
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {filteredTags.length > 0 ? (
          filteredTags.map((tag) => (
            <TagProductRow key={tag.id} tag={tag} onAfterSave={() => router.refresh()} mobile />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 font-bold">
            등록된 인벤토리가 없습니다.
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead>
            <AdminTableHeadRow>
              <AdminTableHeadCell className="py-5 px-4 min-w-[140px]">태그 UID</AdminTableHeadCell>
              <AdminTableHeadCell className="py-5 px-4 min-w-[100px]">제품명</AdminTableHeadCell>
              <AdminTableHeadCell className="py-5 px-4 min-w-[120px]">할당 모드</AdminTableHeadCell>
              <AdminTableHeadCell className="py-5 px-4 min-w-[120px]">BLE MAC</AdminTableHeadCell>
              <AdminTableHeadCell className="py-5 px-4">상태</AdminTableHeadCell>
              <AdminTableHeadCell className="py-5 px-4">연결</AdminTableHeadCell>
              <AdminTableHeadCell className="py-5 px-4">등록일</AdminTableHeadCell>
              <AdminTableHeadCell className="py-5 px-4 w-[72px]">저장</AdminTableHeadCell>
            </AdminTableHeadRow>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <TagProductRow key={tag.id} tag={tag} onAfterSave={() => router.refresh()} />
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <Database className="w-12 h-12 text-slate-400" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">등록된 인벤토리가 없습니다</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-slate-700">
          <BarChart3 className="w-4 h-4 text-teal-400" />
          <h4 className="text-sm font-black">최근 배치 등록 통계</h4>
        </div>
        <div className="space-y-2">
          {(opsStats?.batches ?? []).length > 0 ? (
            (opsStats?.batches ?? []).map((batch) => (
              <div
                key={batch.batch_id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div>
                  <p className="text-xs font-black text-slate-900">{batch.batch_id}</p>
                  <p className="text-[10px] text-slate-500 font-bold">{new Date(batch.latest_created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-[10px] font-black uppercase flex-wrap">
                  <span className="text-slate-300">총 {batch.total_count}</span>
                  <span className="text-teal-400">활성 {batch.active_count}</span>
                  <span className="text-amber-400">미판매 {batch.unsold_count}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 font-bold">
              표시할 배치 통계가 없습니다.
            </div>
          )}
        </div>
      </div>
    </AdminCard>
  );
}
