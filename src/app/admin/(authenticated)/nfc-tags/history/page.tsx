import { Suspense } from "react";
import { getTagLinkLogs, getAdminAuditLogs } from "@/app/actions/admin";
import type { AdminAuditLogRow } from "@/types/admin-tags";
import { TagLinkLogsSection } from "@/components/admin/tags/TagLinkLogsSection";
import { AdminAuditLogsPanel } from "@/components/admin/tags/AdminAuditLogsPanel";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";

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
          <div className="mb-8 space-y-6">
            <AdminPageIntro
              title="④ 연결·감사 이력"
              subtitle="보호자·대상 연결 로그와 관리자 NFC URL 기록 등 감사 로그를 조회합니다. 필터와 정렬은 아래 패널에서 조정합니다."
              crumbs={[
                { label: "관리자", href: "/admin" },
                { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
                { label: "연결·감사" },
              ]}
            />
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
