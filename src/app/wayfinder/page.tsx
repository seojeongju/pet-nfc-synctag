import { notFound } from "next/navigation";
import { linkuCompanionMenuTitle, linkuCompanionServiceDescription } from "@/lib/wayfinder/copy";
import { isWayfinderEnabled } from "@/lib/wayfinder/feature";
import { buildPublicMetadata } from "@/lib/seo";
import { WayfinderNearbyStations } from "@/components/wayfinder/WayfinderNearbyStations";

export const metadata = buildPublicMetadata({
  title: `${linkuCompanionMenuTitle} | ${linkuCompanionServiceDescription}`,
  description: `GPS로 근처 지하철역을 찾고, 카카오맵으로 이동·시설 안내를 받습니다.`,
  path: "/wayfinder",
  keywords: ["링크유", "동행", "교통약자", "지하철", "GPS", "카카오맵", "접근성"],
  noIndex: true,
});

export default function WayfinderPage() {
  if (!isWayfinderEnabled()) {
    notFound();
  }

  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-lg flex-col gap-6 px-4 py-12 font-outfit text-slate-900 sm:px-5"
      lang="ko"
    >
      <header className="space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-indigo-600">{linkuCompanionMenuTitle}</p>
        <h1 className="text-2xl font-black tracking-tight leading-snug">{linkuCompanionServiceDescription}</h1>
        <p className="text-base font-medium leading-relaxed text-slate-700">
          휠체어·시각장애·유모차 등 교통약자를 위해, 지금 위치에서 가까운 지하철역을 찾고 카카오맵으로 안내합니다.
        </p>
      </header>

      <WayfinderNearbyStations />

      <p className="text-sm font-medium leading-relaxed text-slate-600">
        NFC·QR로 연결된 개별 안내 스팟은{" "}
        <span className="font-mono text-xs text-slate-700">/wayfinder/s/스팟-slug</span> 주소로 열립니다. 보호자는
        허브에서 링크유-동행을 선택한 뒤 대시보드에서 스팟을 관리할 수 있습니다.
      </p>
    </main>
  );
}
