import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { listTenantsForUser } from "@/lib/tenant-membership";

export const runtime = "edge";

export default async function TenantManageEntryPage() {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const tenants = await listTenantsForUser(context.env.DB, userId).catch(() => []);
  const adminTenants = tenants.filter((t) => t.role === "owner" || t.role === "admin");

  if (adminTenants.length === 1) {
    redirect(`/hub/org/${encodeURIComponent(adminTenants[0]!.id)}/manage`);
  }
  if (adminTenants.length === 0) {
    redirect("/hub?billing_msg=" + encodeURIComponent("소속된 조직 관리자 권한이 없습니다. 슈퍼어드민에게 문의하세요."));
  }
  redirect("/hub?billing_msg=" + encodeURIComponent("다중 조직 관리자 소속입니다. 슈퍼어드민에게 계정 정리를 요청하세요."));
}
