"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import type { WayfinderNfcEntryContext } from "@/lib/wayfinder/resolve-nfc-entry";
import { WayfinderSubwayHero } from "@/components/wayfinder/WayfinderSubwayHero";
import { WayfinderNearbyStations } from "@/components/wayfinder/WayfinderNearbyStations";
import { WayfinderHowItWorks } from "@/components/wayfinder/WayfinderHowItWorks";
import { WayfinderSpotAuxiliary } from "@/components/wayfinder/WayfinderSpotAuxiliary";
import { WayfinderNfcWelcome } from "@/components/wayfinder/WayfinderNfcWelcome";
import { WayfinderNfcEntryScroll } from "@/components/wayfinder/WayfinderNfcEntryScroll";
import { WayfinderOptionalSpotCard } from "@/components/wayfinder/WayfinderOptionalSpotCard";
import { WayfinderStationAnchorCard } from "@/components/wayfinder/WayfinderStationAnchorCard";
import { WayfinderAccessibleRoutingSection } from "@/components/wayfinder/WayfinderAccessibleRoutingSection";

type Props = {
  entry: WayfinderNfcEntryContext;
};

export function WayfinderMainExperience({ entry }: Props) {
  const nfcEntry = entry.fromNfc;

  return (
    <div className="space-y-6 sm:space-y-8" lang="ko">
      {nfcEntry ? <WayfinderNfcEntryScroll active /> : null}
      {nfcEntry ? <WayfinderNfcWelcome /> : null}

      {!nfcEntry ? <WayfinderSubwayHero /> : null}

      {entry.stationAnchor ? <WayfinderStationAnchorCard anchor={entry.stationAnchor} /> : null}

      <WayfinderAccessibleRoutingSection variant="main" />

      <WayfinderNearbyStations nfcEntry={nfcEntry} />

      {entry.spot ? <WayfinderOptionalSpotCard spot={entry.spot} /> : null}

      {!nfcEntry ? <WayfinderHowItWorks /> : null}
      {!nfcEntry ? <WayfinderSpotAuxiliary /> : null}

      <p className="text-center">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 text-xs font-black text-slate-700 shadow-sm hover:bg-white"
        >
          <Home className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
          링크유 홈
        </Link>
      </p>
    </div>
  );
}
