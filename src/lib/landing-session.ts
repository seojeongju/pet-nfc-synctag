import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { isPlatformAdminRole } from "@/lib/platform-admin";

export type LandingSessionState = {
  session: { user: { id: string; name?: string | null } } | null;
  isAdmin: boolean;
};

export async function getLandingSessionState(): Promise<LandingSessionState> {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;
  if (!user?.id) {
    return { session: null, isAdmin: false };
  }
  const roleRow = await context.env.DB
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(user.id)
    .first<{ role?: string | null }>();
  const isAdmin = isPlatformAdminRole(roleRow?.role);
  return {
    session: { user: { id: user.id, name: user.name } },
    isAdmin,
  };
}
