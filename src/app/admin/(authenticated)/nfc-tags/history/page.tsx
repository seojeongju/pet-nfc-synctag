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
        <div className={adminUi.nfcTagsPageBody}>
          <div className="mb-8 space-y-6">
            <AdminPageIntro
              title="④ 연결·감사 이력"
              subtitle="연결 로그·감사 로그 조회. 필터·정렬은 아래 패널·도움말을 참고하세요."
              crumbs={[
                { label: "관리자", href: "/admin" },
                { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
                { label: "연결·감사" },
              ]}
            />
          </div>
        </div>
        <div className={adminUi.nfcTagsPageBody}>
          <TagLinkLogsSection linkLogs={linkLogs} />
        </div>
        <div className={adminUi.nfcTagsPageBody}>
          <AdminAuditLogsPanel auditLogs={audits.rows as AdminAuditLogRow[]} auditTotalCount={audits.total} />
        </div>
      </div>
    </Suspense>
  );
}
