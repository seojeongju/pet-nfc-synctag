import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { getUserConsentStatus, upsertUserRequiredConsents } from "@/lib/privacy-consent";
import { headers, cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const COOKIE = "lgu_ok";

function sanitizeNext(raw: string | null): string {
  const t = (raw ?? "").trim();
  if (!t) return "/hub";
  try {
    const d = decodeURIComponent(t);
    if (!d.startsWith("/") || d.startsWith("//") || d.includes("://")) return "/hub";
    return d.length > 2048 ? "/hub" : d;
  } catch {
    return "/hub";
  }
}

/**
 * /consent 로 들어왔을 때 lgu_ok 쿠키가 있으면(=로그인 화면에서 동의한 OAuth 플로우) D1에 동의를 쓰고
 * 쿠키를 제거한 뒤 `next`로 302. 쿠키가 없으면 /consent 로 되돌려 폼을 보여 줍니다.
 */
export async function GET(request: NextRequest) {
  const next = sanitizeNext(request.nextUrl.searchParams.get("next"));
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(next)}`, request.nextUrl.origin)
    );
  }

  const c = await cookies();
  if (c.get(COOKIE)?.value !== "1") {
    return NextResponse.redirect(
      new URL(`/consent?next=${encodeURIComponent(next)}`, request.nextUrl.origin)
    );
  }

  const st = await getUserConsentStatus(userId);
  if (!st.hasRequired) {
    await upsertUserRequiredConsents(userId);
  }

  const res = NextResponse.redirect(new URL(next, request.nextUrl.origin));
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
  return res;
}
