import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getAuth } from "@/lib/auth";
import { fetchVisibleAnnouncementsForGuardian } from "@/lib/mode-announcements-guardian";
import { parseSubjectKind } from "@/lib/subject-kind";

export const runtime = "edge";

/** Guardian: published announcements for current kind/tenant (dashboard bell) */
export async function GET(req: Request) {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const kind = parseSubjectKind(url.searchParams.get("kind"));
  const tenantRaw = url.searchParams.get("tenant");
  const tenantId = typeof tenantRaw === "string" && tenantRaw.trim() ? tenantRaw.trim() : undefined;

  try {
    const items = await fetchVisibleAnnouncementsForGuardian(session.user.id, kind, tenantId);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
