import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { loginRedirectPath } from "@/lib/login-redirect-path";
import { SUBJECT_KINDS } from "@/lib/subject-kind";
import { NextResponse } from "next/server";

export const runtime = "edge";

function sanitizeCallbackPath(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  try {
    const decoded = decodeURIComponent(raw.trim());
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("://")) {
      return null;
    }
    return decoded.length > 2048 ? null : decoded;
  } catch {
    return null;
  }
}

/**
 * Google OAuth 시작 — 브라우저 전체 네비게이션으로 better-auth에 POST하여
 * PKCE/state Set-Cookie가 확실히 심어진 뒤 Google로 302 이동합니다.
 * (fetch + disableRedirect는 Cloudflare/모바일에서 invalid_code가 날 수 있음)
 */
export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const callbackURL =
    sanitizeCallbackPath(reqUrl.searchParams.get("callbackURL")) ?? "/consent?next=%2Fhub";

  const kindParam = reqUrl.searchParams.get("kind");
  const kind =
    kindParam && (SUBJECT_KINDS as readonly string[]).includes(kindParam) ? kindParam : "pet";

  const errorCallbackURL = loginRedirectPath({
    kind,
    oauthError: "invalid_code",
    callbackUrl: callbackURL.startsWith("/consent?")
      ? (() => {
          try {
            const u = new URL(callbackURL, "https://example.invalid");
            return u.searchParams.get("next") ?? "/hub";
          } catch {
            return "/hub";
          }
        })()
      : callbackURL,
  });

  try {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);

    const socialReq = new Request(`${reqUrl.origin}/api/auth/sign-in/social`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        cookie: req.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({
        provider: "google",
        callbackURL,
        errorCallbackURL,
      }),
    });

    const res = await auth.handler(socialReq);

    if (res.status >= 300 && res.status < 400) {
      const headers = new Headers(res.headers);
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    }

    const text = await res.text();
    let oauthUrl: string | null = null;
    try {
      const parsed = text ? JSON.parse(text) : null;
      if (parsed && typeof parsed === "object") {
        const root = parsed as Record<string, unknown>;
        if (typeof root.url === "string") oauthUrl = root.url;
        else if (root.data && typeof root.data === "object") {
          const data = root.data as Record<string, unknown>;
          if (typeof data.url === "string") oauthUrl = data.url;
        }
      }
    } catch {
      /* ignore */
    }

    if (oauthUrl) {
      const headers = new Headers(res.headers);
      return NextResponse.redirect(oauthUrl, { headers });
    }

    console.error("[google-start] unexpected response", res.status, text.slice(0, 200));
    return NextResponse.redirect(new URL(errorCallbackURL, reqUrl.origin));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[google-start]", message);
    return NextResponse.redirect(new URL(errorCallbackURL, reqUrl.origin));
  }
}
