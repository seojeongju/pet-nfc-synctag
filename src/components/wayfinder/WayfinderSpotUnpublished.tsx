import Link from "next/link";
import { Clock, Navigation2 } from "lucide-react";
import { linkuCompanionMenuTitle } from "@/lib/wayfinder/copy";
export function WayfinderSpotUnpublished() {
  return (
    <div className="mx-auto flex min-h-[50vh] flex-col items-center justify-center gap-5 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700">
        <Clock className="h-8 w-8" aria-hidden />
      </div>
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black text-indigo-700">
          <Navigation2 className="h-3.5 w-3.5" aria-hidden />
          {linkuCompanionMenuTitle}
        </p>
        <h1 className="text-xl font-black text-slate-900">아직 공개되지 않은 안내입니다</h1>
        <p className="text-sm font-medium leading-relaxed text-slate-600">
          이 주소는 등록되었지만 발행 전 상태입니다. 시설 담당자가 공개(발행)한 뒤 다시 스캔해 주세요.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/wayfinder"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-xs font-black text-white hover:bg-indigo-700"
        >
          지하철 이동 안내
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 hover:bg-slate-50"
        >
          링크유 홈
        </Link>
      </div>
    </div>
  );
}
