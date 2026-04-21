"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Database, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminTableHeadCell, AdminTableHeadRow } from "@/components/admin/ui/AdminTable";
import { Button } from "@/components/ui/button";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import type { AdminTag, TagOpsStats, TagsInventoryStatusFilter } from "@/types/admin-tags";
import { TagProductRow } from "./TagProductRow";

function buildInventoryHref(vars: {
  q: string;
  status: TagsInventoryStatusFilter;
  batch: string;
  page: number;
  pageSize: number;
}) {
  const p = new URLSearchParams();
  if (vars.q.trim()) p.set("q", vars.q.trim());
  if (vars.status !== "all") p.set("status", vars.status);
  if (vars.batch.trim()) p.set("batch", vars.batch.trim());
  if (vars.pageSize !== 20) p.set("pageSize", String(vars.pageSize));
  if (vars.page > 1) p.set("page", String(vars.page));
  const qs = p.toString();
  return qs ? `/admin/nfc-tags/inventory?${qs}` : "/admin/nfc-tags/inventory";
}

export function TagInventorySection({
  tags,
  total,
  page,
  pageSize,
  initialQ,
  initialStatus,
  initialBatch,
  batchOptions,
  opsStats,
}: {
  tags: AdminTag[];
  total: number;
  page: number;
  pageSize: number;
  initialQ: string;
  initialStatus: TagsInventoryStatusFilter;
  initialBatch: string;
  batchOptions: string[];
  opsStats: TagOpsStats;
}) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <AdminCard variant="section" className="h-full space-y-6">
      <form
        method="get"
        action="/admin/nfc-tags/inventory"
        className="space-y-4 border-b border-slate-100 pb-6"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-xl font-black text-slate-900">
              <Database className="h-5 w-5 text-teal-400" />
              자산 목록
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              검색·필터·페이지 (총 {total.toLocaleString()}건 · {rangeStart}–{rangeEnd} 표시)
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:justify-end">
            <label className="flex min-w-[100px] flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-slate-400">페이지당</span>
              <select
                name="pageSize"
                defaultValue={String(pageSize)}
                className={cn(adminUi.input, "h-10 min-w-[88px] rounded-xl text-xs font-bold")}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
            <Button type="submit" className={cn("h-10 rounded-xl px-4 text-xs font-black", adminUi.darkButton)}>
              적용
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-3">
          <label className="space-y-1 lg:col-span-4">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">검색</span>
            <input
              type="search"
              name="q"
              defaultValue={initialQ}
              placeholder="UID · 제품명 · 펫 · 소유자 이메일"
              maxLength={120}
              className={cn(
                adminUi.searchInput,
                "min-h-[44px] w-full rounded-xl text-sm font-semibold sm:min-h-10 sm:text-xs sm:font-bold"
              )}
            />
          </label>
          <label className="space-y-1 lg:col-span-3">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">상태</span>
            <select
              name="status"
              defaultValue={initialStatus}
              className={cn(adminUi.input, "min-h-[44px] w-full rounded-xl text-sm font-bold sm:min-h-10 sm:text-xs")}
            >
              <option value="all">전체</option>
              <option value="unsold">미판매</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </label>
          <label className="space-y-1 lg:col-span-4">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">배치 ID</span>
            <select
              name="batch"
              defaultValue={initialBatch}
              className={cn(adminUi.input, "min-h-[44px] w-full rounded-xl text-sm font-bold sm:min-h-10 sm:text-xs")}
            >
              <option value="">전체 배치</option>
              {initialBatch && !batchOptions.includes(initialBatch) ? (
                <option value={initialBatch}>
                  {initialBatch} (목록 외)
                </option>
              ) : null}
              {batchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>

      <div className="space-y-3 md:hidden">
        {tags.length > 0 ? (
          tags.map((tag) => <TagProductRow key={tag.id} tag={tag} onAfterSave={() => router.refresh()} mobile />)
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold text-slate-500">
            조건에 맞는 태그가 없습니다. 필터를 바꿔 보세요.
          </div>
        )}
      </div>

      <div className="custom-scrollbar hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead>
            <AdminTableHeadRow>
              <AdminTableHeadCell className="min-w-[140px] px-4 py-5">태그 UID</AdminTableHeadCell>
              <AdminTableHeadCell className="min-w-[100px] px-4 py-5">제품명</AdminTableHeadCell>
              <AdminTableHeadCell className="min-w-[120px] px-4 py-5">할당 모드</AdminTableHeadCell>
              <AdminTableHeadCell className="min-w-[120px] px-4 py-5">BLE MAC</AdminTableHeadCell>
              <AdminTableHeadCell className="px-4 py-5">상태</AdminTableHeadCell>
              <AdminTableHeadCell className="px-4 py-5">연결</AdminTableHeadCell>
              <AdminTableHeadCell className="px-4 py-5">등록일</AdminTableHeadCell>
              <AdminTableHeadCell className="w-[72px] px-4 py-5">저장</AdminTableHeadCell>
            </AdminTableHeadRow>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tags.length > 0 ? (
              tags.map((tag) => <TagProductRow key={tag.id} tag={tag} onAfterSave={() => router.refresh()} />)
            ) : (
              <tr>
                <td colSpan={8} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <Database className="h-12 w-12 text-slate-400" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      조건에 맞는 태그가 없습니다
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
          <Link
            href={buildInventoryHref({
              q: initialQ,
              status: initialStatus,
              batch: initialBatch,
              page: Math.max(1, page - 1),
              pageSize,
            })}
            className={cn(
              "inline-flex min-h-11 items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black touch-manipulation hover:bg-slate-50",
              page <= 1 && "pointer-events-none opacity-40"
            )}
            aria-disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            이전
          </Link>
          <span className="text-xs font-black tabular-nums text-slate-600">
            {page} / {totalPages}
          </span>
          <Link
            href={buildInventoryHref({
              q: initialQ,
              status: initialStatus,
              batch: initialBatch,
              page: Math.min(totalPages, page + 1),
              pageSize,
            })}
            className={cn(
              "inline-flex min-h-11 items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black touch-manipulation hover:bg-slate-50",
              page >= totalPages && "pointer-events-none opacity-40"
            )}
            aria-disabled={page >= totalPages}
          >
            다음
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}

      <div className="space-y-4 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-slate-700">
          <BarChart3 className="h-4 w-4 text-teal-400" />
          <h4 className="text-sm font-black">최근 배치 등록 통계</h4>
        </div>
        <div className="space-y-2">
          {(opsStats?.batches ?? []).length > 0 ? (
            (opsStats?.batches ?? []).map((batch) => (
              <div
                key={batch.batch_id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div>
                  <p className="text-xs font-black text-slate-900">{batch.batch_id}</p>
                  <p className="text-[10px] font-bold text-slate-500">
                    {new Date(batch.latest_created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase sm:gap-4">
                  <span className="text-slate-300">총 {batch.total_count}</span>
                  <span className="text-teal-400">활성 {batch.active_count}</span>
                  <span className="text-amber-400">미판매 {batch.unsold_count}</span>
                  <Link
                    href={buildInventoryHref({
                      q: initialQ,
                      status: initialStatus,
                      batch: batch.batch_id,
                      page: 1,
                      pageSize,
                    })}
                    className="rounded-lg border border-teal-200 bg-white px-2 py-1 text-teal-700 hover:bg-teal-50"
                  >
                    이 배치만 보기
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold text-slate-500">
              표시할 배치 통계가 없습니다.
            </div>
          )}
        </div>
      </div>
    </AdminCard>
  );
}
