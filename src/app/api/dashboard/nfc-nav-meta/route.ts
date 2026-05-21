import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getLinkedTagCountByScope } from "@/lib/dashboard-linked-tag-count";
import { parseSubjectKind } from "@/lib/subject-kind";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const subjectKind = parseSubjectKind(url.searchParams.get("kind"));
    const tenantId = url.searchParams.get("tenant")?.trim() || null;

    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const linkedTagCount = await getLinkedTagCountByScope(
      context.env.DB,
      userId,
      subjectKind,
      tenantId
    );

    return NextResponse.json({ linkedTagCount, subjectKind });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[nfc-nav-meta]", message);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
