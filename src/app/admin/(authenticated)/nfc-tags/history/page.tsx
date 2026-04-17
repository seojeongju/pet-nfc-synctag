import { Suspense } from "react";
import { getTagLinkLogs, getAdminAuditLogs } from "@/app/actions/admin";
import type { AdminAuditLogRow } from "@/types/admin-tags";
import { TagLinkLogsSection } from "@/components/admin/tags/TagLinkLogsSection";
import { AdminAuditLogsPanel } from "@/components/admin/tags/AdminAuditLogsPanel";
import { adminUi } from "@/styles/admin/ui";

export const runtime = "edge";

export default async function AdminNfcTagsHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const auditSuccessFilter = (params.success as "all" | "success" | "failed") || "all";
  const auditDaysFilter = Number(params.days) || 30;
  const auditActorFilter = (params.actor as string) || "";
  const auditActionFilter = (params.action as string) || "";
  const auditSortBy = (params.sortBy as "created_at" | "action" | "success") || "created_at";
  const auditSortOrder = (params.sortOrder as "asc" | "desc") || "desc";
  const auditPage = Number(params.page) || 1;
  const auditPageSize = 10;

  const [linkLogs, audits] = await Promise.all([
    getTagLinkLogs(30),
    getAdminAuditLogs({
      limit: auditPageSize,
      page: auditPage,
      success: auditSuccessFilter,
      days: auditDaysFilter,
      actorEmail: auditActorFilter,
      action: auditActionFilter,
      sortBy: auditSortBy,
      sortOrder: auditSortOrder,
    }),
  ]);

  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#F8FAFC]" />}>
      <div className="relative space-y-10 pb-20">
        <div className={adminUi.pageContainer}>
          <div className="mb-6 space-y-1">
            <h1 className="text-xl font-black text-slate-900 sm:text-2xl">연결·감사 이력</h1>
            <p className="text-sm font-bold text-slate-500">태그 연결 로그와 관리자 감사 로그를 조회합니다.</p>
          </div>
        </div>
        <div className={adminUi.pageContainer}>
          <TagLinkLogsSection linkLogs={linkLogs} />
        </div>
        <div className={adminUi.pageContainer}>
          <AdminAuditLogsPanel auditLogs={audits.rows as AdminAuditLogRow[]} auditTotalCount={audits.total} />
        </div>
      </div>
    </Suspense>
  );
}
