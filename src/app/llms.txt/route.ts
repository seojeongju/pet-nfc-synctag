import { buildLlmsTxt } from "@/lib/seo";

export const runtime = "edge";

/** GEO: AI/답변 엔진용 사이트 요약 (https://llmstxt.org) */
export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
