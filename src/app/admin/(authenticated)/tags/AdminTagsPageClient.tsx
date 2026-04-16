"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Package, Layers } from "lucide-react";
import { adminUi } from "@/styles/admin/ui";
import type { AdminTag, AdminAuditLogRow, TagLinkLogRow, TagOpsStats } from "@/types/admin-tags";
import { TagOpsKpiCards } from "@/components/admin/tags/TagOpsKpiCards";
import { TagBulkRegisterCard } from "@/components/admin/tags/TagBulkRegisterCard";
import { TagInventorySection } from "@/components/admin/tags/TagInventorySection";
import { TagLinkLogsSection } from "@/components/admin/tags/TagLinkLogsSection";
import { AdminAuditLogsPanel } from "@/components/admin/tags/AdminAuditLogsPanel";
import { AdminNfcWriteCard } from "@/components/admin/tags/AdminNfcWriteCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function AdminTagsPageClient({
  tags,
  opsStats,
  linkLogs,
  auditLogs,
  auditTotalCount,
}: {
  tags: AdminTag[];
  opsStats: TagOpsStats;
  linkLogs: TagLinkLogRow[];
  auditLogs: AdminAuditLogRow[];
  auditTotalCount: number;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className={adminUi.pageContainer}>
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-teal-500 font-black text-[10px] uppercase tracking-[0.2em]">
              <Package className="w-3.5 h-3.5" />
              태그 자산
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">태그 인벤토리</h1>
            <p className="text-slate-500 text-sm font-bold">시스템 전체 NFC 마스터 데이터 관리 및 인벤토리 추적</p>
          </div>

          <Link
            href="/admin"
            prefetch={false}
            className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 transition-colors group"
          >
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            대시보드
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <TagOpsKpiCards opsStats={opsStats} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div variants={itemVariants} className="lg:col-span-1 h-fit space-y-8">
            <TagBulkRegisterCard />
            <AdminNfcWriteCard />
          </motion.div>
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <TagInventorySection tags={tags} opsStats={opsStats} />
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <TagLinkLogsSection linkLogs={linkLogs} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AdminAuditLogsPanel auditLogs={auditLogs} auditTotalCount={auditTotalCount} />
        </motion.div>
      </motion.div>
    </div>
  );
}
