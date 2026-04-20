"use client";

import { useState } from "react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminTableHeadCell, AdminTableHeadRow, AdminTableRow } from "@/components/admin/ui/AdminTable";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Download, Eye } from "lucide-react";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import type { AdminAuditLogRow } from "@/types/admin-tags";
import { useAdminTagsAuditUrl } from "@/hooks/use-admin-tags-audit-url";

function getResultLabel(success: boolean | number) {
  return Boolean(success) ? "성공" : "실패";
}

function getActorLabel(actorEmail?: string | null) {
  return actorEmail || "시스템";
}

function summarizePayload(payloadRaw?: string | null) {
  if (!payloadRaw) return "-";
  try {
    const payload = JSON.parse(payloadRaw);
    if (payload?.registeredCount !== undefined) {
      return `등록 ${payload.registeredCount} / 실패 ${payload.failedCount ?? 0}`;
    }
    if (payload?.source === "admin_write_card" && payload?.tagId && payload?.url) {
      return `handoff tagId=${payload.tagId}`;
    }
    if (payload?.source === "native_app" && payload?.tagId && payload?.clientError === undefined) {
      return `native_write tagId=${payload.tagId}, device=${payload.deviceId ?? "-"}`;
    }
    if (payload?.source === "native_app" && payload?.clientError) {
      return `native_write err=${String(payload.clientError).slice(0, 40)}`;
    }
    if (payload?.tagId && payload?.url && payload?.clientError === undefined) {
      return `tagId=${payload.tagId}, url=${String(payload.url).slice(0, 48)}…`;
    }
    if (payload?.tagId && payload?.url && payload?.clientError !== undefined) {
      return `tagId=${payload.tagId}, err=${String(payload.clientError).slice(0, 40)}`;
    }
    if (payload?.source && payload?.tagId && payload?.clientError === undefined) {
      return `source=${payload.source}, tagId=${payload.tagId}`;
    }
    if (payload?.source && payload?.clientError) {
      return `source=${payload.source}, err=${String(payload.clientError).slice(0, 40)}`;
    }
    if (payload?.tagId && payload?.petId) {
      return `tagId=${payload.tagId}, petId=${payload.petId}`;
    }
    if (payload?.error) return String(payload.error);
    return JSON.stringify(payload);
  } catch {
    return payloadRaw;
  }
}

