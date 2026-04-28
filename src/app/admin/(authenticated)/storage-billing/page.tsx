import {
  updateStorageCheckoutIntentStatus,
  listStorageCheckoutIntents,
  getStorageCheckoutIntentStatusCounts,
  getStorageCheckoutIntentSlaCounts,
} from "@/app/actions/storage-billing-admin";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import { 
  Database, Search, AlertTriangle, Clock, CheckCircle2, XCircle, Activity, Box, HardDrive, User 
} from "lucide-react";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["all", "requested", "processing", "completed", "failed", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const SLA_FILTERS = ["none", "requested_over_24h", "processing_over_24h"] as const;
type SlaFilter = (typeof SLA_FILTERS)[number];

function getStatusConfig(status: StatusFilter | "all") {
  switch (status) {
    case "all": return { label: "전체", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Box };
    case "requested": return { label: "요청 접수", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock };
    case "processing": return { label: "처리중", color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: Activity };
    case "completed": return { label: "완료", color: "bg-teal-100 text-teal-800 border-teal-200", icon: CheckCircle2 };
    case "failed": return { label: "실패", color: "bg-rose-100 text-rose-800 border-rose-200", icon: XCircle };
    case "cancelled": return { label: "취소", color: "bg-slate-100 text-slate-700 border-slate-200", icon: XCircle };
    default: return { label: "알 수 없음", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Box };
  }
}

function formatQuotaLabel(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)}GB`;
  }
  return `${mb}MB`;
}

function formatKrw(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function editableStatusesForCurrent(
  current: "requested" | "processing" | "completed" | "failed" | "cancelled"
) {
  if (current === "requested") return ["requested", "processing", "completed", "failed", "cancelled"] as const;
  if (current === "processing") return ["processing", "completed", "failed", "cancelled"] as const;
  if (current === "failed") return ["failed", "processing", "cancelled"] as const;
  if (current === "completed") return ["completed"] as const;
  return ["cancelled"] as const;
}

function slaFilterLabel(sla: SlaFilter): string | null {
  if (sla === "requested_over_24h") return "요청 24시간 초과";
  if (sla === "processing_over_24h") return "처리중 24시간 초과";
  return null;
}

export default async function AdminStorageBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sla?: string }>;
}) {
  try {
    const sp = await searchParams;
    const status: StatusFilter =
      typeof sp.status === "string" && STATUS_FILTERS.includes(sp.status as StatusFilter)
        ? (sp.status as StatusFilter)
        : "all";
    const sla: SlaFilter =
      typeof sp.sla === "string" && SLA_FILTERS.includes(sp.sla as SlaFilter)
        ? (sp.sla as SlaFilter)
        : "none";
    const query = typeof sp.q === "string" ? sp.q.trim() : "";
    const intents = await listStorageCheckoutIntents({
      limit: 120,
      status,
      query,
      sla,
    });
    const statusCounts = await getStorageCheckoutIntentStatusCounts(query);
    const slaCounts = await getStorageCheckoutIntentSlaCounts(query);
    const totalCount = statusCounts.reduce((sum, item) => sum + item.count, 0);
    const activeSlaLabel = slaFilterLabel(sla);
    const activeSlaCount =
      sla === "requested_over_24h"
        ? slaCounts.requestedOver24h
        : sla === "processing_over_24h"
          ? slaCounts.processingOver24h
          : null;

    async function updateIntentAction(formData: FormData) {
      "use server";
      const intentId = String(formData.get("intent_id") ?? "");
      const status = String(formData.get("status") ?? "");
      const note = String(formData.get("note") ?? "");
      await updateStorageCheckoutIntentStatus({
        intentId,
        status: status as "requested" | "processing" | "completed" | "failed" | "cancelled",
        note,
      });
    }

    return (
      <div className="space-y-8 px-4 py-8 sm:px-8 font-outfit max-w-7xl mx-auto">
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 sm:p-10 text-white shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Database className="w-48 h-48 -rotate-12" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wider text-teal-300 ring-1 ring-white/20 backdrop-blur-md">
              <Database className="w-3.5 h-3.5" />
              STORAGE BILLING
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">추가 용량 구매 요청 관리</h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
              고객의 스토리지 추가 구매 요청 상태를 모니터링하고 관리합니다. 결제 처리가 완료되면 시스템에서 자동으로 용량 구독을 갱신합니다.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/admin/storage-billing?status=all&sla=${sla}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200 ${status === "all" ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"}`}
              >
                전체
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${status === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>{totalCount}</span>
              </a>
              {statusCounts.map((item) => {
                const config = getStatusConfig(item.status);
                const Icon = config.icon;
                const isActive = status === item.status;
                return (
                  <a
                    key={item.status}
                    href={`/admin/storage-billing?status=${item.status}&sla=${sla}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                    className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200 ${
                      isActive 
                        ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                        : `bg-white text-slate-600 hover:bg-slate-50 border-slate-200`
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-teal-400" : ""}`} />
                    {config.label}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>{item.count}</span>
                  </a>
                );
              })}
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-600">SLA 모니터링</span>
              </div>
              <a
                href={`/admin/storage-billing?status=all&sla=requested_over_24h${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  sla === "requested_over_24h"
                    ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300/50 shadow-sm"
                    : "bg-amber-50/50 text-amber-600 hover:bg-amber-100/50"
                }`}
              >
                요청 지연 (24h+)
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${sla === "requested_over_24h" ? "bg-amber-200" : "bg-amber-200/50"}`}>{slaCounts.requestedOver24h}</span>
              </a>
              <a
                href={`/admin/storage-billing?status=all&sla=processing_over_24h${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  sla === "processing_over_24h"
                    ? "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300/50 shadow-sm"
                    : "bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100/50"
                }`}
              >
                처리 지연 (24h+)
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${sla === "processing_over_24h" ? "bg-indigo-200" : "bg-indigo-200/50"}`}>{slaCounts.processingOver24h}</span>
              </a>
              {sla !== "none" && (
                <a
                  href={`/admin/storage-billing?status=${status}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 px-2 py-1.5 rounded-lg"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  필터 해제
                </a>
              )}
            </div>
          </div>

          <form method="get" className="flex w-full flex-col gap-3 lg:w-auto sm:flex-row">
            <input type="hidden" name="sla" value={sla} />
            <div className="relative flex-1 sm:w-64 xl:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="ID 또는 이메일 검색..."
                className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                name="status"
                defaultValue={status}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-sm appearance-none pr-9"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
              >
                <option value="all">상태 전체</option>
                <option value="requested">요청 접수</option>
                <option value="processing">처리중</option>
                <option value="completed">완료</option>
                <option value="failed">실패</option>
                <option value="cancelled">취소</option>
              </select>
              <button
                type="submit"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-teal-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                검색
              </button>
            </div>
          </form>
        </div>

        {activeSlaLabel && (
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/30 px-5 py-4 border border-amber-200/50 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-bold text-amber-900">
              현재 <span className="text-amber-600 underline decoration-amber-300 underline-offset-4">{activeSlaLabel}</span> 상태인 항목만 보고 있습니다 ({activeSlaCount ?? 0}건)
            </p>
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {intents.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 mb-6 border border-slate-100 shadow-inner">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-lg font-black text-slate-700">조건에 맞는 구매 요청이 없습니다</p>
              <p className="text-sm font-medium text-slate-500 mt-2">다른 필터나 검색어를 시도해 보세요.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {intents.map((intent) => {
                const statusConfig = getStatusConfig(intent.status);
                const StatusIcon = statusConfig.icon;
                const isFinal = intent.status === "completed" || intent.status === "cancelled";
                
                return (
                  <article key={intent.id} className="p-6 transition-colors hover:bg-slate-50/50 flex flex-col xl:flex-row xl:items-center gap-6 group">
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start gap-5">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <HardDrive className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-lg font-black text-slate-900 break-words">
                            {intent.product_name}
                          </h3>
                          <span className="rounded-full bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 text-xs font-black text-slate-700">
                            +{formatQuotaLabel(intent.extra_quota_mb)}
                          </span>
                          <span className="text-sm font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                            {formatKrw(intent.monthly_price_krw)} / 월
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3.5 text-sm font-medium text-slate-500 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold">{intent.user_email || intent.user_id}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {intent.created_at}
                          </div>
                          <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-100">ID: {intent.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 bg-slate-50/80 p-4 xl:bg-transparent xl:p-0 rounded-2xl xl:rounded-none border border-slate-100 xl:border-none">
                      <div className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border ${statusConfig.color} shadow-sm self-start sm:self-auto min-w-[100px]`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                      </div>

                      <div className="hidden sm:block w-px h-12 bg-slate-200 xl:hidden"></div>

                      <form action={updateIntentAction} className="flex flex-col sm:flex-row items-stretch gap-2.5 flex-1 sm:flex-initial">
                        <input type="hidden" name="intent_id" value={intent.id} />
                        <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
                          <select
                            name="status"
                            defaultValue={intent.status}
                            disabled={isFinal}
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-sm appearance-none pr-9 disabled:opacity-60 disabled:bg-slate-100"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                          >
                            {editableStatusesForCurrent(intent.status).map((status) => {
                              const cfg = getStatusConfig(status);
                              return (
                                <option key={status} value={status}>
                                  {cfg.label}
                                </option>
                              );
                            })}
                          </select>
                          <input
                            type="text"
                            name="note"
                            defaultValue={intent.note ?? ""}
                            disabled={isFinal}
                            placeholder="관리 메모 (선택)"
                            className="w-full sm:w-56 h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-sm disabled:opacity-60 disabled:bg-slate-100 placeholder:text-slate-400"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isFinal}
                          className="h-11 shrink-0 rounded-xl bg-slate-900 px-6 text-sm font-black text-white shadow-md transition-all hover:bg-teal-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:hover:bg-slate-900 disabled:hover:translate-y-0"
                        >
                          상태 변경
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  } catch (error: unknown) {
    rethrowNextControlFlowErrors(error);
    console.error("[admin/storage-billing] error:", error);
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 mb-6 border border-rose-100">
          <XCircle className="w-10 h-10 text-rose-500" />
        </div>
        <p className="text-xl font-black text-slate-900">구매 요청 목록을 불러오지 못했습니다.</p>
        <p className="text-slate-500 mt-2 font-medium">잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }
}
