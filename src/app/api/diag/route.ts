import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export const runtime = "edge";
type DiagEnv = CloudflareEnv & {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  KAKAO_CLIENT_ID?: string;
};

export async function GET() {
  const context = getRequestContext();
  const env = context.env as DiagEnv;

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      BETTER_AUTH_SECRET: !!env.BETTER_AUTH_SECRET ? "SET" : "MISSING",
      BETTER_AUTH_URL: !!env.BETTER_AUTH_URL ? "SET" : "MISSING",
      NEXT_PUBLIC_APP_URL: !!env.NEXT_PUBLIC_APP_URL ? "SET" : "MISSING",
      GOOGLE_CLIENT_ID: !!env.GOOGLE_CLIENT_ID ? "SET" : "MISSING",
      KAKAO_CLIENT_ID: !!env.KAKAO_CLIENT_ID ? "SET" : "MISSING",
    },
    database: {
      isBound: !!env.DB,
      connectionTest: "Pending",
    },
    auth: {
      initialization: "Pending",
      error: null as string | null,
    }
  };

  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1").run();
      diagnostics.database.connectionTest = "Success";
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      diagnostics.database.connectionTest = `Failed: ${err.message}`;
    }
  }

  try {
    getAuth(env);
    diagnostics.auth.initialization = "Success";
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    diagnostics.auth.initialization = "Failed";
    diagnostics.auth.error = err.message || String(e);
  }

  return NextResponse.json(diagnostics);
}
