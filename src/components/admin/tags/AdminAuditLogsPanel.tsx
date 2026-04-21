"use client";

import { useMemo, useState } from "react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminTableHeadCell, AdminTableHeadRow, AdminTableRow } from "@/components/admin/ui/AdminTable";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Download, Eye, SlidersHorizontal, X } from "lucide-react";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import type { AdminAuditLogRow } from "@/types/admin-tags";
import { useAdminTagsAuditUrl } from "@/hooks/use-admin-tags-audit-url";

const ACTION_LABELS: Record<string, string> = {
  bulk_register: "대량 UID 등록",
  tag_link: "태그 연결",
  tag_unlink: "태그 해제",
  nfc_web_read: "Web NFC UID 읽기",
  nfc_web_write: "Web NFC URL 기록",
  nfc_native_handoff: "네이티브 앱 연결",
  nfc_native_write: "네이티브 앱 기록",
  platform_user_role: "플랫폼 사용자 역할 변경",
  platform_user_email: "플랫폼 사용자 이메일 변경",
  platform_user_password_reset: "플랫폼 사용자 비밀번호 초기화",
  platform_user_subscription: "플랫폼 사용자 개인 플랜 코드 변경",
  platform_user_delete: "플랫폼 사용자 계정 삭제",
};

function actionDisplayName(action: string) {
  return ACTION_LABELS[action] ?? action;
}

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
    if (payload?.targetEmail && (payload?.nextRole || payload?.prevRole)) {
      return `${String(payload.targetEmail)}: ${String(payload.prevRole)} -> ${String(payload.nextRole)}`;
    }
    if (payload?.prevEmail !== undefined && payload?.nextEmail !== undefined) {
      return `${String(payload.prevEmail)} -> ${String(payload.nextEmail)}`;
    }
    if (payload?.prevSubscriptionStatus !== undefined && payload?.nextSubscriptionStatus !== undefined) {
      return `${String(payload.prevSubscriptionStatus)} -> ${String(payload.nextSubscriptionStatus)}`;
    }
    if (payload?.credentialCreated !== undefined && payload?.targetEmail !== undefined) {
      return `${String(payload.targetEmail)} · 비밀번호 ${payload.credentialCreated ? "(credential 추가)" : "갱신"}`;
    }
    if (payload?.deleted === true && payload?.targetEmail) {
      return `삭제 ${String(payload.targetEmail)}`;
    }
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

  const filterSummary = useMemo(() => {
    const chips: string[] = [];
    if (auditSuccessFilter === "success") chips.push("성공만");
    else if (auditSuccessFilter === "failed") chips.push("실패만");
    else chips.push("결과 전체");
    chips.push(`최근 ${auditDaysFilter}일`);
    if (auditActorFilter.trim()) chips.push(`실행자: ${auditActorFilter.trim()}`);
    if (auditActionFilter) chips.push(`액션: ${actionDisplayName(auditActionFilter)}`);
    const sortLabel =
      auditSortBy === "created_at" ? "시각" : auditSortBy === "action" ? "액션" : "결과";
    chips.push(`정렬 ${sortLabel} · ${auditSortOrder === "desc" ? "내림차순" : "오름차순"}`);
    return chips;
  }, [
    auditActionFilter,
    auditActorFilter,
    auditDaysFilter,
    auditSortBy,
    auditSortOrder,
    auditSuccessFilter,
  ]);

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

  const selectClass = cn(
    adminUi.input,
    "min-h-[48px] rounded-2xl text-base font-semibold shadow-inner shadow-slate-900/[0.02] focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 sm:min-h-[44px] sm:text-xs sm:font-bold"
  );

  return (
    <>
      <AdminCard variant="section" className="space-y-5 overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <h4 className="text-[1.05rem] font-black leading-snug tracking-tight text-slate-900 sm:text-sm">
                  관리자 액션 로그 / 감사
                </h4>
                <p className="text-[13px] font-medium leading-snug text-slate-500 sm:text-[11px] sm:font-bold">
                  URL 쿼리와 동기화됩니다. 필터를 바꾸면 1페이지로 돌아갑니다.
                </p>
              </div>
            </div>
            <Button
              onClick={exportAuditCsv}
              disabled={auditLogs.length === 0}
              variant="outline"
              className={cn(
                "min-h-12 w-full touch-manipulation rounded-2xl text-[14px] font-black sm:min-h-11 sm:w-auto sm:rounded-xl sm:text-[13px] sm:h-9 sm:text-xs",
                adminUi.outlineButton
              )}
            >
              <Download className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
              CSV 내보내기
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterSummary.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="rounded-[22px] border border-slate-100 bg-gradient-to-b from-slate-50/80 to-white p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-slate-600">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">필터 · 정렬</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wide text-slate-400 sm:text-[10px]">결과</span>
                <select
                  value={auditSuccessFilter}
                  onChange={(e) => setAuditSuccessFilter(e.target.value as "all" | "success" | "failed")}
                  className={selectClass}
                >
                  <option value="all">전체 결과</option>
                  <option value="success">성공만</option>
                  <option value="failed">실패만</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wide text-slate-400 sm:text-[10px]">기간</span>
                <select
                  value={auditDaysFilter}
                  onChange={(e) => setAuditDaysFilter(Number(e.target.value) as 7 | 30 | 90)}
                  className={selectClass}
                >
                  <option value={7}>최근 7일</option>
                  <option value={30}>최근 30일</option>
                  <option value={90}>최근 90일</option>
                </select>
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-black uppercase tracking-wide text-slate-400 sm:text-[10px]">
                  실행자 이메일
                </span>
                <input
                  value={auditActorFilter}
                  onChange={(e) => setAuditActorFilter(e.target.value)}
                  placeholder="비우면 전체"
                  className={cn(
                    adminUi.input,
                    "min-h-[48px] w-full rounded-2xl text-base font-semibold shadow-inner shadow-slate-900/[0.02] placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 sm:min-h-[44px] sm:text-xs sm:font-bold"
                  )}
                />
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-black uppercase tracking-wide text-slate-400 sm:text-[10px]">액션</span>
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="">전체 액션</option>
                  <option value="bulk_register">{ACTION_LABELS.bulk_register}</option>
                  <option value="tag_link">{ACTION_LABELS.tag_link}</option>
                  <option value="tag_unlink">{ACTION_LABELS.tag_unlink}</option>
                  <option value="nfc_web_read">{ACTION_LABELS.nfc_web_read}</option>
                  <option value="nfc_web_write">{ACTION_LABELS.nfc_web_write}</option>
                  <option value="nfc_native_handoff">{ACTION_LABELS.nfc_native_handoff}</option>
                  <option value="nfc_native_write">{ACTION_LABELS.nfc_native_write}</option>
                  <option value="platform_user_role">{ACTION_LABELS.platform_user_role}</option>
                  <option value="platform_user_email">{ACTION_LABELS.platform_user_email}</option>
                  <option value="platform_user_password_reset">{ACTION_LABELS.platform_user_password_reset}</option>
                  <option value="platform_user_subscription">{ACTION_LABELS.platform_user_subscription}</option>
                  <option value="platform_user_delete">{ACTION_LABELS.platform_user_delete}</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:gap-3">
                <label className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400 sm:text-[10px]">
                    정렬 기준
                  </span>
                  <select
                    value={auditSortBy}
                    onChange={(e) => setAuditSortBy(e.target.value as "created_at" | "action" | "success")}
                    className={selectClass}
                  >
                    <option value="created_at">시각</option>
                    <option value="action">액션</option>
                    <option value="success">결과</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400 sm:text-[10px]">
                    순서
                  </span>
                  <select
                    value={auditSortOrder}
                    onChange={(e) => setAuditSortOrder(e.target.value as "asc" | "desc")}
                    className={selectClass}
                  >
                    <option value="desc">내림차순</option>
                    <option value="asc">오름차순</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {auditLogs.length > 0 ? (
            auditLogs.map((log) => {
              const summary = summarizePayload(log.payload);
              return (
                <div
                  key={log.id}
                  className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.03]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold tabular-nums text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    <span
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                        log.success ? adminUi.successBadge : adminUi.dangerBadge
                      )}
                    >
                      {getResultLabel(log.success)}
                    </span>
                  </div>
                  <p className="mt-2 text-[15px] font-black text-slate-900">{actionDisplayName(log.action)}</p>
                  <p className="mt-1 text-[12px] font-semibold text-slate-500">{getActorLabel(log.actor_email)}</p>
                  <p className="mt-2 line-clamp-3 break-words text-[13px] font-medium leading-snug text-slate-600">
                    {summary}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedAudit(log)}
                    className="mt-4 flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-slate-900 text-[14px] font-black text-white active:scale-[0.99] sm:min-h-10 sm:text-xs"
                  >
                    <Eye className="h-4 w-4 shrink-0" aria-hidden />
                    상세 JSON
                  </button>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center">
              <p className="text-[15px] font-semibold text-slate-500 sm:text-sm">
                조건에 맞는 감사 로그가 없습니다.
              </p>
              <p className="mt-2 text-[13px] font-medium text-slate-400">필터를 완화하거나 기간을 늘려 보세요.</p>
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto custom-scrollbar md:block">
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
                      <td
                        className={cn(adminUi.tableBodyCell, "max-w-[14rem] text-slate-700")}
                        title={log.action}
                      >
                        <span className="font-bold">{actionDisplayName(log.action)}</span>
                      </td>
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
                          className="inline-flex min-h-10 touch-manipulation items-center gap-1 rounded-lg bg-slate-100 px-3 text-[12px] font-black text-slate-700 hover:bg-slate-200 sm:h-8 sm:text-[10px]"
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
                  <td colSpan={6} className="py-14 text-center text-sm font-bold text-slate-500">
                    표시할 관리자 감사 로그가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-[13px] font-bold tabular-nums text-slate-600 sm:text-left sm:text-xs">
            전체 {auditTotalCount.toLocaleString()}건
            {auditTotalCount === 0
              ? ""
              : ` · 이번 페이지 ${(auditPage - 1) * auditPageSize + 1}–${Math.min(auditPage * auditPageSize, auditTotalCount)}`}
          </p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:flex sm:gap-2">
            <Button
              variant="outline"
              className={cn(
                "min-h-12 touch-manipulation rounded-2xl text-[14px] font-black sm:h-8 sm:rounded-lg sm:text-xs",
                adminUi.outlineButton
              )}
              onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
              disabled={auditPage <= 1}
            >
              이전
            </Button>
            <span className="min-w-[5rem] text-center text-[13px] font-black tabular-nums text-slate-800 sm:text-xs">
              {auditPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              className={cn(
                "min-h-12 touch-manipulation rounded-2xl text-[14px] font-black sm:h-8 sm:rounded-lg sm:text-xs",
                adminUi.outlineButton
              )}
              onClick={() => setAuditPage((p) => Math.min(totalPages, p + 1))}
              disabled={auditPage >= totalPages}
            >
              다음
            </Button>
          </div>
        </div>
      </AdminCard>

      {selectedAudit && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-detail-title"
          onClick={() => setSelectedAudit(null)}
        >
          <div
            className={cn(
              "flex max-h-[min(90vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[26px] border border-slate-200 bg-white shadow-2xl",
              "pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:rounded-2xl sm:pb-6"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p id="audit-detail-title" className="text-[15px] font-black leading-snug text-slate-900 sm:text-sm">
                  감사 로그 상세
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] font-bold text-slate-400">{selectedAudit.action}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAudit(null)}
                className="inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-[0.98]"
                aria-label="닫기"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="grid gap-3 px-5 py-4 text-[13px] sm:grid-cols-2 sm:gap-4 sm:px-6 sm:text-xs">
              <p className="text-slate-500">
                표시명:{" "}
                <span className="font-bold text-slate-900">{actionDisplayName(selectedAudit.action)}</span>
              </p>
              <p className="text-slate-500">
                결과: <span className="font-bold text-slate-900">{getResultLabel(selectedAudit.success)}</span>
              </p>
              <p className="text-slate-500 sm:col-span-2">
                실행자: <span className="font-bold text-slate-900">{getActorLabel(selectedAudit.actor_email)}</span>
              </p>
              <p className="text-slate-500 sm:col-span-2">
                시각:{" "}
                <span className="font-bold text-slate-900">{new Date(selectedAudit.created_at).toLocaleString()}</span>
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden px-5 pb-5 sm:px-6 sm:pb-6">
              <pre className="max-h-[min(52vh,420px)] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[12px] leading-relaxed text-slate-800 sm:max-h-80 sm:text-[11px]">
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
        </div>
      )}
    </>
  );
}
