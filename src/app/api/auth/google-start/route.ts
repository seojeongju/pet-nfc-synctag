import { getAuth } from "@/lib/auth";
import { collectSetCookies, forwardAuthHandlerResponse } from "@/lib/auth-forward-response";
import {
  buildAuthSocialProxyHeaders,
  resolveAuthBaseUrl,
} from "@/lib/auth-social-proxy";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { loginRedirectPath } from "@/lib/login-redirect-path";
import {
  buildConsentWithNextUrl,
  resolveOAuthFlowDestination,
} from "@/lib/oauth-viewport-bridge";
import { SUBJECT_KINDS } from "@/lib/subject-kind";
import { extractSocialOAuthUrl } from "@/lib/viewport-meta";
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
 * Google OAuth 시작 — 브라우저 GET → 서버에서 sign-in/social POST 프록시 →
 * PKCE/state Set-Cookie(복수)를 빠짐없이 전달한 뒤 Google로 302.
 */
export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const callbackURL =
    sanitizeCallbackPath(reqUrl.searchParams.get("callbackURL")) ??
    buildConsentWithNextUrl("/hub");

  const kindParam = reqUrl.searchParams.get("kind");
  const kind =
    kindParam && (SUBJECT_KINDS as readonly string[]).includes(kindParam) ? kindParam : "pet";

  const errorCallbackURL = loginRedirectPath({
    kind,
    oauthError: "invalid_code",
    callbackUrl: resolveOAuthFlowDestination(callbackURL),
  });

  try {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const authBase = resolveAuthBaseUrl(
      context.env as { BETTER_AUTH_URL?: string },
      reqUrl
    );

    const socialReq = new Request(`${authBase}/api/auth/sign-in/social`, {
      method: "POST",
      headers: buildAuthSocialProxyHeaders(req, authBase),
      body: JSON.stringify({
        provider: "google",
        callbackURL,
        errorCallbackURL,
      }),
    });

    const res = await auth.handler(socialReq);
    const setCookieCount = collectSetCookies(res).length;

    if (res.status >= 300 && res.status < 400) {
      if (setCookieCount === 0) {
        console.warn("[google-start] redirect without set-cookie — PKCE may fail");
      }
      return forwardAuthHandlerResponse(res);
    }

    const text = await res.text();
    let oauthUrl: string | null = null;
    try {
      oauthUrl = extractSocialOAuthUrl(text ? JSON.parse(text) : null);
    } catch {
      /* ignore */
    }

    if (oauthUrl) {
      if (setCookieCount === 0) {
        console.warn("[google-start] oauth url without set-cookie — PKCE may fail");
      } else {
        console.info("[google-start] set-cookie count", setCookieCount);
      }
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
