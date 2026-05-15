import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCfRequestContext } from "@/lib/cf-request-context";
import {
  getPublishedWayfinderSpotBySlug,
  getWayfinderSlugAvailability,
  normalizeWayfinderSlug,
} from "@/lib/wayfinder-spots-db";
import { linkuCompanionMenuTitle } from "@/lib/wayfinder/copy";
import { buildPublicMetadata, absoluteUrl } from "@/lib/seo";
import { buildWayfinderPublicSpeechText } from "@/lib/wayfinder/build-public-speech";
import { normalizeContactPhoneForLink } from "@/lib/wayfinder/normalize-contact-phone";
import { buildKakaoMapPinHref, buildKakaoMapRouteHref } from "@/lib/wayfinder/kakao-map-links";
import { WayfinderPublicSpotView } from "@/components/wayfinder/WayfinderPublicSpotView";
import { WayfinderSpotUnpublished } from "@/components/wayfinder/WayfinderSpotUnpublished";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function loadPublishedSpot(slugRaw: string) {
  const slug = normalizeWayfinderSlug(slugRaw);
  if (!slug) return { availability: "missing" as const, row: null };
  try {
    const ctx = getCfRequestContext();
    const availability = await getWayfinderSlugAvailability(ctx.env.DB, slug);
    if (availability !== "published") {
      return { availability, row: null };
    }
    const row = await getPublishedWayfinderSpotBySlug(ctx.env.DB, slug);
    return { availability: row ? "published" : "missing", row };
  } catch (e) {
    console.error("wayfinder public spot load error:", e);
    return { availability: "missing" as const, row: null };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: slugRaw } = await params;
  const { row } = await loadPublishedSpot(slugRaw);
  if (!row) {
    return {
      title: `안내를 찾을 수 없습니다 | ${linkuCompanionMenuTitle}`,
      robots: { index: false, follow: false },
    };
  }
  const path = `/wayfinder/s/${row.slug}`;
  return buildPublicMetadata({
    title: `${row.title} | ${linkuCompanionMenuTitle}`,
    description: row.summary?.trim() || `${row.title} — ${linkuCompanionMenuTitle} 시설 안내`,
    path,
    keywords: ["링크유", "동행", "교통약자", "시설 안내", "NFC 안내", "접근성", row.title],
    noIndex: false,
  });
}

export default async function WayfinderPublicSpotPage({ params }: PageProps) {
  const { slug: slugRaw } = await params;
  const { availability, row } = await loadPublishedSpot(slugRaw);

  if (availability === "draft") {
    return <WayfinderSpotUnpublished />;
  }
  if (!row) {
    notFound();
  }

  const speechText = buildWayfinderPublicSpeechText(row);
  const pageUrl = absoluteUrl(`/wayfinder/s/${row.slug}`);
  const hasCoords =
    row.latitude != null &&
    row.longitude != null &&
    Number.isFinite(row.latitude) &&
    Number.isFinite(row.longitude);
  const mapHref = hasCoords ? buildKakaoMapPinHref(row.title, row.latitude!, row.longitude!) : null;
  const routeHref = hasCoords ? buildKakaoMapRouteHref(row.title, row.latitude!, row.longitude!) : null;

  const contactPhone = normalizeContactPhoneForLink(row.contact_phone);
  const contactPhoneDisplay = (row.contact_phone ?? "").trim() || null;

  return (
    <main className="px-4 py-10 sm:px-5" lang="ko">
      <WayfinderPublicSpotView
        title={row.title}
        summary={row.summary}
        floorLabel={row.floor_label}
        guideText={row.guide_text}
        contactPhone={contactPhone}
        contactPhoneDisplay={contactPhoneDisplay}
        subjectKind={row.subject_kind}
        mapHref={mapHref}
        routeHref={routeHref}
        latitude={hasCoords ? row.latitude : null}
        longitude={hasCoords ? row.longitude : null}
        pageUrl={pageUrl}
        speechText={speechText}
      />
    </main>
  );
}