export function AdminAuditLogsPanel({
  auditLogs,
  auditTotalCount,
}: {
  auditLogs: AdminAuditLogRow[];
  auditTotalCount: number;
}) {
  const [selectedAudit, setSelectedAudit] = useState<AdminAuditLogRow | null>(null);
  const {
    auditSuccessFilter,
    setAuditSuccessFilter,
    auditDaysFilter,
    setAuditDaysFilter,
    auditActorFilter,
    setAuditActorFilter,
    auditActionFilter,
    setAuditActionFilter,
    auditSortBy,
    setAuditSortBy,
    auditSortOrder,
    setAuditSortOrder,
    auditPage,
    setAuditPage,
    auditPageSize,
    auditTotalPages,
  } = useAdminTagsAuditUrl();

  const totalPages = auditTotalPages(auditTotalCount);

  const exportAuditCsv = () => {
    if (auditLogs.length === 0) return;
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["created_at", "action", "actor_email", "success", "summary"],
      ...auditLogs.map((log) => {
        let summary = "-";
        try {
          const payload = log.payload ? JSON.parse(log.payload) : null;
          if (payload?.registeredCount !== undefined) {
            summary = `registered=${payload.registeredCount};failed=${payload.failedCount ?? 0}`;
          } else if (payload?.error) {
            summary = String(payload.error);
          }
        } catch {
          summary = log.payload || "-";
        }
        return [
          new Date(log.created_at).toISOString(),
          log.action,
          getActorLabel(log.actor_email),
          getResultLabel(log.success),
          summary,
        ];
      }),
    ];
    const csv = rows.map((row) => row.map((col) => escapeCsv(String(col))).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AdminCard variant="section" className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-violet-300" />
              <h4 className="text-sm font-black">관리자 액션 로그 / 감사 패널</h4>
            </div>
            <Button
              onClick={exportAuditCsv}
              disabled={auditLogs.length === 0}
              variant="outline"
              className={cn("h-9 rounded-xl", adminUi.outlineButton)}
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={auditSuccessFilter}
              onChange={(e) => setAuditSuccessFilter(e.target.value as "all" | "success" | "failed")}
              className={adminUi.input}
            >
              <option value="all">전체 결과</option>
              <option value="success">성공만</option>
              <option value="failed">실패만</option>
            </select>
            <select
              value={auditDaysFilter}
              onChange={(e) => setAuditDaysFilter(Number(e.target.value) as 7 | 30 | 90)}
              className={adminUi.input}
            >
              <option value={7}>최근 7일</option>
              <option value={30}>최근 30일</option>
              <option value={90}>최근 90일</option>
            </select>
            <input
              value={auditActorFilter}
              onChange={(e) => setAuditActorFilter(e.target.value)}
              placeholder="실행자 이메일 필터"
              className={cn(adminUi.input, "placeholder:text-slate-400")}
            />
            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className={adminUi.input}
            >
              <option value="">전체 액션</option>
              <option value="bulk_register">bulk_register</option>
              <option value="tag_link">tag_link</option>
              <option value="tag_unlink">tag_unlink</option>
              <option value="nfc_web_read">nfc_web_read</option>
              <option value="nfc_web_write">nfc_web_write</option>
              <option value="nfc_native_handoff">nfc_native_handoff</option>
              <option value="nfc_native_write">nfc_native_write</option>
            </select>
            <div className="flex gap-2">
              <select
                value={auditSortBy}
                onChange={(e) => setAuditSortBy(e.target.value as "created_at" | "action" | "success")}
                className={cn(adminUi.input, "flex-1")}
              >
                <option value="created_at">정렬: 시각</option>
                <option value="action">정렬: 액션</option>
                <option value="success">정렬: 결과</option>
              </select>
              <select
                value={auditSortOrder}
                onChange={(e) => setAuditSortOrder(e.target.value as "asc" | "desc")}
                className={cn(adminUi.input, "w-28")}
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <AdminTableHeadRow>
                <AdminTableHeadCell>시각</AdminTableHeadCell>
                <AdminTableHeadCell>액션</AdminTableHeadCell>
                <AdminTableHeadCell>실행자</AdminTableHeadCell>
                <AdminTableHeadCell>결과</AdminTableHeadCell>
                <AdminTableHeadCell>요약</AdminTableHeadCell>
                <AdminTableHeadCell>상세</AdminTableHeadCell>
              </AdminTableHeadRow>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => {
                  const summary = summarizePayload(log.payload);
                  return (
                    <AdminTableRow key={log.id}>
                      <td className={cn(adminUi.tableBodyCell, "text-slate-400")}>{new Date(log.created_at).toLocaleString()}</td>
                      <td className={cn(adminUi.tableBodyCell, "text-slate-700")}>{log.action}</td>
                      <td className={cn(adminUi.tableBodyCell, "text-slate-400")}>{getActorLabel(log.actor_email)}</td>
                      <td className="py-4 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            log.success ? adminUi.successBadge : adminUi.dangerBadge
                          )}
                        >
                          {getResultLabel(log.success)}
                        </span>
                      </td>
                      <td className={adminUi.tableBodyCell}>{summary}</td>
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedAudit(log)}
                          className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          보기
                        </button>
                      </td>
                    </AdminTableRow>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-xs text-slate-500 font-bold">
                    표시할 관리자 감사 로그가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 font-bold">
            총 {auditTotalCount}건 중{" "}
            {auditTotalCount === 0 ? 0 : (auditPage - 1) * auditPageSize + 1}-{Math.min(auditPage * auditPageSize, auditTotalCount)}건
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className={cn("h-8 rounded-lg", adminUi.outlineButton)}
              onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
              disabled={auditPage <= 1}
            >
              이전
            </Button>
            <span className="text-xs text-slate-600 font-black">
              {auditPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              className={cn("h-8 rounded-lg", adminUi.outlineButton)}
              onClick={() => setAuditPage((p) => Math.min(totalPages, p + 1))}
              disabled={auditPage >= totalPages}
            >
              다음
            </Button>
          </div>
        </div>
      </AdminCard>

      {selectedAudit && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-black text-slate-900">감사 로그 상세</h5>
              <button type="button" onClick={() => setSelectedAudit(null)} className="text-xs font-black text-slate-400 hover:text-slate-900">
                닫기
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <p className="text-slate-500">
                액션: <span className="text-slate-800 font-bold">{selectedAudit.action}</span>
              </p>
              <p className="text-slate-500">
                결과: <span className="text-slate-800 font-bold">{getResultLabel(selectedAudit.success)}</span>
              </p>
              <p className="text-slate-500">
                실행자: <span className="text-slate-800 font-bold">{getActorLabel(selectedAudit.actor_email)}</span>
              </p>
              <p className="text-slate-500">
                시각: <span className="text-slate-800 font-bold">{new Date(selectedAudit.created_at).toLocaleString()}</span>
              </p>
            </div>
            <pre className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-[11px] text-slate-700 overflow-auto max-h-80">
              {(() => {
                if (!selectedAudit.payload) return "{}";
                try {
                  const parsed = JSON.parse(selectedAudit.payload);
                  return JSON.stringify(parsed, null, 2);
                } catch {
                  return selectedAudit.payload;
                }
              })()}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
