import { getCfRequestContext } from "@/lib/cf-request-context";
import { NextResponse } from "next/server";

export const runtime = "edge";
type DebugEnv = CloudflareEnv & Record<string, unknown>;

export async function GET() {
  try {
    const context = getCfRequestContext();
    if (!context) {
      return NextResponse.json({ status: "Error", message: "No context found" });
    }

    const env = context.env as DebugEnv;
    
    return NextResponse.json({
      status: "Success",
      timestamp: new Date().toISOString(),
      runtime: "Edge",
      bindings: {
        DB: !!env.DB,
        R2: !!env.R2,
      },
      env_keys: Object.keys(env).filter(k => !k.includes("SECRET") && !k.includes("ID")), // 보안을 위해 키 이름만 노출
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({
      status: "Fatal Error",
      message: err.message || String(error),
      stack: err.stack
    }, { status: 500 });
  }
}
