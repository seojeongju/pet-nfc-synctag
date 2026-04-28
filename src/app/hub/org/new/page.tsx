import OrgCreateClient from "./OrgCreateClient";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { isPlatformAdminRole } from "@/lib/platform-admin";

export const runtime = "edge";

export default async function OrgNewPage() {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/login");
  }
  const roleRow = await context.env.DB
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  if (!isPlatformAdminRole(roleRow?.role)) {
    redirect("/hub");
  }
  return <OrgCreateClient />;
}
