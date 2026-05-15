import { Building2, ChevronDown, MapPin, Navigation2, Phone } from "lucide-react";
import { linkuCompanionSpotSubLabel } from "@/lib/wayfinder/copy";
import type { WayfinderOptionalSpotCardData } from "@/lib/wayfinder/resolve-nfc-entry";

type Props = {
  spot: WayfinderOptionalSpotCardData;
};

export function WayfinderOptionalSpotCard({ spot }: Props) {
  return (
    <details className="group rounded-2xl border border-slate-200/90 bg-slate-50/90 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200/80 text-slate-600">
            <Building2 className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">
              보조 · {linkuCompanionSpotSubLabel}
            </span>
            <span className="block truncate text-sm font-black text-slate-800">{spot.title}</span>
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-3 border-t border-slate-200/80 px-4 py-3">
        {spot.summary ? (
          <p className="text-xs font-semibold leading-relaxed text-slate-600">{spot.summary}</p>
        ) : null}
        {spot.floorLabel ? (
          <p className="text-[11px] font-bold text-slate-500">{spot.floorLabel}</p>
        ) : null}
        {spot.contactPhoneDisplay && spot.contactPhone ? (
          <a
            href={`tel:${spot.contactPhone}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
          >
            <Phone className="h-3.5 w-3.5 text-teal-600" aria-hidden />
            {spot.contactPhoneDisplay}
          </a>
        ) : null}
        {spot.routeHref ? (
          <a
            href={spot.routeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-black text-slate-800"
          >
            <Navigation2 className="h-4 w-4 text-indigo-600" aria-hidden />
            이 지점 위치로 길찾기
          </a>
        ) : null}
        {spot.mapHref ? (
          <a
            href={spot.mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-2 text-[11px] font-bold text-slate-600"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            지점 지도에서 보기
          </a>
        ) : null}
      </div>
    </details>
  );
}
