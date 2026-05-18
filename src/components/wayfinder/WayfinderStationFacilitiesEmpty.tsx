import { AlertTriangle, Navigation2 } from "lucide-react";

type Props = {
  stationName: string;
  routeHref: string;
  dataSource: "d1" | "pilot_seed";
};

export function WayfinderStationFacilitiesEmpty({ stationName, routeHref, dataSource }: Props) {
  return (
    <section
      className="rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4"
      aria-label="편의시설 정보 없음"
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-black text-amber-950">
            {stationName}의 교통약자 편의시설 목록을 아직 불러오지 못했습니다
          </p>
          <p className="text-xs font-semibold leading-relaxed text-amber-900/90">
            {dataSource === "pilot_seed" ? (
              <>
                예시 역이 아니거나, 공공데이터 동기화 전일 수 있습니다. 우선{" "}
                <strong className="text-amber-950">역까지 길찾기</strong>를 이용하고, 승강기·리프트는 역무원·안내
                데스크에 문의해 주세요.
              </>
            ) : (
              <>
                이 역은 동기화되었으나 시설이 등록되지 않았을 수 있습니다.{" "}
                <strong className="text-amber-950">역까지 길찾기</strong> 후 역 직원에게 도움을 요청해 주세요.
              </>
            )}
          </p>
          <a
            href={routeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white shadow-md hover:bg-indigo-700"
          >
            <Navigation2 className="h-4 w-4 shrink-0" aria-hidden />
            {stationName}까지 길찾기 (카카오맵)
          </a>
        </div>
        </div>
    </section>
  );
}
