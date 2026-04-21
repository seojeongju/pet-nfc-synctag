import { getCfRequestContext } from "@/lib/cf-request-context";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    const fullKey = key.join("/");

    if (!fullKey) {
      return new NextResponse("Invalid object key", { status: 400 });
    }

    const context = getCfRequestContext();
    const r2 = context.env.R2;

    const object = await r2.get(fullKey);
    if (!object || !object.body) {
      return new NextResponse("Object Not Found", { status: 404 });
    }

    const resHeaders = new Headers();
    const contentType = object.httpMetadata?.contentType ?? "application/octet-stream";
    resHeaders.set("Content-Type", contentType);
    if (object.httpEtag) {
      resHeaders.set("ETag", object.httpEtag);
    }
    resHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(object.body as unknown as BodyInit, {
      headers: resHeaders,
    });
  } catch (error) {
    console.error("[api/r2] failed to read object:", error);
    return new NextResponse("Failed to read object", { status: 500 });
  }
}
