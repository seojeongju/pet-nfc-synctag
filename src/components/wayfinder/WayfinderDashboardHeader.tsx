import Link from "next/link";
import {
  Accessibility,
  ExternalLink,
  MapPin,
  Nfc,
  Navigation2,
  TrainFront,
} from "lucide-react";
import {
  linkuCompanionMainLead,
  linkuCompanionMenuTitle,
  linkuCompanionServiceDescription,
  linkuCompanionSpotSubDescription,
  linkuCompanionSpotSubLabel,
  wayfinderAudienceTags,
} from "@/lib/wayfinder/copy";
import { WfFeatureRow, WfIconBadge, WfStatChip } from "@/components/wayfinder/wayfinder-dashboard-ui";

type Props = {
  spotCount: number;
  publishedCount: number;
  publicSpotPageBase: string;
};

export function WayfinderDashboardHeader({ spotCount, publishedCount, publicSpotPageBase }: Props) {
  return (
    <div className="space-y-5">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white px-3 py-1.5 text-[10px] font-black tracking-wider text-indigo-700 shadow-sm">
          <TrainFront className="h-3.5 w-3.5" aria-hidden />
          {linkuCompanionMenuTitle}
          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
            메인
          </span>
        </div>

        <div className="flex items-start gap-3">
          <WfIconBadge icon={TrainFront} tone="indigo" size="lg" />
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-[26px]">
              {linkuCompanionServiceDescription}
            </h1>
            <p className="text-sm font-semibold leading-relaxed text-slate-600">{linkuCompanionMainLead}</p>
          </div>
        </div>

        <ul className="flex flex-wrap gap-1.5" aria-label="이용 대상">
          {wayfinderAudienceTags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200/90 bg-white px-2.5 py-1 text-[10px] font-black text-slate-600 shadow-sm"
            >
              <Accessibility className="h-3 w-3 text-indigo-500" aria-hidden />
              {tag}
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm">
          <WfFeatureRow icon={MapPin} tone="indigo" label="1단계" title="GPS로 근처 역 찾기" />
          <WfFeatureRow icon={Navigation2} tone="violet" label="2단계" title="카카오맵 길찾기" />
        </div>

        <Link
          href="/wayfinder"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-white shadow-md transition hover:from-indigo-700 hover:to-violet-700"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <ExternalLink className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-[10px] font-black uppercase tracking-wider text-indigo-100">방문자 화면</span>
              <span className="block text-sm font-black">지하철 이동 안내 미리보기</span>
            </span>
          </span>
          <Navigation2 className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
        </Link>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <WfStatChip icon={TrainFront} label="메인" value="지하철" tone="indigo" />
        <WfStatChip icon={Nfc} label="스팟" value={`${spotCount}`} tone="violet" />
        <WfStatChip icon={MapPin} label="발행" value={`${publishedCount}`} tone="emerald" />
      </div>

      <section className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <WfIconBadge icon={Nfc} tone="violet" size="md" soft />
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">보조 · {linkuCompanionSpotSubLabel}</p>
          <p className="text-sm font-semibold leading-relaxed text-slate-700">{linkuCompanionSpotSubDescription}</p>
          <p className="font-mono text-[11px] font-bold text-slate-500">
            URL 예: {publicSpotPageBase}/[slug]
          </p>
        </div>
      </section>
    </div>
  );
}
