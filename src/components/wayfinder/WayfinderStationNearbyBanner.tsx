import { LocateFixed, MapPin } from "lucide-react";
import type { WayfinderStationEntryContext } from "@/lib/wayfinder/station-entry-context";
import { formatDistanceMeters } from "@/lib/wayfinder/station-entry-context";

type Props = {
  stationName: string;
  entry: WayfinderStationEntryContext;
};

export function WayfinderStationNearbyBanner({ stationName, entry }: Props) {
  if (!entry.fromNearby || entry.distanceM == null) return null;

  const distLabel = formatDistanceMeters(entry.distanceM);

  return (
    <div
      className="flex items-start gap-3 rounded-2xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50 to-violet-50/80 px-4 py-3 shadow-sm"
      role="status"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
        {entry.isNearestFromGps ? (
          <LocateFixed className="h-5 w-5" aria-hidden />
        ) : (
          <MapPin className="h-5 w-5" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">
          {entry.isNearestFromGps ? "가장 가까운 역" : "근처 역에서 선택"}
        </p>
        <p className="text-sm font-black text-slate-900">
          {stationName}
          <span className="ml-1.5 text-indigo-600">약 {distLabel}</span>
        </p>
        <p className="text-[11px] font-semibold leading-relaxed text-slate-600">
          아래에서 교통약자 편의시설을 확인한 뒤, 필요하면 시설·역까지 카카오맵 길찾기를 이용하세요.
        </p>
      </div>
    </div>
  );
}
