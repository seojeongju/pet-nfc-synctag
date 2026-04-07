import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
type R2ObjectWithMeta = R2ObjectBody & {
  writeHttpMetadata: (headers: Headers) => void;
};

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
  (object as R2ObjectWithMeta).writeHttpMetadata(resHeaders);
  resHeaders.set("etag", object.httpEtag);
  resHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

  return new NextResponse(object.body, {
    headers: resHeaders,
  });
}
