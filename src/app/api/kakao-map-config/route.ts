import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";

export const runtime = "edge";

/** Cloudflare Pages 대시보드만 설정해도 런타임에 주입되도록 서버 전용 이름을 둡니다(재빌드 없이 변경 가능). */
const KEY_CANDIDATES = [
  "KAKAO_MAP_JS_KEY",
  "NEXT_PUBLIC_KAKAO_MAP_JS_KEY",
  "NEXT_PUBLIC_KAKAO_MAP_KEY",
] as const;

function pickFirstFromRecord(record: Record<string, unknown> | undefined): string | null {
  if (!record) return null;
  for (const k of KEY_CANDIDATES) {
    const v = record[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickFirstFromProcess(): string | null {
  for (const k of KEY_CANDIDATES) {
    const v = process.env[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export async function GET() {
  let fromWorker: string | null = null;
  try {
    const { env } = getRequestContext();
    fromWorker = pickFirstFromRecord(env as unknown as Record<string, unknown>);
  } catch {
    // Local dev without Workers request context
  }

  const appKey = fromWorker ?? pickFirstFromProcess();

  return NextResponse.json(
    { appKey: appKey || null },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
