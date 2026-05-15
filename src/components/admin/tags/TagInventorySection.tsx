"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Database, BarChart3, Boxes } from "lucide-react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminTableHeadCell, AdminTableHeadRow } from "@/components/admin/ui/AdminTable";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
import { Button } from "@/components/ui/button";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import { SUBJECT_KINDS, subjectKindMeta } from "@/lib/subject-kind";
import type {
  AdminTag,
  AdminWayfinderSpotPickRow,
  TagBatchesPageResult,
  TagBatchSummaryRow,
  TagsInventoryLinkFilter,
  TagsInventoryStatusFilter,
  TagsInventoryWayfinderFilter,
} from "@/types/admin-tags";
import { TagProductRow } from "./TagProductRow";

export type TagInventoryQueryState = {
  q: string;
  status: TagsInventoryStatusFilter;
  batch: string;
  kind: string;
  link: TagsInventoryLinkFilter;
  wf: TagsInventoryWayfinderFilter;
  regFrom: string;
  regTo: string;
  tenantId?: string | null;
  page: number;
  pageSize: number;
  bpage: number;
  bpageSize: number;
};

/** 쿼리·페이지·배치 페이지 URL 생성 (RSC/클라 공통) */
export function buildInventorySearchHref(
  s: TagInventoryQueryState,
  patch?: Partial<TagInventoryQueryState>
): string {
  const m: TagInventoryQueryState = { ...s, ...patch };
  const p = new URLSearchParams();
  if (m.q.trim()) p.set("q", m.q.trim());
  if (m.status !== "all") p.set("status", m.status);
  if (m.batch.trim()) p.set("batch", m.batch.trim());
  if (m.kind.trim()) p.set("kind", m.kind.trim());
  if (m.link !== "all") p.set("link", m.link);
  if (m.wf !== "all") p.set("wf", m.wf);
  if (m.regFrom.trim()) p.set("reg_from", m.regFrom.trim());
  if (m.regTo.trim()) p.set("reg_to", m.regTo.trim());
  if (m.tenantId) p.set("tenant", m.tenantId);
  if (m.page > 1) p.set("page", String(m.page));
  if (m.pageSize !== 20) p.set("pageSize", String(m.pageSize));
  if (m.bpage > 1) p.set("bpage", String(m.bpage));
  if (m.bpageSize !== 5) p.set("bpageSize", String(m.bpageSize));
  const qs = p.toString();
  return qs ? `/admin/nfc-tags/inventory?${qs}` : "/admin/nfc-tags/inventory";
}

type TagInventorySectionProps = {
  tags: AdminTag[];
  total: number;
  page: number;
  pageSize: number;
  initialQ: string;
  initialStatus: TagsInventoryStatusFilter;
  initialBatch: string;
  initialKind: string;
  initialLink: TagsInventoryLinkFilter;
  initialWf: TagsInventoryWayfinderFilter;
  initialRegFrom: string;
  initialRegTo: string;
  tenantId?: string | null;
  batchOptions: string[];
  /** 배치 ID별 집계(페이징) */
  batchPage: TagBatchesPageResult;
  /** 동행 스팟 연결 `<select>` 옵션(페이지당 1회 로드) */
  wayfinderSpotOptions: AdminWayfinderSpotPickRow[];
};

