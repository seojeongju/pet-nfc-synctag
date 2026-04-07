import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  try {
    const context = getRequestContext();
    if (!context) {
      return NextResponse.json({ status: "Error", message: "No context found" });
    }

    const env = context.env as any;
    
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
  } catch (error: any) {
    return NextResponse.json({
      status: "Fatal Error",
      message: error.message || String(error),
      stack: error.stack
    }, { status: 500 });
  }
}
