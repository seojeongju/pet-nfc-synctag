import { notFound } from "next/navigation";
import { linkuCompanionMenuTitle, linkuCompanionServiceDescription } from "@/lib/wayfinder/copy";
import { isWayfinderEnabled } from "@/lib/wayfinder/feature";
import { buildPublicMetadata } from "@/lib/seo";
import { WayfinderPublicShell } from "@/components/wayfinder/WayfinderPublicShell";
import { WayfinderSubwayHero } from "@/components/wayfinder/WayfinderSubwayHero";
import { WayfinderHowItWorks } from "@/components/wayfinder/WayfinderHowItWorks";
import { WayfinderNearbyStations } from "@/components/wayfinder/WayfinderNearbyStations";
import { WayfinderSpotAuxiliary } from "@/components/wayfinder/WayfinderSpotAuxiliary";
import Link from "next/link";

export const metadata = buildPublicMetadata({
  title: `${linkuCompanionMenuTitle} | ${linkuCompanionServiceDescription}`,
  description: `GPS로 근처 지하철역을 찾고, 교통약자 맞춤 이동 경로를 카카오맵으로 안내합니다.`,
  path: "/wayfinder",
  keywords: ["링크유", "동행", "교통약자", "지하철", "GPS", "이동경로", "카카오맵", "접근성"],
  noIndex: true,
});

export default function WayfinderPage() {
  if (!isWayfinderEnabled()) {
    notFound();
  }

  return (
    <WayfinderPublicShell>
      <div className="space-y-8" lang="ko">
        <WayfinderSubwayHero />
        <WayfinderNearbyStations />
        <WayfinderHowItWorks />
        <WayfinderSpotAuxiliary />
        <p className="text-center">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-4 text-xs font-black text-slate-700 shadow-sm hover:bg-white"
          >
            링크유 홈
          </Link>
        </p>
      </div>
    </WayfinderPublicShell>
  );
}
