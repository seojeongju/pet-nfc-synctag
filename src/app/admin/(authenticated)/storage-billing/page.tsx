import {
  updateStorageCheckoutIntentStatus,
  listStorageCheckoutIntents,
  getStorageCheckoutIntentStatusCounts,
} from "@/app/actions/storage-billing-admin";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["all", "requested", "processing", "completed", "failed", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

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

function statusLabel(status: "requested" | "processing" | "completed" | "failed" | "cancelled"): string {
  switch (status) {
    case "requested":
      return "요청 접수";
    case "processing":
      return "처리중";
    case "completed":
      return "완료";
    case "failed":
      return "실패";
    case "cancelled":
      return "취소";
  }
}

function statusBadgeClass(status: StatusFilter): string {
  if (status === "requested") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "processing") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (status === "completed") return "bg-teal-50 text-teal-700 border-teal-200";
  if (status === "failed") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "cancelled") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
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

export default async function AdminStorageBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  try {
    const sp = await searchParams;
    const status: StatusFilter =
      typeof sp.status === "string" && STATUS_FILTERS.includes(sp.status as StatusFilter)
        ? (sp.status as StatusFilter)
        : "all";
    const query = typeof sp.q === "string" ? sp.q.trim() : "";
    const intents = await listStorageCheckoutIntents({
      limit: 120,
      status,
      query,
    });
    const statusCounts = await getStorageCheckoutIntentStatusCounts(query);
    const totalCount = statusCounts.reduce((sum, item) => sum + item.count, 0);

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
      <div className="space-y-6 px-4 py-6 sm:px-6 font-outfit">
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">Storage Billing</p>
          <h1 className="text-2xl font-black text-slate-900">추가 용량 구매 요청 관리</h1>
          <p className="text-sm font-semibold text-slate-500">
            요청 상태를 갱신하고, 완료 처리 시 사용자 추가 용량 구독이 자동으로 생성됩니다.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <a
                href={`/admin/storage-billing?status=all${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${status === "all" ? "bg-slate-900 text-white border-slate-900" : statusBadgeClass("all")}`}
              >
                전체 {totalCount}
              </a>
              {statusCounts.map((item) => (
                <a
                  key={item.status}
                  href={`/admin/storage-billing?status=${item.status}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
                    status === item.status ? "bg-slate-900 text-white border-slate-900" : statusBadgeClass(item.status)
                  }`}
                >
                  {statusLabel(item.status)} {item.count}
                </a>
              ))}
            </div>
          </div>
          <form method="get" className="border-b border-slate-100 p-4 grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_auto]">
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-700"
            >
              <option value="all">전체 상태</option>
              <option value="requested">{statusLabel("requested")}</option>
              <option value="processing">{statusLabel("processing")}</option>
              <option value="completed">{statusLabel("completed")}</option>
              <option value="failed">{statusLabel("failed")}</option>
              <option value="cancelled">{statusLabel("cancelled")}</option>
            </select>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="요청 ID / 사용자 ID / 이메일 검색"
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] font-semibold outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[10px] font-black text-slate-700 hover:bg-slate-50"
            >
              필터 적용
            </button>
          </form>
          {intents.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-black text-slate-700">조건에 맞는 구매 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {intents.map((intent) => (
                <article key={intent.id} className="p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-slate-900 break-words">
                        {intent.product_name} · +{formatQuotaLabel(intent.extra_quota_mb)} · 월{" "}
                        {formatKrw(intent.monthly_price_krw)}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500 mt-1 break-words">
                        요청자: {intent.user_email || intent.user_id}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">
                        요청 ID: {intent.id} · 접수 {intent.created_at}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black ${
                        intent.status === "completed"
                          ? "bg-teal-50 text-teal-700"
                          : intent.status === "requested"
                            ? "bg-amber-50 text-amber-700"
                            : intent.status === "processing"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {statusLabel(intent.status)}
                    </span>
                  </div>
                  <form action={updateIntentAction} className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <input type="hidden" name="intent_id" value={intent.id} />
                    <select
                      name="status"
                      defaultValue={intent.status}
                      className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-700"
                    >
                      {editableStatusesForCurrent(intent.status).map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      name="note"
                      defaultValue={intent.note ?? ""}
                      placeholder="관리 메모 (선택)"
                      className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[11px] font-semibold outline-none focus:border-teal-400"
                    />
                    <button
                      type="submit"
                      disabled={intent.status === "completed" || intent.status === "cancelled"}
                      className="h-9 rounded-lg bg-slate-900 px-4 text-[10px] font-black text-white hover:bg-teal-600"
                    >
                      상태 저장
                    </button>
                  </form>
                  {intent.status === "completed" || intent.status === "cancelled" ? (
                    <p className="text-[10px] font-bold text-slate-400">
                      {intent.status === "completed"
                        ? "완료된 요청은 다시 변경할 수 없습니다."
                        : "취소된 요청은 다시 변경할 수 없습니다."}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  } catch (error: unknown) {
    rethrowNextControlFlowErrors(error);
    console.error("[admin/storage-billing] error:", error);
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-lg font-black text-slate-900">구매 요청 목록을 불러오지 못했습니다.</p>
      </div>
    );
  }
}
