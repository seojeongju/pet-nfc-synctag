import Link from "next/link";
import {
  Accessibility,
  Baby,
  Briefcase,
  ExternalLink,
  MapPin,
  Nfc,
  Navigation2,
  TrainFront,
  UserRound,
} from "lucide-react";
import { linkuCompanionMenuTitle, linkuCompanionServiceDescription } from "@/lib/wayfinder/copy";
import { WfFlowTile, WfIconBadge, WfStatChip } from "@/components/wayfinder/wayfinder-dashboard-ui";

type Props = {
  spotCount: number;
  publishedCount: number;
};

const audienceIcons = [
  { icon: Accessibility, label: "휠체어" },
  { icon: UserRound, label: "시각장애" },
  { icon: Baby, label: "유모차" },
  { icon: Briefcase, label: "교통약자" },
] as const;

export function WayfinderDashboardHeader({ spotCount, publishedCount }: Props) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[28px] border border-indigo-100/90 bg-white shadow-lg">
        <div className="flex items-center gap-3 border-b border-indigo-50 bg-gradient-to-r from-indigo-50/90 to-violet-50/50 px-4 py-4">
          <WfIconBadge icon={TrainFront} tone="indigo" size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{linkuCompanionMenuTitle}</p>
            <h1 className="text-lg font-black leading-tight text-slate-900">{linkuCompanionServiceDescription}</h1>
          </div>
          <Link
            href="/wayfinder"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.97]"
            aria-label="방문자 화면 미리보기"
            title="방문자 화면 미리보기"
          >
            <ExternalLink className="h-5 w-5" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 p-3">
          <WfFlowTile icon={MapPin} caption="근처 역" tone="indigo" />
          <WfFlowTile icon={Navigation2} caption="길찾기" tone="violet" />
          <WfFlowTile icon={TrainFront} caption="역 안내" tone="teal" />
        </div>

        <div className="flex justify-center gap-2 border-t border-slate-100 px-3 py-2.5" aria-label="이용 대상">
          {audienceIcons.map(({ icon: Icon, label }) => (
            <span
              key={label}
              title={label}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600 shadow-sm"
            >
              <Icon className="h-4 w-4 text-indigo-500" aria-hidden />
              <span className="sr-only">{label}</span>
            </span>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <WfStatChip icon={TrainFront} label="메인" value="지하철" tone="indigo" />
        <WfStatChip icon={Nfc} label="스팟" value={spotCount} tone="violet" />
        <WfStatChip icon={MapPin} label="발행" value={publishedCount} tone="emerald" />
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 px-3 py-2.5"
        title="NFC·QR로 연결하는 시설·지점 안내"
      >
        <WfIconBadge icon={Nfc} tone="violet" size="sm" soft />
        <p className="min-w-0 flex-1 text-xs font-black text-violet-900">NFC·QR 스팟</p>
      </div>
    </div>
  );
}
