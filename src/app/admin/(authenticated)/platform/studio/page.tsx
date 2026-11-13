import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
import { resolveAdminScope } from "@/lib/admin-authz";
import { listTagDesignsForAdmin } from "@/lib/admin-platform-data";
import { getDB } from "@/lib/db";
import { formatDateTimeKoSeoul } from "@/lib/format-datetime-ko-seoul";
import { getFormFactor } from "@/lib/platform/form-factors";
import { getPlatformService } from "@/lib/platform/services";
import { getTagMaterial, normalizeTagDesign, type TagDesignStatus } from "@/lib/platform/tag-design";
import type { FormFactorId } from "@/lib/platform/form-factors";
import type { PlatformServiceId } from "@/lib/platform/services";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

export const runtime = "edge";

const PAGE_SIZE = 30;

const STATUS_TABS: Array<{ key: TagDesignStatus | null; label: string }> = [
  { key: null, label: "전체" },
  { key: "draft", label: "작성 중" },
  { key: "ready", label: "디자인 완료" },
  { key: "requested", label: "제작 요청" },
  { key: "locked", label: "제작 중" },
];

const statusBadge: Record<TagDesignStatus, string> = {
  draft: adminUi.neutralBadge,
  ready: adminUi.successBadge,
  requested: adminUi.warningBadge,
  locked: adminUi.warningBadge,
};

function parseStatus(v: string | undefined): TagDesignStatus | null {
  return v === "draft" || v === "ready" || v === "requested" || v === "locked" ? v : null;
}

export default async function AdminStudioDesignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const scope = await resolveAdminScope("admin");
  if (!scope.actor.isPlatformAdmin) redirect("/admin/shop/orders");

  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await listTagDesignsForAdmin(getDB(), { status, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe)}>
      <AdminPageIntro
        title="태그 스튜디오 · 디자인·제작 요청"
        subtitle="고객이 /studio에서 만든 커스텀 태그 디자인입니다. 견적·제작 요청 처리는 P3에서 이 화면에 추가됩니다."
        crumbs={[{ label: "통합 관리자", href: "/admin" }, { label: "태그 스튜디오" }]}
      />

      <nav className="flex flex-wrap gap-2" aria-label="상태 필터">
        {STATUS_TABS.map((t) => {
          const active = t.key === status;
          return (
            <Link
              key={t.label}
              href={t.key ? `/admin/platform/studio?status=${t.key}` : "/admin/platform/studio"}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[11px] font-black transition",
                active ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {!data ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold text-amber-800">
          스튜디오 테이블이 아직 없습니다. 운영 DB에 <code className="font-mono">npm run d1:apply:tag-designs</code>를 적용해 주세요.
        </p>
      ) : (
        <>
          <div className={cn(adminUi.sectionCard, "overflow-x-auto border p-0 sm:p-0")}>
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className={adminUi.tableHeadRow}>
                  <th className={adminUi.tableHeadCell}>디자인</th>
                  <th className={adminUi.tableHeadCell}>고객</th>
                  <th className={adminUi.tableHeadCell}>서비스 · 모양</th>
                  <th className={adminUi.tableHeadCell}>문구 · 재질</th>
                  <th className={adminUi.tableHeadCell}>상태</th>
                  <th className={adminUi.tableHeadCell}>수정일</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[12px] font-bold text-slate-400">
                      해당하는 디자인이 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((r) => {
                    let parsed: unknown = null;
                    try {
                      parsed = JSON.parse(r.design_json);
                    } catch {
                      parsed = null;
                    }
                    const ff = getFormFactor(r.form_factor_id);
                    const spec = ff
                      ? normalizeTagDesign(parsed, r.form_factor_id as FormFactorId, r.service_id as PlatformServiceId)
                      : null;
                    return (
                      <tr key={r.id} className={cn(adminUi.tableRowHover, "border-b border-slate-50 last:border-0")}>
                        <td className={adminUi.tableBodyCellStrong}>
                          <span className="flex items-center gap-2.5">
                            <span
                              className="h-7 w-7 shrink-0 rounded-lg ring-1 ring-slate-200"
                              style={{ backgroundColor: spec?.bodyColor ?? "#E2E8F0" }}
                              aria-hidden
                            />
                            <span>
                              <span className="block">{r.title}</span>
                              <span className="block font-mono text-[10px] text-slate-400">{r.id}</span>
                            </span>
                          </span>
                        </td>
                        <td className={adminUi.tableBodyCell}>
                          <span className="block">{r.user_name ?? "—"}</span>
                          <span className="block text-[10px] text-slate-400">{r.user_email ?? ""}</span>
                        </td>
                        <td className={adminUi.tableBodyCell}>
                          {getPlatformService(r.service_id)?.name ?? r.service_id} · {ff?.name ?? r.form_factor_id}
                        </td>
                        <td className={adminUi.tableBodyCell}>
                          <span className="block max-w-[14rem] truncate">{spec?.lines.filter(Boolean).join(" / ") || "—"}</span>
                          <span className="block text-[10px] text-slate-400">
                            {spec ? `${getTagMaterial(spec.materialId).name} · ${spec.textStyle === "raised" ? "양각" : "음각"}` : ""}
                          </span>
                        </td>
                        <td className={adminUi.tableBodyCell}>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black", statusBadge[r.status] ?? adminUi.neutralBadge)}>
                            {STATUS_TABS.find((t) => t.key === r.status)?.label ?? r.status}
                          </span>
                        </td>
                        <td className={adminUi.tableBodyCell}>{formatDateTimeKoSeoul(r.updated_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination
            aria-label="스튜디오 디자인 페이지"
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(data.total / PAGE_SIZE))}
            buildHref={(p) => `/admin/platform/studio?${new URLSearchParams({ ...(status ? { status } : {}), page: String(p) })}`}
          />
        </>
      )}
    </div>
  );
}
