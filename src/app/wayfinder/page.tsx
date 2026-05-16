import { notFound } from "next/navigation";
import { linkuCompanionMenuTitle, linkuCompanionServiceDescription } from "@/lib/wayfinder/copy";
import { isWayfinderEnabled } from "@/lib/wayfinder/feature";
import { buildPublicMetadata } from "@/lib/seo";
import { WayfinderPublicShell } from "@/components/wayfinder/WayfinderPublicShell";
import { WayfinderMainExperience } from "@/components/wayfinder/WayfinderMainExperience";
import { resolveWayfinderNfcEntry } from "@/lib/wayfinder/resolve-nfc-entry";
import type { WayfinderCompanionEntryQuery } from "@/lib/wayfinder/companion-url";

/** @cloudflare/next-on-pages: 동적 라우트는 Edge 런타임 필요 */
export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata = buildPublicMetadata({
  title: `${linkuCompanionMenuTitle} | ${linkuCompanionServiceDescription}`,
  description: `GPS로 근처 지하철역을 찾고, 교통약자 맞춤 이동 경로를 카카오맵으로 안내합니다.`,
  path: "/wayfinder",
  keywords: ["링크유", "동행", "교통약자", "지하철", "GPS", "이동경로", "카카오맵", "접근성", "NFC"],
  noIndex: true,
});

type PageProps = {
  searchParams: Promise<WayfinderCompanionEntryQuery>;
};

export default async function WayfinderPage({ searchParams }: PageProps) {
  if (!isWayfinderEnabled()) {
    notFound();
  }

  const query = await searchParams;
  const entry = await resolveWayfinderNfcEntry(query);

  return (
    <WayfinderPublicShell>
      <WayfinderMainExperience entry={entry} />
    </WayfinderPublicShell>
  );
}
