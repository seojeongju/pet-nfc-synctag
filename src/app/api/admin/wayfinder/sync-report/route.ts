import { NextResponse } from "next/server";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { buildWayfinderSyncReport } from "@/lib/wayfinder/sync-accessibility-report";

export const runtime = "edge";

export async function GET(request: Request) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await context.env.DB.prepare("SELECT role FROM user WHERE id = ?")
    .bind(userId)
    .first<{ role?: string | null }>();

  if (!isPlatformAdminRole(row?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = await buildWayfinderSyncReport(context.env.DB);
  return NextResponse.json({ ok: true, report });
}
