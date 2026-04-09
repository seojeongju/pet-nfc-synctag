import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { isPlatformAdminRole } from "@/lib/platform-admin";

export type LandingSessionState = {
  session: { user: { id: string; name?: string | null } } | null;
  isAdmin: boolean;
};

export async function getLandingSessionState(): Promise<LandingSessionState> {
  try {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user?.id) {
      return { session: null, isAdmin: false };
    }
    let isAdmin = false;
    try {
      const roleRow = await context.env.DB
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(user.id)
        .first<{ role?: string | null }>();
      isAdmin = isPlatformAdminRole(roleRow?.role);
    } catch (e) {
      console.error("[getLandingSessionState] role lookup failed", e);
    }
    return {
      session: { user: { id: user.id, name: user.name } },
      isAdmin,
    };
  } catch (e) {
    console.error("[getLandingSessionState] failed", e);
    return { session: null, isAdmin: false };
  }
}
