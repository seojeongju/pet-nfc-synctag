import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export const runtime = "edge";

/** SEO: 공개 페이지만 허용. AEO/GEO 봇도 동일 정책으로 안내 */
export default function robots(): MetadataRoute.Robots {
  const host = getSiteUrl().replace(/^https?:\/\//, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/auth/",
          "/consent",
          "/dashboard",
          "/force-password",
          "/geofences",
          "/hub",
          "/invite/",
          "/login",
          "/profile/",
          "/scans",
          "/share/",
          "/shop",
          "/t/",
          "/warranty/verify/",
          "/studio/",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/linku", "/studio", "/services/", "/manual", "/pet", "/elder", "/child", "/luggage", "/gold", "/llms.txt"],
        disallow: ["/admin", "/api/", "/dashboard", "/hub", "/login", "/t/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/linku", "/studio", "/services/", "/manual", "/llms.txt"],
        disallow: ["/admin", "/api/", "/dashboard", "/hub", "/login", "/t/"],
      },
      {
        userAgent: "Anthropic-AI",
        allow: ["/", "/linku", "/studio", "/services/", "/manual", "/llms.txt"],
        disallow: ["/admin", "/api/", "/dashboard", "/hub", "/login", "/t/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host,
  };
}
