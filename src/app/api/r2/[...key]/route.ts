import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const fullKey = key.join("/");

  const context = getRequestContext();
  const r2 = context.env.R2 as unknown as any;

  const object = await r2.get(fullKey);

  if (!object) {
    return new NextResponse("Object Not Found", { status: 404 });
  }

  const resHeaders = new Headers();
  // 타입 불일치 회피를 위해 any로 캐스팅하여 호출
  (object as any).writeHttpMetadata(resHeaders as any);
  resHeaders.set("etag", object.httpEtag);
  resHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

  return new NextResponse(object.body, {
    headers: resHeaders,
  });
}
