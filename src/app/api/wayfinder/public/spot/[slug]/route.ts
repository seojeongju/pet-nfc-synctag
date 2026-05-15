import { NextResponse } from "next/server";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getPublishedWayfinderSpotBySlug } from "@/lib/wayfinder-spots-db";

export const runtime = "edge";

/**
 * 공개 스팟 메타(발행된 스팟만). 인증 없음 — 이후 /wayfinder/s/[slug] 페이지에서 사용.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await ctx.params;
  const slug = typeof raw === "string" ? raw.trim() : "";
  if (!slug) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const context = getCfRequestContext();
    const row = await getPublishedWayfinderSpotBySlug(context.env.DB, slug);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      spot: {
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        guideText: row.guide_text,
        floorLabel: row.floor_label,
        latitude: row.latitude,
        longitude: row.longitude,
        updatedAt: row.updated_at,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Server error", detail: msg }, { status: 500 });
  }
}
