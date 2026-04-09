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
  const r2 = context.env.R2;

  const object = await r2.get(fullKey);

  if (!object) {
    return new NextResponse("Object Not Found", { status: 404 });
  }

  const resHeaders = new Headers();
  const body = object.body;
  const writeMeta = (object as unknown as { writeHttpMetadata?: (h: unknown) => void }).writeHttpMetadata;
  if (body && typeof writeMeta === "function") {
    writeMeta(resHeaders);
  }
  resHeaders.set("etag", object.httpEtag);
  resHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

  return new NextResponse(body as unknown as BodyInit, {
    headers: resHeaders,
  });
}
