"use client";

import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminTableHeadCell, AdminTableHeadRow, AdminTableRow } from "@/components/admin/ui/AdminTable";
import { History } from "lucide-react";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import type { TagLinkLogRow } from "@/types/admin-tags";

export function TagLinkLogsSection({ linkLogs }: { linkLogs: TagLinkLogRow[] }) {
  return (
    <AdminCard variant="section" className="space-y-6">
      <div className="flex items-center gap-2 text-slate-700">
        <History className="w-4 h-4 text-cyan-300" />
        <h4 className="text-sm font-black">태그 연결 이력 대시보드</h4>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
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
                  <td className={cn(adminUi.tableBodyCell, "text-slate-400")}>{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        log.action === "link" ? adminUi.successBadge : adminUi.dangerBadge
                      )}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className={adminUi.tableBodyCellMono}>{log.tag_id}</td>
                  <td className={adminUi.tableBodyCellStrong}>{log.pet_name || "알 수 없음"}</td>
                  <td className={cn(adminUi.tableBodyCell, "text-slate-400")}>{log.owner_email || "-"}</td>
                </AdminTableRow>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-14 text-center text-xs text-slate-500 font-bold">
                  연결/해제 이력이 아직 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}
