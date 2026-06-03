import { getAuth } from "@/lib/auth";
import { forwardAuthHandlerResponse } from "@/lib/auth-forward-response";
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

function extractDestinationFromConsentCallback(callbackURL: string): string {
  if (!callbackURL.startsWith("/consent?")) return callbackURL;
  try {
    const u = new URL(callbackURL, "https://example.invalid");
    return u.searchParams.get("next") ?? "/hub";
  } catch {
    return "/hub";
  }
}

/**
 * Google OAuth 시작 — 브라우저 GET → 서버에서 sign-in/social POST 프록시 →
 * PKCE/state Set-Cookie(복수)를 빠짐없이 전달한 뒤 Google로 302.
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
    callbackUrl: extractDestinationFromConsentCallback(callbackURL),
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
      return forwardAuthHandlerResponse(res);
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
      return forwardAuthHandlerResponse(res, { location: oauthUrl, status: 302 });
    }

    console.error("[google-start] unexpected response", res.status, text.slice(0, 200));
    return NextResponse.redirect(new URL(errorCallbackURL, reqUrl.origin));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[google-start]", message);
    return NextResponse.redirect(new URL(errorCallbackURL, reqUrl.origin));
  }
}
