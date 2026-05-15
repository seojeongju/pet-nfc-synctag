import { Nfc, TrainFront } from "lucide-react";
import { linkuCompanionMenuTitle } from "@/lib/wayfinder/copy";

type Props = {
  tagId?: string | null;
};

export function WayfinderNfcWelcome({ tagId }: Props) {
  return (
    <section
      className="overflow-hidden rounded-[24px] border-2 border-emerald-300/80 bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 p-[1px] shadow-lg shadow-emerald-200/30"
      aria-label="NFC 태그 인식"
    >
      <div className="rounded-[22px] bg-white/95 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <Nfc className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
              {linkuCompanionMenuTitle}
            </p>
            <h2 className="text-lg font-black leading-snug text-slate-900 sm:text-xl">
              태그가 인식되었습니다
            </h2>
            <p className="text-sm font-semibold leading-relaxed text-slate-600">
              지금 위치(GPS)에서 <strong className="text-slate-800">가장 가까운 지하철역</strong>을 찾고, 카카오맵으로
              이동 경로를 안내합니다.
            </p>
            {tagId ? (
              <p className="pt-1 text-[10px] font-mono font-bold text-slate-400">태그 {tagId}</p>
            ) : null}
          </div>
          <TrainFront className="hidden h-8 w-8 shrink-0 text-indigo-200 sm:block" aria-hidden />
        </div>
      </div>
    </section>
  );
}
