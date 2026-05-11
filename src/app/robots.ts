import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/auth/",
        "/consent",
        "/consent/",
        "/dashboard",
        "/dashboard/",
        "/force-password",
        "/force-password/",
        "/geofences",
        "/geofences/",
        "/hub",
        "/hub/",
        "/invite/",
        "/login",
        "/login/",
        "/profile/",
        "/scans",
        "/scans/",
        "/share/",
        "/shop",
        "/shop/",
        "/t/",
        "/warranty/verify/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
