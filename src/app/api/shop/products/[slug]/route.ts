import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { getEffectiveAllowedSubjectKinds } from "@/lib/mode-visibility";
import { getShopProductBySlugForKind } from "@/lib/shop";
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

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, ctx: RouteContext) {
  const { slug: rawSlug } = await ctx.params;
  const slug = decodeURIComponent(rawSlug || "").trim();
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

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

  const roleRow = await getDB()
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  const isPlatformAdmin = isPlatformAdminRole(roleRow?.role);
  const allowed = await getEffectiveAllowedSubjectKinds(getDB(), session.user.id, { isPlatformAdmin });
  if (!allowed.includes(kindParam)) {
    return NextResponse.json({ error: "이 모드의 상품을 볼 수 없습니다." }, { status: 403 });
  }

  const product = await getShopProductBySlugForKind(getDB(), slug, kindParam);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ kind: kindParam, product });
}
