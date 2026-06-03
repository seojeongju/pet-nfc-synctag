import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { NextResponse } from "next/server";

export const runtime = "edge";
const toError = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)));

/**
 * OAuth 콜백 302가 /auth/complete를 건너뛰면 모바일 viewport 오염이 재발할 수 있어
 * 동일 출처 목적지만 auth/complete 브리지로 한 번 더 감쌉니다.
 */
function wrapOAuthCallbackRedirect(req: Request, response: Response): Response {
  const reqUrl = new URL(req.url);
  if (!reqUrl.pathname.includes("/api/auth/callback/")) {
    return response;
  }
  if (response.status < 300 || response.status >= 400) {
    return response;
  }

  const location = response.headers.get("Location");
  if (!location) return response;

  let target: URL;
  try {
    target = new URL(location, reqUrl.origin);
  } catch {
    return response;
  }

  if (target.origin !== reqUrl.origin) return response;
  if (target.pathname === "/auth/complete") return response;

  const bridge = new URL("/auth/complete", reqUrl.origin);
  bridge.searchParams.set("next", `${target.pathname}${target.search}${target.hash}`);

  const headers = new Headers(response.headers);
  headers.set("Location", bridge.toString());
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function GET(req: Request) {
    try {
        const context = getCfRequestContext();
        const auth = getAuth(context.env);
        const response = await auth.handler(req);
        return wrapOAuthCallbackRedirect(req, response);
    } catch (e: unknown) {
        const err = toError(e);
        console.error("Auth GET error:", {
            message: err.message,
            name: err.name,
            stack: err.stack,
            cause: (err as Error & { cause?: unknown }).cause
        });
        return NextResponse.json({ 
            error: "Auth GET Handler Failed", 
            message: err.message || String(e),
            details: err.toString(),
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined 
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const context = getCfRequestContext();
        const auth = getAuth(context.env);
        const response = await auth.handler(req);
        return wrapOAuthCallbackRedirect(req, response);
    } catch (e: unknown) {
        const err = toError(e);
        console.error("Auth POST error:", {
            message: err.message,
            name: err.name,
            stack: err.stack,
            cause: (err as Error & { cause?: unknown }).cause
        });
        return NextResponse.json({ 
            error: "Auth POST Handler Failed", 
            message: err.message || String(e),
            details: err.toString(),
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined 
        }, { status: 500 });
    }
}
