"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminTableHeadCell, AdminTableHeadRow, AdminTableRow } from "@/components/admin/ui/AdminTable";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
import { History } from "lucide-react";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import type { TagLinkLogsPageResult } from "@/types/admin-tags";

export function TagLinkLogsSection({ linkPage }: { linkPage: TagLinkLogsPageResult }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rows: linkLogs, total, page, pageSize } = linkPage;
  const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const buildLinkPageHref = (next: number) => {
    const p = new URLSearchParams(searchParams.toString());
    if (next > 1) p.set("lpage", String(next));
    else p.delete("lpage");
    return `/admin/nfc-tags/history?${p.toString()}`;
  };

  const applyLinkPageSize = (nextSize: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("lpage");
    if (nextSize !== 20) p.set("lps", String(nextSize));
    else p.delete("lps");
    router.push(`/admin/nfc-tags/history?${p.toString()}`);
  };

  return (
    <AdminCard variant="section" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
            <History className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h4 className="text-[1.05rem] font-black leading-snug tracking-tight text-slate-900 sm:text-sm">
              태그 연결·해제 이력
            </h4>
            <p className="text-[13px] font-medium leading-snug text-slate-500 sm:text-[11px] sm:font-bold">
              펫과 태그 매핑이 바뀔 때 기록됩니다. 아래「관리자 감사 로그」와 페이지·페이지 크기는 서로 별도입니다.
            </p>
            <p className="text-[10px] font-bold tabular-nums text-slate-500">
              총 {total.toLocaleString()}건 · {rangeStart}–{rangeEnd}번째 표시
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2 sm:justify-end">
          <label className="flex min-w-[120px] flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-slate-400">연결·해제 / 페이지당</span>
            <select
              value={String(pageSize)}
              onChange={(e) => applyLinkPageSize(Number(e.target.value) || 20)}
              className={cn(adminUi.input, "h-10 min-w-[100px] rounded-xl text-xs font-bold")}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {linkLogs.length > 0 ? (
          linkLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.03]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
                <span
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                    log.action === "link" ? adminUi.successBadge : adminUi.dangerBadge
                  )}
                >
                  {log.action === "link" ? "연결" : "해제"}
                </span>
              </div>
              <p className="mt-2 font-mono text-[14px] font-bold text-slate-800">{log.tag_id}</p>
              <p className="mt-1 text-[15px] font-black text-slate-900">{log.pet_name || "알 수 없음"}</p>
              <p className="mt-1 text-[13px] font-semibold text-slate-500">{log.owner_email || "-"}</p>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-[14px] font-semibold text-slate-500">
            연결/해제 이력이 아직 없습니다.
          </p>
        )}
      </div>

      <div className="hidden overflow-x-auto custom-scrollbar md:block">
        <table className="w-full text-left">
          <thead>
            <AdminTableHeadRow>
              <AdminTableHeadCell>시각</AdminTableHeadCell>
              <AdminTableHeadCell>액션</AdminTableHeadCell>
              <AdminTableHeadCell>태그 UID</AdminTableHeadCell>
              <AdminTableHeadCell>반려동물</AdminTableHeadCell>
              <AdminTableHeadCell>소유자</AdminTableHeadCell>
            </AdminTableHeadRow>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {linkLogs.length > 0 ? (
              linkLogs.map((log) => (
                <AdminTableRow key={log.id}>
                  <td className={cn(adminUi.tableBodyCell, "text-slate-400")}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest",
                        log.action === "link" ? adminUi.successBadge : adminUi.dangerBadge
                      )}
                    >
                      {log.action === "link" ? "연결" : "해제"}
                    </span>
                  </td>
                  <td className={adminUi.tableBodyCellMono}>{log.tag_id}</td>
                  <td className={adminUi.tableBodyCellStrong}>{log.pet_name || "알 수 없음"}</td>
                  <td className={cn(adminUi.tableBodyCell, "text-slate-400")}>{log.owner_email || "-"}</td>
                </AdminTableRow>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-14 text-center text-sm font-bold text-slate-500">
                  연결/해제 이력이 아직 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div
          className="flex flex-col items-stretch justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center"
          data-section="tag-link-logs-pager"
        >
          <p className="order-2 text-center text-xs font-bold tabular-nums text-slate-500 sm:order-1 sm:text-left">
            lpage {page} / {totalPages}
          </p>
          <div className="order-1 sm:order-2 sm:flex-1 sm:justify-end">
            <AdminPagination
              aria-label="태그 연결·해제 이력"
              currentPage={page}
              totalPages={totalPages}
              buildHref={buildLinkPageHref}
              className="sm:justify-end"
            />
          </div>
        </div>
      )}
    </AdminCard>
  );
}
