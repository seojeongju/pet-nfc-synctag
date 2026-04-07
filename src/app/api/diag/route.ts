import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const context = getRequestContext();
  const env = context.env as any;

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
    }
  };

  if (env.DB) {
    try {
      await (env.DB as any).prepare("SELECT 1").run();
      diagnostics.database.connectionTest = "Success";
    } catch (e: any) {
      diagnostics.database.connectionTest = `Failed: ${e.message}`;
    }
  }

  return NextResponse.json(diagnostics);
}
