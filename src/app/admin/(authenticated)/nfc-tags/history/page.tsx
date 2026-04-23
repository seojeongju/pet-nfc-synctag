import { Suspense } from "react";
import { getTagLinkLogs, getAdminAuditLogs } from "@/app/actions/admin";
import type { AdminAuditLogRow } from "@/types/admin-tags";
import { TagLinkLogsSection } from "@/components/admin/tags/TagLinkLogsSection";
import { AdminAuditLogsPanel } from "@/components/admin/tags/AdminAuditLogsPanel";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { cn } from "@/lib/utils";

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
  const auditPlatformFilter = (params.platform as "all" | "android" | "ios" | "unknown") || "all";
  const auditModeFilter = (params.mode as "all" | "linku" | "tools" | "unknown") || "all";
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
      platform: auditPlatformFilter,
      mode: auditModeFilter,
      sortBy: auditSortBy,
      sortOrder: auditSortOrder,
    }),
  ]);

  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#F8FAFC]" />}>
      <div className={cn("relative space-y-8 sm:space-y-10", adminUi.pageBottomSafe)}>
        <div className={adminUi.nfcTagsPageBody}>
          <div className="mb-8 space-y-6">
            <AdminPageIntro
              title="④ 연결·감사 이력"
              subtitle="위는 태그–펫 연결 이력, 아래는 관리자 감사 로그입니다. 감사 필터는 URL과 동기화되며 모바일에서는 카드 목록으로 표시됩니다."
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
