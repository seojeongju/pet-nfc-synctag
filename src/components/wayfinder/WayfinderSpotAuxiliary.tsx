import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Layers,
  MapPin,
  Nfc,
  Settings2,
  TrainFront,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  linkuCompanionSpotAuxiliaryLead,
  linkuCompanionSpotExamplePlaces,
  linkuCompanionSpotSubLabel,
} from "@/lib/wayfinder/copy";
import { companionWayfinderPath } from "@/lib/companion/dashboard-paths";
import { WfIconBadge } from "@/components/wayfinder/wayfinder-dashboard-ui";

const flowSteps: { icon: LucideIcon; title: string; body: string; tone: "violet" | "indigo" | "slate" }[] = [
  {
    icon: Nfc,
    title: "NFC 태그·QR",
    body: "역·시설에 부착된 태그나 QR을 스캔해 동행 안내를 엽니다.",
    tone: "violet",
  },
  {
    icon: TrainFront,
    title: "메인: 가까운 역·이동",
    body: "GPS로 근처 지하철역을 찾고, 서울동행맵·카카오맵으로 이동 경로를 안내받습니다.",
    tone: "indigo",
  },
  {
    icon: Building2,
    title: "보조: 이 지점 안내",
    body: "담당자가 연결해 둔 지점(층·이용 단계·연락처)이 있으면 추가 카드로 표시됩니다.",
    tone: "slate",
  },
];

export function WayfinderSpotAuxiliary() {
  const dashboardHref = companionWayfinderPath();

  return (
    <details className="group overflow-hidden rounded-[24px] border border-violet-200/80 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <WfIconBadge icon={Nfc} tone="violet" size="md" soft />
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-wide text-violet-600">
              보조 기능
            </span>
            <span className="block text-sm font-black text-slate-900">{linkuCompanionSpotSubLabel}</span>
          </span>
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-violet-400 transition group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="space-y-4 border-t border-violet-100/90 bg-gradient-to-b from-violet-50/50 to-white px-4 py-4 sm:px-5">
        <p className="text-sm font-semibold leading-relaxed text-slate-700">{linkuCompanionSpotAuxiliaryLead}</p>

        <ol className="space-y-2" aria-label="NFC·지점 안내 흐름">
          {flowSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex gap-3 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm ring-1 ring-slate-200/60"
              >
                <WfIconBadge icon={Icon} tone={step.tone} size="sm" soft className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900">
                    <span className="mr-1.5 text-[10px] font-black text-slate-400">{i + 1}</span>
                    {step.title}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-600">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="rounded-2xl border border-violet-100 bg-violet-50/40 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-violet-700">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            연결 예시
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="지점 연결 예시">
            {linkuCompanionSpotExamplePlaces.map((label) => (
              <li key={label}>
                <span className="inline-flex rounded-full border border-violet-200/90 bg-white px-2.5 py-1 text-[11px] font-bold text-violet-900">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <p className="text-[11px] font-semibold leading-relaxed text-slate-600">
            지점을 연결하지 않아도 <strong className="font-black text-slate-800">지하철·길찾기 안내</strong>는 그대로
            이용할 수 있습니다.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
            <Settings2 className="h-3.5 w-3.5" aria-hidden />
            시설·보호자용
          </p>
          <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-600">
            지점 등록·발행은 허브 → 링크유-동행 → 대시보드에서 할 수 있습니다.
          </p>
          <Link
            href={dashboardHref}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-xs font-black text-violet-900 transition hover:bg-violet-100 active:scale-[0.99]"
          >
            동행 대시보드 열기
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </details>
  );
}
