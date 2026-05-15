"use client";

import Link from "next/link";
import type { WayfinderNfcEntryContext } from "@/lib/wayfinder/resolve-nfc-entry";
import { WayfinderSubwayHero } from "@/components/wayfinder/WayfinderSubwayHero";
import { WayfinderNearbyStations } from "@/components/wayfinder/WayfinderNearbyStations";
import { WayfinderHowItWorks } from "@/components/wayfinder/WayfinderHowItWorks";
import { WayfinderSpotAuxiliary } from "@/components/wayfinder/WayfinderSpotAuxiliary";
import { WayfinderNfcWelcome } from "@/components/wayfinder/WayfinderNfcWelcome";
import { WayfinderOptionalSpotCard } from "@/components/wayfinder/WayfinderOptionalSpotCard";

type Props = {
  entry: WayfinderNfcEntryContext;
};

export function WayfinderMainExperience({ entry }: Props) {
  const nfcEntry = entry.fromNfc;

  return (
    <div className="space-y-6 sm:space-y-8" lang="ko">
      {nfcEntry ? <WayfinderNfcWelcome tagId={entry.tagId} /> : null}

      {!nfcEntry ? <WayfinderSubwayHero /> : null}

      <WayfinderNearbyStations nfcEntry={nfcEntry} />

      {entry.spot ? <WayfinderOptionalSpotCard spot={entry.spot} /> : null}

      {!nfcEntry ? <WayfinderHowItWorks /> : null}
      {!nfcEntry ? <WayfinderSpotAuxiliary /> : null}

      <p className="text-center">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-4 text-xs font-black text-slate-700 shadow-sm hover:bg-white"
        >
          링크유 홈
        </Link>
      </p>
    </div>
  );
}
