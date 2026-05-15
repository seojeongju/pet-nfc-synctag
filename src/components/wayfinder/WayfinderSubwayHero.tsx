import { MapPin, Navigation2, TrainFront } from "lucide-react";
import {
  linkuCompanionMainLead,
  linkuCompanionMenuTitle,
  linkuCompanionServiceDescription,
  wayfinderAudienceTags,
} from "@/lib/wayfinder/copy";

export function WayfinderSubwayHero() {
  return (
    <header className="space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/90 px-3 py-1.5 text-[10px] font-black tracking-wider text-indigo-700 shadow-sm backdrop-blur-sm">
        <TrainFront className="h-3.5 w-3.5" aria-hidden />
        {linkuCompanionMenuTitle}
        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
          메인
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-[26px] font-black leading-[1.15] tracking-tight text-slate-900 sm:text-[30px]">
          {linkuCompanionServiceDescription}
        </h1>
        <p className="text-base font-semibold leading-relaxed text-slate-700">{linkuCompanionMainLead}</p>
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label="이용 대상">
        {wayfinderAudienceTags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-slate-200/90 bg-white/80 px-2.5 py-1 text-[10px] font-black text-slate-600 shadow-sm"
          >
            {tag}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-indigo-100/90 bg-white/70 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <MapPin className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-indigo-600">1. 위치</p>
            <p className="text-xs font-semibold leading-snug text-slate-700">GPS로 근처 역 찾기</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Navigation2 className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-violet-600">2. 이동</p>
            <p className="text-xs font-semibold leading-snug text-slate-700">카카오맵 길찾기</p>
          </div>
        </div>
      </div>
    </header>
  );
}
