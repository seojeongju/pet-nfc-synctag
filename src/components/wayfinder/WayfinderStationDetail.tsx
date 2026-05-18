import Link from "next/link";
import { ArrowRight, MapPin, Navigation2, TrainFront } from "lucide-react";
import { linkuCompanionMenuTitle, linkuCompanionSpotSubLabel } from "@/lib/wayfinder/copy";
import type { WayfinderFacilityPublic } from "@/lib/wayfinder/facility-types";
import type { FacilityMapPoint } from "@/lib/wayfinder/facility-map-layout";
import type { WayfinderStationEntryContext } from "@/lib/wayfinder/station-entry-context";
import { WayfinderStationExperience } from "@/components/wayfinder/WayfinderStationExperience";
import { WayfinderStationNearbyBanner } from "@/components/wayfinder/WayfinderStationNearbyBanner";
import { WayfinderStationLinkuFeatures } from "@/components/wayfinder/WayfinderStationLinkuFeatures";

type Props = {
  name: string;
  lines: string | null;
  latitude: number;
  longitude: number;
  mapHref: string;
  routeHref: string;
  facilities: WayfinderFacilityPublic[];
  mapPoints: FacilityMapPoint[];
  facilitiesSource: "d1" | "pilot_seed";
  facilitiesSyncedAt: string | null;
  initialSelectedFacilityId?: string | null;
  entryContext?: WayfinderStationEntryContext;
};

export function WayfinderStationDetail({
  name,
  lines,
  latitude,
  longitude,
  mapHref,
  routeHref,
  facilities,
  mapPoints,
  facilitiesSource,
  facilitiesSyncedAt,
  initialSelectedFacilityId = null,
  entryContext,
}: Props) {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-black tracking-wider text-white">
          <TrainFront className="h-3.5 w-3.5" aria-hidden />
          지하철역 · 교통약자 안내
        </div>
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-[28px]">{name}</h1>
        {lines ? <p className="text-sm font-bold text-indigo-700">{lines}</p> : null}
        <p className="text-sm font-semibold leading-relaxed text-slate-600">
          역 안 <strong className="text-indigo-800">엘리베이터·화장실·승강장</strong> 등 편의시설을 링크유-동행
          지도·목록·음성 안내로 확인하세요. 휠체어·유모차 동반 시 역무원·안내 데스크에 도움을 요청할 수
          있습니다.
        </p>
      </header>

      {entryContext ? <WayfinderStationNearbyBanner stationName={name} entry={entryContext} /> : null}

      <WayfinderStationLinkuFeatures stationName={name} facilityCount={facilities.length} />

      <WayfinderStationExperience
        stationName={name}
        latitude={latitude}
        longitude={longitude}
        routeHref={routeHref}
        facilities={facilities}
        mapPoints={mapPoints}
        facilitiesSource={facilitiesSource}
        facilitiesSyncedAt={facilitiesSyncedAt}
        initialSelectedFacilityId={initialSelectedFacilityId}
      />

      <details className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-black text-slate-700 [&::-webkit-details-marker]:hidden">
          <Navigation2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          참고 · 외부 길찾기 (카카오맵)
        </summary>
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold leading-relaxed text-slate-600">
            일반 도로 기준 경로가 필요할 때만 이용하세요. 역 안 시설 안내는 위 링크유 기능을 사용합니다.
          </p>
          <a
            href={routeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <Navigation2 className="h-4 w-4 text-indigo-600" aria-hidden />
            이 역으로 길찾기
            <ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
          </a>
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <MapPin className="h-4 w-4 text-indigo-600" aria-hidden />
            역 위치 지도에서 보기
          </a>
        </div>
      </details>

      <details
        id="wf-station-nfc-spot"
        className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-600"
      >
        <summary className="cursor-pointer font-black text-slate-700">보조: {linkuCompanionSpotSubLabel}</summary>
        <p className="mt-2 leading-relaxed">
          역·시설에 설치된 NFC 태그는 특정 지점(승강기 앞 등) 안내용입니다.{" "}
          <span className="font-mono text-[10px]">/wayfinder/s/스팟-slug</span>
        </p>
      </details>

      <footer className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Link
          href="/wayfinder"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-indigo-600 px-4 text-xs font-black text-white hover:bg-indigo-700"
        >
          다른 역 찾기
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 hover:bg-slate-50"
        >
          {linkuCompanionMenuTitle} 홈
        </Link>
      </footer>
    </div>
  );
}
