import { listAdminPrivacyConsents } from "@/app/actions/admin-privacy";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminPagination } from "@/components/admin/ui/AdminPagination";
import { AdminTableHeadCell, AdminTableHeadRow, AdminTableRow } from "@/components/admin/ui/AdminTable";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isPlatformAdminRole } from "@/lib/platform-admin";

export const runtime = "edge";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
}>;

function statusLabel(row: {
  termsVersion: string | null;
  privacyVersion: string | null;
  locationVersion: string | null;
}, latest: { terms: string; privacy: string; location: string }) {
  if (!row.termsVersion || !row.privacyVersion || !row.locationVersion) return "미동의";
  if (
    row.termsVersion === latest.terms &&
    row.privacyVersion === latest.privacy &&
    row.locationVersion === latest.location
  ) {
    return "최신 동의";
  }
  return "버전 불일치";
}

export default async function AdminPrivacyPage({ searchParams }: { searchParams: SearchParams }) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const uid = session?.user?.id;
  if (!uid) {
    redirect("/admin/login");
  }
  const roleRow = await context.env.DB
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(uid)
    .first<{ role?: string | null }>();
  if (!isPlatformAdminRole(roleRow?.role)) {
    redirect("/admin");
  }

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status =
    sp.status === "current" || sp.status === "missing" || sp.status === "outdated"
      ? sp.status
      : "all";
  const page = Math.max(1, Number(sp.page) || 1);

  const data = await listAdminPrivacyConsents({
    q: q || undefined,
    status,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const buildHref = (nextPage: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status !== "all") p.set("status", status);
    p.set("page", String(nextPage));
    return `/admin/privacy?${p.toString()}`;
  };

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe, "space-y-6")}>
      <AdminPageIntro
        title="개인정보 동의 이력"
        subtitle="사용자별 필수 약관/개인정보/위치 동의 상태와 버전 일치 여부를 확인합니다."
        crumbs={[{ label: "관리 홈", href: "/admin" }, { label: "개인정보 동의 이력" }]}
      />

      <AdminCard variant="section" className="space-y-4">
        <form method="get" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="이메일 또는 이름 검색"
            className={adminUi.input}
          />
          <select name="status" defaultValue={status} className={adminUi.input}>
            <option value="all">전체 상태</option>
            <option value="current">최신 동의</option>
            <option value="missing">미동의</option>
            <option value="outdated">버전 불일치</option>
          </select>
          <button type="submit" className={cn(adminUi.darkButton, "h-10 rounded-xl px-4 text-xs")}>
            조회
          </button>
        </form>

        <div className="rounded-2xl border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <AdminTableHeadRow>
                  <AdminTableHeadCell>사용자</AdminTableHeadCell>
                  <AdminTableHeadCell>상태</AdminTableHeadCell>
                  <AdminTableHeadCell>약관 버전</AdminTableHeadCell>
                  <AdminTableHeadCell>개인정보 버전</AdminTableHeadCell>
                  <AdminTableHeadCell>위치 버전</AdminTableHeadCell>
                  <AdminTableHeadCell>최종 동의 갱신</AdminTableHeadCell>
                </AdminTableHeadRow>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <AdminTableRow>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-slate-400">
                      조회된 동의 이력이 없습니다.
                    </td>
                  </AdminTableRow>
                ) : (
                  data.rows.map((row) => {
                    const label = statusLabel(row, data.latestVersions);
                    const badgeClass =
                      label === "최신 동의"
                        ? adminUi.successBadge
                        : label === "미동의"
                          ? adminUi.dangerBadge
                          : adminUi.warningBadge;
                    return (
                      <AdminTableRow key={row.userId}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-black text-slate-800">{row.email}</p>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {row.name || "이름 미입력"} · {row.role || "user"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-black", badgeClass)}>
                            {label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-600">
                          {row.termsVersion || "-"}
                        </td>
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-600">
                          {row.privacyVersion || "-"}
                        </td>
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-600">
                          {row.locationVersion || "-"}
                        </td>
                        <td className="px-4 py-3 text-[11px] font-semibold text-slate-500">
                          {row.consentUpdatedAt || "-"}
                        </td>
                      </AdminTableRow>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-500">
            총 {data.total}명 · {data.page}/{totalPages} 페이지
          </p>
          <AdminPagination
            aria-label="개인정보 동의 이력 페이지"
            currentPage={data.page}
            totalPages={totalPages}
            buildHref={buildHref}
          />
        </div>
      </AdminCard>
    </div>
  );
}

