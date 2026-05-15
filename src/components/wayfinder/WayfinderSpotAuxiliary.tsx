import { Nfc, ChevronDown } from "lucide-react";
import { linkuCompanionSpotSubDescription, linkuCompanionSpotSubLabel } from "@/lib/wayfinder/copy";

/** 지하철 메인 플로우 아래 — 스팟·NFC 안내는 보조 기능으로 접어 둠 */
export function WayfinderSpotAuxiliary() {
  return (
    <details className="group rounded-2xl border border-slate-200/90 bg-slate-50/80 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 text-sm font-black text-slate-700 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Nfc className="h-4 w-4 text-slate-500" aria-hidden />
          보조: {linkuCompanionSpotSubLabel}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-2 border-t border-slate-200/80 px-4 py-3 text-xs font-semibold leading-relaxed text-slate-600">
        <p>{linkuCompanionSpotSubDescription}</p>
        <p>
          태그·QR로 연결된 주소 예:{" "}
          <span className="font-mono text-[10px] text-slate-800">/wayfinder/s/스팟-slug</span>
        </p>
        <p className="text-[11px] text-slate-500">
          보호자·시설 담당자는 허브 → 링크유-동행 → 대시보드에서 스팟을 등록·발행합니다.
        </p>
      </div>
    </details>
  );
}
