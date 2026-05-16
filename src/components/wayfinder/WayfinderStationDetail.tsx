import Link from "next/link";
import { ArrowRight, MapPin, Navigation2, TrainFront } from "lucide-react";
import { linkuCompanionMenuTitle, linkuCompanionSpotSubLabel } from "@/lib/wayfinder/copy";
import type { WayfinderFacilityPublic } from "@/lib/wayfinder/facility-types";
import { WayfinderStationAccessibility } from "@/components/wayfinder/WayfinderStationAccessibility";
import { WayfinderStationMap } from "@/components/wayfinder/WayfinderStationMap";

type Props = {
  name: string;
  lines: string | null;
  latitude: number;
  longitude: number;
  mapHref: string;
  routeHref: string;
  facilities: WayfinderFacilityPublic[];
  facilitiesSource: "d1" | "pilot_seed";
  facilitiesSyncedAt: string | null;
};

export function WayfinderStationDetail({
  name,
  lines,
  latitude,
  longitude,
  mapHref,
  routeHref,
  facilities,
  facilitiesSource,
  facilitiesSyncedAt,
}: Props) {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-black tracking-wider text-white">
          <TrainFront className="h-3.5 w-3.5" aria-hidden />
          지하철역 · 이동 안내
        </div>
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-[28px]">{name}</h1>
        {lines ? <p className="text-sm font-bold text-indigo-700">{lines}</p> : null}
        <p className="text-sm font-semibold leading-relaxed text-slate-600">
          이 역을 기준으로 카카오맵에서 <strong className="text-slate-800">길찾기</strong>를 열어 이동하세요. 휠체어·
          시각장애·유모차 동반 시 역무원·안내 데스크에 도움을 요청할 수 있습니다.
        </p>
      </header>

      <section aria-label="이동 경로 안내">
        <a
          href={routeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-indigo-800 bg-indigo-600 px-5 py-4 text-center text-base font-black text-white shadow-lg transition active:scale-[0.99] hover:bg-indigo-700"
        >
          <Navigation2 className="h-5 w-5" aria-hidden />
          이 역으로 길찾기 (카카오맵)
          <ArrowRight className="h-5 w-5 opacity-80" aria-hidden />
        </a>
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <MapPin className="h-4 w-4 text-indigo-600" aria-hidden />
          역 위치 지도에서 보기
        </a>
      </section>

      <WayfinderStationMap latitude={latitude} longitude={longitude} label={name} />

      <WayfinderStationAccessibility
        facilities={facilities}
        dataSource={facilitiesSource}
        syncedAt={facilitiesSyncedAt}
      />

      <details className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-600">
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
