import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";
import {
  KAKAO_MAP_APP_KEY_ENV_NAMES,
  normalizeKakaoMapAppKey,
  type KakaoMapKeySource,
} from "@/lib/kakao-map-app-key";

export const runtime = "edge";

function pickFromRecord(
  record: Record<string, unknown> | undefined
): { key: string; source: KakaoMapKeySource } | null {
  if (!record) return null;
  for (const k of KAKAO_MAP_APP_KEY_ENV_NAMES) {
    const v = record[k];
    if (typeof v !== "string") continue;
    const n = normalizeKakaoMapAppKey(v);
    if (n) return { key: n, source: k };
  }
  return null;
}

function pickFromProcess(): { key: string; source: KakaoMapKeySource } | null {
  for (const k of KAKAO_MAP_APP_KEY_ENV_NAMES) {
    const v = process.env[k];
    if (typeof v !== "string") continue;
    const n = normalizeKakaoMapAppKey(v);
    if (n) return { key: n, source: k };
  }
  return null;
}

export async function GET() {
  let fromWorker: { key: string; source: KakaoMapKeySource } | null = null;
  try {
    const { env } = getRequestContext();
    fromWorker = pickFromRecord(env as unknown as Record<string, unknown>);
  } catch {
    // Local dev without Workers request context
  }

  const chosen = fromWorker ?? pickFromProcess();

  return NextResponse.json(
    {
      appKey: chosen?.key ?? null,
      /** 어떤 환경 변수가 선택됐는지(값은 노출하지 않음). 403 시 잘못된 시크릿 구분용 */
      keySource: chosen?.source ?? null,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
