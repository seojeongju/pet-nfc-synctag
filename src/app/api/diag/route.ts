import { getCfRequestContext } from "@/lib/cf-request-context";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getMigration0008Status } from "@/lib/db-migration-0008";

export const runtime = "edge";

type DiagEnv = CloudflareEnv & {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  KAKAO_CLIENT_ID?: string;
};

export async function GET() {
  const context = getCfRequestContext();
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
      migration0008: "Pending" as string | object,
      /** mode_announcements.target_tenant_id (0010) — 없으면 공지 쿼리가 실패할 수 있음 */
      modeAnnouncementsTargetTenant: "Pending" as string | { ok: true } | { ok: false; message: string },
    },
    auth: {
      initialization: "Pending",
      error: null as string | null,
    },
  };

  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1").run();
      diagnostics.database.connectionTest = "Success";
      diagnostics.database.migration0008 = await getMigration0008Status(env.DB);
      try {
        await env.DB.prepare("SELECT target_tenant_id FROM mode_announcements LIMIT 1").first();
        diagnostics.database.modeAnnouncementsTargetTenant = { ok: true };
      } catch (colErr: unknown) {
        const msg = colErr instanceof Error ? colErr.message : String(colErr);
        diagnostics.database.modeAnnouncementsTargetTenant = { ok: false, message: msg };
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      diagnostics.database.connectionTest = `Failed: ${err.message}`;
      diagnostics.database.migration0008 = "Unavailable";
      diagnostics.database.modeAnnouncementsTargetTenant = "Unavailable";
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
