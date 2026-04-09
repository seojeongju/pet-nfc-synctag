import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { getLandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";

export const runtime = "edge";

export async function GET() {
  const out: Record<string, unknown> = { ok: true };

  let landing: Awaited<ReturnType<typeof getLandingSessionState>> | null = null;
  try {
    landing = await getLandingSessionState();
    out.landingSession = landing.session ? { hasUser: true, userId: landing.session.user?.id } : null;
    out.landingIsAdmin = landing.isAdmin;
  } catch (e: unknown) {
    out.ok = false;
    out.landingError = e instanceof Error ? e.message : String(e);
  }

  try {
    const href = await getOrgManageHrefForUser(landing?.session?.user?.id).catch(() => null);
    out.orgManageHref = href;
  } catch (e: unknown) {
    out.ok = false;
    out.orgHrefError = e instanceof Error ? e.message : String(e);
  }

  try {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    out.authSessionUserId = session?.user?.id ?? null;
  } catch (e: unknown) {
    out.ok = false;
    out.authSessionError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(out);
}