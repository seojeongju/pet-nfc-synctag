import { Suspense } from "react";
import AdminTagsPageClient from "./AdminTagsPageClient";
import { getAllTags, getTagOpsStats, getTagLinkLogs, getAdminAuditLogs } from "@/app/actions/admin";

export const runtime = "edge";

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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

  const [tags, opsStats, linkLogs, audits] = await Promise.all([
    getAllTags(),
    getTagOpsStats(),
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
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <AdminTagsPageClient 
         tags={tags as any}
         opsStats={opsStats}
         linkLogs={linkLogs}
         auditLogs={audits.rows}
         auditTotalCount={audits.total}
      />
    </Suspense>
  );
}
