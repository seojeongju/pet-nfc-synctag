import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { normalizeWayfinderSlug } from "@/lib/wayfinder-spots-db";
import { linkuCompanionMenuTitle } from "@/lib/wayfinder/copy";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** NFC·QR 구 URL 호환: 방문자는 GPS·근처 역 메인(/wayfinder)으로 통합 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: slugRaw } = await params;
  const slug = normalizeWayfinderSlug(slugRaw);
  return {
    title: `${linkuCompanionMenuTitle} 이동 안내`,
    robots: { index: false, follow: false },
    ...(slug ? {} : {}),
  };
}

export default async function WayfinderPublicSpotRedirectPage({ params }: PageProps) {
  const { slug: slugRaw } = await params;
  const slug = normalizeWayfinderSlug(slugRaw);
  if (!slug) notFound();
  redirect(`/wayfinder?spot=${encodeURIComponent(slug)}&from=nfc`);
}
