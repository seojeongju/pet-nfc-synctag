import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { listTenantsForUser } from "@/lib/tenant-membership";
import { isPasswordChangeRequired } from "@/lib/password-change";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const runtime = "edge";

export default async function AdminEntryPage() {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/admin/login");
  }
  const needPasswordChange = await isPasswordChangeRequired(context.env.DB, userId);
  if (needPasswordChange) {
    redirect("/force-password");
  }

  const roleRow = await context.env.DB
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(userId)
    .first<{ role?: string | null }>();
  if (isPlatformAdminRole(roleRow?.role)) {
    redirect("/admin");
  }

  const tenants = await listTenantsForUser(context.env.DB, userId).catch(() => []);
  const hasOrgAdminRole = tenants.some((t) => t.role === "owner" || t.role === "admin");
  if (hasOrgAdminRole) {
    redirect("/hub/org/manage");
  }

  redirect("/admin/login?error=" + encodeURIComponent("관리자 권한이 없습니다."));
}
