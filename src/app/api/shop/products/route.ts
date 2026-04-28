import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { listShopProductsForKind } from "@/lib/shop";
import { SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";

export const runtime = "edge";

function parseKindParam(v: string | null): SubjectKind | null {
  if (v == null || !String(v).trim()) return null;
  const t = String(v).trim();
  if ((SUBJECT_KINDS as readonly string[]).includes(t)) {
    return t as SubjectKind;
  }
  return null;
}

export async function GET(request: Request) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const kindParam = parseKindParam(url.searchParams.get("kind"));
  if (!kindParam) {
    return NextResponse.json({ error: "kind가 필요합니다." }, { status: 400 });
  }

  try {
    const products = await listShopProductsForKind(getDB(), kindParam);
    return NextResponse.json({ kind: kindParam, products });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 });
  }
}
