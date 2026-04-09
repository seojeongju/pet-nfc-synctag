import { getRequestContext } from "@cloudflare/next-on-pages";
import { listTenantsForUser } from "@/lib/tenant-membership";

/** owner/admin 소속 조직이 있으면 해당 조직 관리 URL, 없으면 null */
export async function getOrgManageHrefForUser(userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;
  const tenants = await listTenantsForUser(getRequestContext().env.DB, userId).catch(() => []);
  const adminOrg = tenants.find((t) => t.role === "owner" || t.role === "admin");
  return adminOrg ? `/hub/org/${encodeURIComponent(adminOrg.id)}/manage` : null;
}
