import Link from "next/link";
import { MapPin, TrainFront } from "lucide-react";
import type { WayfinderStationAnchor } from "@/lib/wayfinder/resolve-nfc-entry";

type Props = {
  anchor: WayfinderStationAnchor;
};

export function WayfinderStationAnchorCard({ anchor }: Props) {
  const href = anchor.facilityId
    ? `/wayfinder/stations/${encodeURIComponent(anchor.stationId)}?facility=${encodeURIComponent(anchor.facilityId)}`
    : `/wayfinder/stations/${encodeURIComponent(anchor.stationId)}`;

  return (
    <section className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/90 p-4 shadow-sm">
      <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-800">
        <TrainFront className="h-3.5 w-3.5" aria-hidden />
        NFC 역 앵커
      </p>
      <p className="text-base font-black text-slate-900">{anchor.stationName}</p>
      {anchor.facilityLabel ? (
        <p className="mt-1 text-sm font-bold text-indigo-800">{anchor.facilityLabel}</p>
      ) : null}
      <Link
        href={href}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"
      >
        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
        역·시설 안내 열기
      </Link>
    </section>
  );
}
