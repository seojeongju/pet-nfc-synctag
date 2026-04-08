"use client";
import { useState, useTransition, useEffect } from "react";
import { registerBulkTags, getAllTags, getTagOpsStats, getTagLinkLogs, getAdminAuditLogs } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminTableHeadCell, AdminTableHeadRow, AdminTableRow } from "@/components/admin/ui/AdminTable";
import { Plus, Search, CheckCircle, AlertCircle, Package, Database, Layers, ArrowUpRight, BarChart3, History, ShieldCheck, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AdminTagsPageClient() {
  type AdminTag = {
    id: string;
    pet_name?: string | null;
    owner_email?: string | null;
    batch_id?: string | null;
    status: string;
    created_at: string;
  };
  const [uids, setUids] = useState("");
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [opsStats, setOpsStats] = useState<{
    totalCount: number;
    activeCount: number;
    unsoldCount: number;
    activationRate: number;
    recentLinks: number;
    failedRegistrations7d: number;
    batches: Array<{
      batch_id: string;
      total_count: number;
      active_count: number;
      unsold_count: number;
      latest_created_at: string;
    }>;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [linkLogs, setLinkLogs] = useState<Array<{
    id: number;
    tag_id: string;
    pet_id: string;
    action: "link" | "unlink";
    created_at: string;
    pet_name?: string | null;
    owner_email?: string | null;
  }>>([]);
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: number;
    action: string;
    actor_email?: string | null;
    success: number;
    payload?: string | null;
    created_at: string;
  }>>([]);
  const [auditSuccessFilter, setAuditSuccessFilter] = useState<"all" | "success" | "failed">("all");
  const [auditDaysFilter, setAuditDaysFilter] = useState<7 | 30 | 90>(30);
  const [auditActorFilter, setAuditActorFilter] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditSortBy, setAuditSortBy] = useState<"created_at" | "action" | "success">("created_at");
  const [auditSortOrder, setAuditSortOrder] = useState<"asc" | "desc">("desc");
  const [auditPage, setAuditPage] = useState(1);
  const auditPageSize = 10;
  const [auditTotalCount, setAuditTotalCount] = useState(0);
  const [selectedAudit, setSelectedAudit] = useState<{
    id: number;
    action: string;
    actor_email?: string | null;
    success: number;
    payload?: string | null;
    created_at: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = (searchParams.get("success") as "all" | "success" | "failed") || "all";
    const days = Number(searchParams.get("days") || 30) as 7 | 30 | 90;
    const actor = searchParams.get("actor") || "";
    const action = searchParams.get("action") || "";
    const sortBy = (searchParams.get("sortBy") as "created_at" | "action" | "success") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const page = Number(searchParams.get("page") || 1);
    setAuditSuccessFilter(success);
    setAuditDaysFilter([7, 30, 90].includes(days) ? days : 30);
    setAuditActorFilter(actor);
    setAuditActionFilter(action);
    setAuditSortBy(sortBy);
    setAuditSortOrder(sortOrder);
    setAuditPage(Number.isFinite(page) && page > 0 ? page : 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTags = async () => {
    const [results, stats, logs, audits] = await Promise.all([
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
    setTags(results);
    setOpsStats(stats);
    setLinkLogs(logs);
    setAuditLogs(audits.rows);
    setAuditTotalCount(audits.total);
  };

  const filteredTags = tags.filter(tag => 
    tag.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tag.pet_name && tag.pet_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const normalizeUid = (uid: string) => uid.trim().toUpperCase();
  const uidTokens = uids
    .split(/[\n,]/)
    .map((u) => normalizeUid(u))
    .filter((u) => u.length > 0);
  const uniqueTokens = Array.from(new Set(uidTokens));
  const duplicateInInputCount = uidTokens.length - uniqueTokens.length;
  const validUidPattern = /^([0-9A-F]{2}:){3,15}[0-9A-F]{2}$|^[A-Z0-9_-]{8,32}$/;
  const invalidInInputCount = uniqueTokens.filter((u) => !validUidPattern.test(u)).length;

  const handleRegister = async () => {
    if (!uids.trim()) return;

    const uidList = uids.split(/[\n,]/).map((u) => u.trim()).filter((u) => u.length > 0);

    if (uidList.length === 0) return;

    startTransition(async () => {
      try {
        const result = await registerBulkTags(uidList);
        setMessage({
          type: "success",
          text: `등록 ${result.registeredCount}개 / 실패 ${result.failedCount}개 (중복입력 ${result.duplicateInRequest}, 기존중복 ${result.duplicateExisting}, 형식오류 ${result.invalidCount})`,
        });
        setUids("");
        fetchTags();
      } catch {
        setMessage({ type: "error", text: "태그 등록 중 오류가 발생했습니다." });
      }
    });
  };

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
          log.actor_email || "system",
          log.success ? "success" : "failed",
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

  useEffect(() => {
    fetchTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditSuccessFilter, auditDaysFilter, auditActorFilter, auditActionFilter, auditSortBy, auditSortOrder, auditPage]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditSuccessFilter, auditDaysFilter, auditActorFilter, auditActionFilter, auditSortBy, auditSortOrder]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("success", auditSuccessFilter);
    params.set("days", String(auditDaysFilter));
    if (auditActorFilter.trim()) params.set("actor", auditActorFilter.trim());
    if (auditActionFilter) params.set("action", auditActionFilter);
    params.set("sortBy", auditSortBy);
    params.set("sortOrder", auditSortOrder);
    params.set("page", String(auditPage));
    router.replace(`/admin/tags?${params.toString()}`);
  }, [auditSuccessFilter, auditDaysFilter, auditActorFilter, auditActionFilter, auditSortBy, auditSortOrder, auditPage, router]);

  const summarizePayload = (payloadRaw?: string | null) => {
    if (!payloadRaw) return "-";
    try {
      const payload = JSON.parse(payloadRaw);
      if (payload?.registeredCount !== undefined) {
        return `등록 ${payload.registeredCount} / 실패 ${payload.failedCount ?? 0}`;
      }
      if (payload?.tagId && payload?.petId) {
        return `tagId=${payload.tagId}, petId=${payload.petId}`;
      }
      if (payload?.error) return String(payload.error);
      return JSON.stringify(payload);
    } catch {
      return payloadRaw;
    }
  };

  const auditTotalPages = Math.max(1, Math.ceil(auditTotalCount / auditPageSize));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit pb-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={adminUi.pageContainer}
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-teal-500 font-black text-[10px] uppercase tracking-[0.2em]">
                <Package className="w-3.5 h-3.5" />
                태그 자산
             </div>
             <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">태그 인벤토리</h1>
             <p className="text-slate-500 text-sm font-bold">시스템 전체 NFC 마스터 데이터 관리 및 인벤토리 추적</p>
          </div>
          
          <Link href="/admin" prefetch={false} className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 transition-colors group">
             <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Layers className="w-4 h-4" />
             </div>
             대시보드
          </Link>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <AdminCard variant="kpi">
            <p className="text-[10px] text-slate-500 font-black uppercase">총 태그</p>
            <p className="text-2xl font-black text-slate-900 mt-2">{opsStats?.totalCount ?? 0}</p>
          </AdminCard>
          <AdminCard variant="kpi">
            <p className="text-[10px] text-slate-500 font-black uppercase">활성</p>
            <p className="text-2xl font-black text-teal-500 mt-2">{opsStats?.activeCount ?? 0}</p>
          </AdminCard>
          <AdminCard variant="kpi">
            <p className="text-[10px] text-slate-500 font-black uppercase">미판매</p>
            <p className="text-2xl font-black text-amber-500 mt-2">{opsStats?.unsoldCount ?? 0}</p>
          </AdminCard>
          <AdminCard variant="kpi">
            <p className="text-[10px] text-slate-500 font-black uppercase">활성화율</p>
            <p className="text-2xl font-black text-indigo-500 mt-2">{opsStats?.activationRate ?? 0}%</p>
          </AdminCard>
          <AdminCard variant="kpi" className="col-span-2 lg:col-span-1">
            <p className="text-[10px] text-slate-500 font-black uppercase">최근 7일 연결</p>
            <p className="text-2xl font-black text-teal-500 mt-2">{opsStats?.recentLinks ?? 0}</p>
          </AdminCard>
          <AdminCard variant="kpi" className="col-span-2 lg:col-span-1">
            <p className="text-[10px] text-slate-500 font-black uppercase">최근 7일 실패 등록</p>
            <p className="text-2xl font-black text-rose-500 mt-2">{opsStats?.failedRegistrations7d ?? 0}</p>
          </AdminCard>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bulk Input Form */}
          <motion.div variants={itemVariants} className="lg:col-span-1 h-fit">
            <AdminCard variant="section" className="space-y-7 relative overflow-hidden">
              <div className="space-y-2 relative z-10">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-400" />
                  신규 태그 등록
                </h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">NFC UID 대량 등록</p>
              </div>

              <div className="relative z-10">
                <textarea
                  value={uids}
                  onChange={(e) => setUids(e.target.value)}
                  placeholder="예: 04:A1:B2:C3, 04:D4:E5:F6..."
                  className="w-full h-80 bg-slate-50 border border-slate-200 rounded-[32px] p-6 text-sm font-mono text-teal-700 focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all resize-none shadow-inner custom-scrollbar"
                />
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-[11px] font-bold text-slate-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>입력 UID</span>
                  <span className="text-slate-700">{uidTokens.length}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>중복 UID(입력 내)</span>
                  <span className={duplicateInInputCount > 0 ? "text-amber-500" : "text-slate-700"}>{duplicateInInputCount}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>형식 오류</span>
                  <span className={invalidInInputCount > 0 ? "text-rose-500" : "text-slate-700"}>{invalidInInputCount}개</span>
                </div>
              </div>

              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "p-4 rounded-2xl flex items-center gap-3 text-xs font-bold relative z-10 border",
                      message.type === "success" ? adminUi.successBadge : adminUi.dangerBadge
                    )}
                  >
                    {message.type === "success" ? <CheckCircle className="w-4 h-4 hover:scale-110 transition-transform" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                onClick={handleRegister} 
                disabled={isPending || !uids.trim()}
                className={cn("w-full h-16 rounded-[24px] group relative z-10", adminUi.darkButton)}
              >
                {isPending ? "시스템 주입 중..." : "태그 인벤토리 등록"}
                <ArrowUpRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
              </Button>

              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl pointer-events-none" />
            </AdminCard>
          </motion.div>

          {/* Tags Inventory List */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <AdminCard variant="section" className="space-y-8 h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-teal-400" />
                    자산 목록 ({filteredTags.length})
                  </h3>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">마스터 데이터 목록</p>
                </div>
                <div className="relative group min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="UID 또는 펫 이름 검색..." 
                        className={adminUi.searchInput}
                    />
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <AdminTableHeadRow>
                      <AdminTableHeadCell className="py-5 px-6 w-[40%]">태그 UID</AdminTableHeadCell>
                      <AdminTableHeadCell className="py-5 px-6">상태</AdminTableHeadCell>
                      <AdminTableHeadCell className="py-5 px-6">연결 정보</AdminTableHeadCell>
                      <AdminTableHeadCell className="py-5 px-6">등록일</AdminTableHeadCell>
                    </AdminTableHeadRow>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTags.length > 0 ? (
                      filteredTags.map((tag) => (
                        <AdminTableRow key={tag.id} className="group transition-all duration-300">
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-teal-500 transition-colors shadow-[0_0_8px_rgba(20,184,166,0)] group-hover:shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                               <span className="font-mono text-[11px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{tag.id}</span>
                            </div>
                            {tag.batch_id && (
                                <p className="text-[9px] text-slate-600 font-black mt-1 uppercase tracking-tighter ml-5">배치: {tag.batch_id}</p>
                            )}
                          </td>
                          <td className="py-5 px-6">
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                              tag.status === 'active' ? adminUi.successBadge : 
                              tag.status === 'unsold' ? adminUi.warningBadge : adminUi.neutralBadge
                            )}>
                              {tag.status}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            {tag.pet_name ? (
                                <div className="space-y-0.5">
                                    <p className={cn(adminUi.tableBodyCellStrong, "p-0 text-xs")}>{tag.pet_name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold truncate max-w-[150px]">{tag.owner_email}</p>
                                </div>
                            ) : (
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">미할당</span>
                            )}
                          </td>
                          <td className={cn(adminUi.tableBodyCell, "py-5 px-6 text-[10px] font-black uppercase tabular-nums")}>
                            {new Date(tag.created_at).toLocaleDateString()}
                          </td>
                        </AdminTableRow>
                      ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="py-24 text-center">
                               <div className="flex flex-col items-center gap-3 opacity-20">
                                  <Database className="w-12 h-12 text-slate-400" />
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">등록된 인벤토리가 없습니다</p>
                               </div>
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <BarChart3 className="w-4 h-4 text-teal-400" />
                  <h4 className="text-sm font-black">최근 배치 등록 통계</h4>
                </div>
                <div className="space-y-2">
                  {(opsStats?.batches ?? []).length > 0 ? (
                    (opsStats?.batches ?? []).map((batch) => (
                      <div key={batch.batch_id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-black text-slate-900">{batch.batch_id}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{new Date(batch.latest_created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase">
                          <span className="text-slate-300">총 {batch.total_count}</span>
                          <span className="text-teal-400">활성 {batch.active_count}</span>
                          <span className="text-amber-400">미판매 {batch.unsold_count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 font-bold">
                      표시할 배치 통계가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </AdminCard>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
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
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                            log.action === "link"
                              ? adminUi.successBadge
                              : adminUi.dangerBadge
                          )}>
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
        </motion.div>

        <motion.div variants={itemVariants}>
          <AdminCard variant="section" className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-violet-300" />
                  <h4 className="text-sm font-black">관리자 액션 로그 / 감사 패널</h4>
                </div>
                <Button onClick={exportAuditCsv} disabled={auditLogs.length === 0} variant="outline" className={cn("h-9 rounded-xl", adminUi.outlineButton)}>
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
                          <td className={cn(adminUi.tableBodyCell, "text-slate-400")}>{log.actor_email || "system"}</td>
                          <td className="py-4 px-4">
                            <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                              log.success ? adminUi.successBadge : adminUi.dangerBadge
                            )}>
                              {log.success ? "success" : "failed"}
                            </span>
                          </td>
                          <td className={adminUi.tableBodyCell}>{summary}</td>
                          <td className="py-4 px-4">
                            <button
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
                총 {auditTotalCount}건 중 {auditTotalCount === 0 ? 0 : (auditPage - 1) * auditPageSize + 1}-{Math.min(auditPage * auditPageSize, auditTotalCount)}건
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
                <span className="text-xs text-slate-600 font-black">{auditPage} / {auditTotalPages}</span>
                <Button
                  variant="outline"
                  className={cn("h-8 rounded-lg", adminUi.outlineButton)}
                  onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                  disabled={auditPage >= auditTotalPages}
                >
                  다음
                </Button>
              </div>
            </div>
          </AdminCard>
        </motion.div>

        {selectedAudit && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-black text-slate-900">감사 로그 상세</h5>
                <button onClick={() => setSelectedAudit(null)} className="text-xs font-black text-slate-400 hover:text-slate-900">닫기</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <p className="text-slate-500">액션: <span className="text-slate-800 font-bold">{selectedAudit.action}</span></p>
                <p className="text-slate-500">결과: <span className="text-slate-800 font-bold">{selectedAudit.success ? "success" : "failed"}</span></p>
                <p className="text-slate-500">실행자: <span className="text-slate-800 font-bold">{selectedAudit.actor_email || "system"}</span></p>
                <p className="text-slate-500">시각: <span className="text-slate-800 font-bold">{new Date(selectedAudit.created_at).toLocaleString()}</span></p>
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
      </motion.div>
    </div>
  );
}
