import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";

export const runtime = "edge";

function pickKeyFromRecord(env: Record<string, unknown> | undefined): string | null {
  if (!env) return null;
  const a = env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;
  const b = env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const raw =
    (typeof a === "string" && a.trim() ? a : null) ??
    (typeof b === "string" && b.trim() ? b : null);
  const t = raw?.trim();
  return t || null;
}

function pickFromProcess(): string | null {
  const v = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY ?? process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const t = v?.trim();
  return t || null;
}

export async function GET() {
  let fromWorker: string | null = null;
  try {
    const { env } = getRequestContext();
    fromWorker = pickKeyFromRecord(env as unknown as Record<string, unknown>);
  } catch {
    // Local dev without Workers request context
  }

  const appKey = fromWorker ?? pickFromProcess();

  return NextResponse.json(
    { appKey: appKey || null },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
