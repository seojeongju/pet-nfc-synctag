import { ExternalLink, MapPin, Smartphone, Trees } from "lucide-react";
import {
  buildKakaoBarrierFreeTrailHref,
  isInSeoulMetroBounds,
  KAKAO_BARRIER_FREE_TRAIL,
  SEOUL_COMPANION_APP,
} from "@/lib/wayfinder/accessible-routing-links";
import { cn } from "@/lib/utils";

type Props = {
  /** 역 상세 등 좌표가 있으면 서울동행맵 카드 노출 여부 판단 */
  latitude?: number | null;
  longitude?: number | null;
  /** 역 상세에서는 서울동행맵만 간략히 */
  variant?: "main" | "station";
  className?: string;
};

export function WayfinderAccessibleRoutingSection({
  latitude = null,
  longitude = null,
  variant = "main",
  className,
}: Props) {
  const showSeoul =
    variant === "main" ||
    (latitude != null && longitude != null && isInSeoulMetroBounds(latitude, longitude));

  const trailHref = buildKakaoBarrierFreeTrailHref();

  return (
    <section
      className={cn("space-y-3", className)}
      aria-label="교통약자 맞춤 경로 안내 연결"
    >
      <div className="space-y-1 px-0.5">
        <h2 className="text-sm font-black text-slate-900">
          {variant === "main" ? "보행·맞춤 경로 (연결 안내)" : "맞춤 보행 경로"}
        </h2>
        <p className="text-[11px] font-semibold leading-relaxed text-slate-600">
          지하철·역 시설은 링크유-동행, <strong className="text-slate-800">도로·숲길 맞춤 경로</strong>는 아래
          전문 서비스를 이용해 주세요. 카카오맵 일반 길찾기는 <strong className="text-slate-700">참고용</strong>
          입니다.
        </p>
      </div>

      <a
        href={trailHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          <Trees className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-slate-900">카카오맵 · {KAKAO_BARRIER_FREE_TRAIL.searchLabel}</span>
          <span className="mt-1 block text-xs font-semibold leading-relaxed text-slate-600">
            {KAKAO_BARRIER_FREE_TRAIL.description}
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-emerald-800">
            카카오맵에서 코스 보기
            <ExternalLink className="h-3 w-3 opacity-80" aria-hidden />
          </span>
        </span>
      </a>

      {showSeoul ? (
        <div className="rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
              <MapPin className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-black text-slate-900">{SEOUL_COMPANION_APP.name}</p>
              <p className="text-xs font-semibold leading-relaxed text-slate-600">
                {SEOUL_COMPANION_APP.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={SEOUL_COMPANION_APP.playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-[11px] font-black text-sky-900 hover:bg-sky-50"
                >
                  <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Google Play
                  <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                </a>
                <a
                  href={SEOUL_COMPANION_APP.appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-[11px] font-black text-sky-900 hover:bg-sky-50"
                >
                  <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  App Store
                  <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                </a>
              </div>
              {variant === "station" ? (
                <p className="text-[10px] font-semibold text-sky-800/90">
                  앱에서 출발·도착을 설정하면 휠체어·유모차에 맞춘 보행 경로를 안내받을 수 있습니다.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
