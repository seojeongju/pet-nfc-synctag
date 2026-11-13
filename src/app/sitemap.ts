import type { MetadataRoute } from "next";
import { absoluteUrl, listPublicIndexPaths } from "@/lib/seo";

export const runtime = "edge";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return listPublicIndexPaths().map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
