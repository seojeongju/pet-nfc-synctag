import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Navigation2 } from "lucide-react";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getWayfinderStationById } from "@/lib/wayfinder-stations-db";
import { linkuCompanionMenuTitle, linkuCompanionServiceDescription } from "@/lib/wayfinder/copy";
import { buildKakaoMapPinHref, buildKakaoMapRouteHref } from "@/lib/wayfinder/kakao-map-links";
import { buildPublicMetadata } from "@/lib/seo";
import { WayfinderStationMap } from "@/components/wayfinder/WayfinderStationMap";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function loadStation(idRaw: string) {
  const id = typeof idRaw === "string" ? idRaw.trim() : "";
  if (!id) return null;
  try {
    const ctx = getCfRequestContext();
    return await getWayfinderStationById(ctx.env.DB, id);
  } catch (e) {
    console.error("wayfinder station load error:", e);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const row = await loadStation(id);
  if (!row) {
    return { title: `역을 찾을 수 없습니다 | ${linkuCompanionMenuTitle}` };
  }
  return buildPublicMetadata({
    title: `${row.name} | ${linkuCompanionMenuTitle}`,
    description: `${row.name} — ${linkuCompanionServiceDescription}`,
    path: `/wayfinder/stations/${row.id}`,
    keywords: ["링크유", "동행", "지하철", "교통약자", row.name],
    noIndex: true,
  });
}

export default async function WayfinderStationPage({ params }: PageProps) {
  const { id } = await params;
  const row = await loadStation(id);
  if (!row) notFound();

  const mapHref = buildKakaoMapPinHref(row.name, row.latitude, row.longitude);
  const routeHref = buildKakaoMapRouteHref(row.name, row.latitude, row.longitude);

  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-lg flex-col gap-6 px-4 py-10 font-outfit text-slate-900 sm:px-5"
      lang="ko"
    >
      <Link
        href="/wayfinder"
        className="inline-flex w-fit items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-800"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        근처 역 다시 찾기
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-indigo-600">{linkuCompanionMenuTitle}</p>
        <h1 className="text-2xl font-black leading-tight tracking-tight">{row.name}</h1>
        {row.lines ? <p className="text-sm font-semibold text-slate-600">{row.lines}</p> : null}
      </header>

      <WayfinderStationMap latitude={row.latitude} longitude={row.longitude} label={row.name} />

      <section className="grid grid-cols-2 gap-2" aria-label="카카오맵 바로가기">
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 active:scale-[0.98]"
        >
          <MapPin className="h-6 w-6 text-indigo-600" aria-hidden />
          <span className="text-[11px] font-black text-slate-800">카카오맵에서 보기</span>
        </a>
        <a
          href={routeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-b-4 border-indigo-700 bg-indigo-600 p-3 text-center text-white shadow-md transition active:scale-[0.98]"
        >
          <Navigation2 className="h-6 w-6" aria-hidden />
          <span className="text-[11px] font-black">길찾기(카카오맵)</span>
        </a>
      </section>

      <p className="text-center text-[11px] font-semibold leading-relaxed text-slate-500">
        엘리베이터·에스컬레이터 등 역내 시설 안내는 2단계에서 추가됩니다. NFC 스팟 안내는 역에 설치된 태그 URL로
        연결됩니다.
      </p>

      <footer className="border-t border-slate-100 pt-4 text-center">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 hover:bg-slate-50"
        >
          링크유 홈
        </Link>
      </footer>
    </main>
  );
}
