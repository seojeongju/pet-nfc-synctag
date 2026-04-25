import { Suspense } from "react";
import { getTagLinkLogsPage, getAdminAuditLogs } from "@/app/actions/admin";
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

  const lpageRaw = Array.isArray(params.lpage) ? params.lpage[0] : params.lpage;
  const lpsRaw = Array.isArray(params.lps) ? params.lps[0] : params.lps;
  const linkPage = Math.max(1, Number(lpageRaw) || 1);
  let linkPageSize = Number(lpsRaw) || 20;
  if (!Number.isFinite(linkPageSize)) linkPageSize = 20;
  linkPageSize = Math.min(100, Math.max(5, Math.floor(linkPageSize)));

  const auditSuccessFilter = (params.success as "all" | "success" | "failed") || "all";
  const auditDaysFilter = Number(params.days) || 30;
  const auditActorFilter = (params.actor as string) || "";
  const auditActionFilter = (params.action as string) || "";
  const auditPlatformFilter = (params.platform as "all" | "android" | "ios" | "unknown") || "all";
  const auditModeFilter = (params.mode as "all" | "linku" | "tools" | "unknown") || "all";
  const auditAppVersionFilter = (params.appVersion as string) || "";
  const auditSortBy = (params.sortBy as "created_at" | "action" | "success") || "created_at";
  const auditSortOrder = (params.sortOrder as "asc" | "desc") || "desc";
  const auditPage = Number(params.page) || 1;
  const auditPageSize = 10;

  const [linkPageResult, audits] = await Promise.all([
    getTagLinkLogsPage({ page: linkPage, pageSize: linkPageSize }),
    getAdminAuditLogs({
      limit: auditPageSize,
      page: auditPage,
      success: auditSuccessFilter,
      days: auditDaysFilter,
      actorEmail: auditActorFilter,
      action: auditActionFilter,
      platform: auditPlatformFilter,
      mode: auditModeFilter,
      appVersion: auditAppVersionFilter,
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
              subtitle="위(연결/해제)는 lpage·lps, 아래(감사)는 page·필터·days로 URL이 달리며 각각 독립 페이징됩니다."
              crumbs={[
                { label: "관리자", href: "/admin" },
                { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
                { label: "연결·감사" },
              ]}
            />
          </div>
        </div>
        <div className={adminUi.nfcTagsPageBody}>
          <TagLinkLogsSection linkPage={linkPageResult} />
        </div>
        <div className={adminUi.nfcTagsPageBody}>
          <AdminAuditLogsPanel auditLogs={audits.rows as AdminAuditLogRow[]} auditTotalCount={audits.total} />
        </div>
      </div>
    </Suspense>
  );
}