export function TagInventorySection({
  tags,
  total,
  page,
  pageSize,
  initialQ,
  initialStatus,
  initialBatch,
  initialKind,
  initialLink,
  initialWf,
  initialRegFrom,
  initialRegTo,
  tenantId = null,
  batchOptions,
  batchPage,
  wayfinderSpotOptions,
}: TagInventorySectionProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const bTotal = batchPage.total;
  const bPage = batchPage.page;
  const bPageSize = batchPage.pageSize;
  const batchRows: TagBatchSummaryRow[] = batchPage.rows;
  const bTotalPages = bTotal === 0 ? 1 : Math.max(1, Math.ceil(bTotal / bPageSize) || 1);
  const bRangeStart = bTotal === 0 ? 0 : (bPage - 1) * bPageSize + 1;
  const bRangeEnd = Math.min(bPage * bPageSize, bTotal);

  const base: TagInventoryQueryState = {
    q: initialQ,
    status: initialStatus,
    batch: initialBatch,
    kind: initialKind,
    link: initialLink,
    wf: initialWf,
    regFrom: initialRegFrom,
    regTo: initialRegTo,
    tenantId,
    page,
    pageSize,
    bpage: bPage,
    bpageSize: bPageSize,
  };

  return (
    <AdminCard variant="section" className="h-full space-y-6">
      <form
        id="tag-inventory-filter"
        method="get"
        action="/admin/nfc-tags/inventory"
        className="space-y-4 border-b border-slate-100 pb-6"
      >
        {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
        <input type="hidden" name="page" value="1" />
        <input type="hidden" name="bpage" value="1" />
        <input type="hidden" name="bpageSize" value={String(bPageSize)} />
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-xl font-black text-slate-900">
              <Database className="h-5 w-5 text-teal-400" />
              자산 목록
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              검색·필터·페이지 (총 {total.toLocaleString()}건 · {rangeStart}–{rangeEnd}번째 표시)
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:justify-end">
            <label className="flex min-w-[100px] flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-slate-400">자산·페이지당</span>
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
            <Button
              type="submit"
              className={cn("h-10 rounded-xl px-4 text-xs font-black", adminUi.darkButton)}
            >
              적용
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-3">
          <label className="space-y-1 lg:col-span-4">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">검색</span>
            <input
              type="search"
              name="q"
              defaultValue={initialQ}
              placeholder="UID · 제품명 · 펫 · 이메일 · 동행 스팟(slug·제목)"
              maxLength={120}
              className={cn(
                adminUi.searchInput,
                "min-h-[44px] w-full rounded-xl text-sm font-semibold sm:min-h-10 sm:text-xs sm:font-bold"
              )}
            />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">재고 상태</span>
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
          <label className="space-y-1 lg:col-span-3">
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
          <label className="space-y-1 lg:col-span-3">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">할당 모드</span>
            <select
              name="kind"
              defaultValue={initialKind}
              className={cn(adminUi.input, "min-h-[44px] w-full rounded-xl text-sm font-bold sm:min-h-10 sm:text-xs")}
            >
              <option value="">전체</option>
              <option value="__unset__">모드 미지정</option>
              {SUBJECT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {subjectKindMeta[k].label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 lg:col-span-3">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">펫 연결</span>
            <select
              name="link"
              defaultValue={initialLink}
              className={cn(adminUi.input, "min-h-[44px] w-full rounded-xl text-sm font-bold sm:min-h-10 sm:text-xs")}
            >
              <option value="all">전체</option>
              <option value="linked">연결됨</option>
              <option value="unlinked">미연결</option>
            </select>
          </label>
          <label className="space-y-1 lg:col-span-3">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">동행 스팟</span>
            <select
              name="wf"
              defaultValue={initialWf}
              className={cn(adminUi.input, "min-h-[44px] w-full rounded-xl text-sm font-bold sm:min-h-10 sm:text-xs")}
            >
              <option value="all">전체</option>
              <option value="linked">연결됨</option>
              <option value="unlinked">미연결</option>
            </select>
          </label>
          <label className="space-y-1 lg:col-span-3">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">등록일 시작</span>
            <input
              type="date"
              name="reg_from"
              defaultValue={initialRegFrom}
              className={cn(adminUi.input, "min-h-[44px] w-full rounded-xl text-sm font-bold sm:min-h-10 sm:text-xs")}
            />
          </label>
          <label className="space-y-1 lg:col-span-3">
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">등록일 종료</span>
            <input
              type="date"
              name="reg_to"
              defaultValue={initialRegTo}
              className={cn(adminUi.input, "min-h-[44px] w-full rounded-xl text-sm font-bold sm:min-h-10 sm:text-xs")}
            />
          </label>
        </div>
      </form>

      <div className="space-y-3 md:hidden">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <TagProductRow
              key={tag.id}
              tag={tag}
              wayfinderSpotOptions={wayfinderSpotOptions}
              onAfterSave={() => router.refresh()}
              mobile
            />
          ))
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
              <AdminTableHeadCell className="min-w-[140px] px-4 py-5">동행 스팟</AdminTableHeadCell>
              <AdminTableHeadCell className="min-w-[120px] px-4 py-5">BLE MAC</AdminTableHeadCell>
              <AdminTableHeadCell className="px-4 py-5">상태</AdminTableHeadCell>
              <AdminTableHeadCell className="px-4 py-5">연결</AdminTableHeadCell>
              <AdminTableHeadCell className="px-4 py-5">등록일</AdminTableHeadCell>
              <AdminTableHeadCell className="min-w-[88px] px-4 py-5">저장·삭제</AdminTableHeadCell>
            </AdminTableHeadRow>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <TagProductRow
                  key={tag.id}
                  tag={tag}
                  wayfinderSpotOptions={wayfinderSpotOptions}
                  onAfterSave={() => router.refresh()}
                />
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-24 text-center">
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

      <div
        className="flex flex-col items-stretch justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center"
        data-section="tag-inventory-asset-pages"
      >
        <p className="order-2 text-center text-xs font-bold tabular-nums text-slate-500 sm:order-1 sm:text-left">
          페이지 {page} / {totalPages} · {total.toLocaleString()}건 중 {rangeStart}–{rangeEnd}
        </p>
        <div className="order-1 sm:order-2 sm:flex-1 sm:justify-end">
          <AdminPagination
            aria-label="자산 목록 페이지"
            currentPage={page}
            totalPages={totalPages}
            buildHref={(p) => buildInventorySearchHref(base, { page: p })}
            className="sm:justify-end"
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-100 pt-4">
        <form
          method="get"
          action="/admin/nfc-tags/inventory"
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between"
        >
          {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
          <input type="hidden" name="q" value={initialQ} />
          <input type="hidden" name="status" value={initialStatus} />
          <input type="hidden" name="batch" value={initialBatch} />
          <input type="hidden" name="kind" value={initialKind} />
          <input type="hidden" name="link" value={initialLink} />
          <input type="hidden" name="reg_from" value={initialRegFrom} />
          <input type="hidden" name="reg_to" value={initialRegTo} />
          <input type="hidden" name="page" value={String(page)} />
          <input type="hidden" name="pageSize" value={String(pageSize)} />
          <input type="hidden" name="bpage" value="1" />
          <div className="flex items-center gap-2 text-slate-700">
            <BarChart3 className="h-4 w-4 shrink-0 text-teal-400" />
            <h4 className="text-sm font-black">최근 배치 등록 통계</h4>
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:ml-auto">
            <label className="flex min-w-[100px] flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-slate-400">배치·페이지당</span>
              <select
                name="bpageSize"
                defaultValue={String(bPageSize)}
                className={cn(adminUi.input, "h-10 min-w-[88px] rounded-xl text-xs font-bold")}
              >
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="8">8</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
              </select>
            </label>
            <Button
              type="submit"
              className={cn("h-10 rounded-xl px-4 text-xs font-black", adminUi.darkButton)}
            >
              적용
            </Button>
          </div>
        </form>

        <p className="text-[10px] font-bold text-slate-500">
          배치 수 {bTotal.toLocaleString()}건 · {bRangeStart}–{bRangeEnd}번째 표시
        </p>

        <div className="space-y-2">
          {batchRows.length > 0 ? (
            batchRows.map((brow) => (
              <div
                key={brow.batch_id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <Boxes className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                    <span className="truncate">{brow.batch_id}</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-500">
                    {new Date(brow.latest_created_at).toLocaleString("ko-KR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase sm:gap-4">
                  <span className="text-slate-500">총 {brow.total_count}</span>
                  <span className="text-teal-600">활성 {brow.active_count}</span>
                  <span className="text-amber-600">미판매 {brow.unsold_count}</span>
                  <Link
                    href={buildInventorySearchHref(base, {
                      batch: brow.batch_id,
                      page: 1,
                      bpage: 1,
                    })}
                    prefetch={false}
                    className="rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 text-teal-700 hover:bg-teal-50"
                  >
                    이 배치만 보기
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs font-bold text-slate-500">
              등록된 batch_id가 없습니다. UID를 일괄 등록해 보세요.
            </div>
          )}
        </div>

        {bTotal > 0 && (
          <div className="border-t border-slate-100 pt-4" data-section="tag-inventory-batch-pages">
            <div className="mb-2 flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p className="text-center text-xs font-bold tabular-nums text-slate-500 sm:text-left">
                배치 페이지 {bPage} / {bTotalPages}
              </p>
            </div>
            <AdminPagination
              aria-label="배치 등록 통계 페이지"
              currentPage={bPage}
              totalPages={bTotalPages}
              buildHref={(bp) => buildInventorySearchHref(base, { bpage: bp })}
            />
          </div>
        )}
      </div>
    </AdminCard>
  );
}
