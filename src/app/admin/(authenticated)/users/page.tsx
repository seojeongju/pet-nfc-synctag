import { listPlanCodeOptionsAdmin, listUsersAdmin } from "@/app/actions/admin-users";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import UsersAdminClient from "./UsersAdminClient";
import { resolveAdminScope } from "@/lib/admin-authz";

export const runtime = "edge";

type Search = {
  q?: string;
  role?: string;
  tenant?: string;
  page?: string;
};

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const scope = await resolveAdminScope("admin");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const role =
    sp.role === "user" || sp.role === "org_admin" || sp.role === "platform_admin" ? sp.role : "all";
  const requestedTenantId = (sp.tenant ?? "").trim() || null;
  const tenantId = scope.actor.isPlatformAdmin
    ? requestedTenantId
    : (scope.tenantIds?.[0] ?? null);
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ rows, total, page: pageOut, pageSize }, planOptions] = await Promise.all([
    listUsersAdmin({
      q: q || undefined,
      role: scope.actor.isPlatformAdmin ? (role === "all" ? "all" : role) : "all",
      tenantId: tenantId ?? undefined,
      page,
    }),
    scope.actor.isPlatformAdmin
      ? listPlanCodeOptionsAdmin()
      : Promise.resolve([
          { code: "free", name: "무료" },
          { code: "starter", name: "스타터" },
          { code: "business", name: "비즈니스" },
        ]),
  ]);

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe, "space-y-6")}>
      <AdminPageIntro
        title="사용자 관리"
        subtitle="플랫폼 전체 사용자 목록입니다. 플랫폼 역할과 개인 플랜 코드(레거시 subscriptionStatus)를 바로 조정하고, 비밀번호 초기화·계정 삭제까지 수행할 수 있습니다."
        crumbs={[
          { label: "관리 홈", href: "/admin" },
          { label: "사용자 관리" },
        ]}
      />
      <UsersAdminClient
        initialRows={rows}
        total={total}
        page={pageOut}
        pageSize={pageSize}
        initialQ={q}
        initialRole={role}
        tenantId={tenantId}
        planOptions={planOptions}
        isPlatformAdmin={scope.actor.isPlatformAdmin}
      />
    </div>
  );
}
