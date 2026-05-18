import { notFound } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { listWayfinderStationFacilities } from "@/lib/wayfinder-station-facilities-db";
import { getWayfinderStationById } from "@/lib/wayfinder-stations-db";
import { buildFacilityMapPoints } from "@/lib/wayfinder/facility-map-layout";
import { toPublicFacility } from "@/lib/wayfinder/facility-types";
import { linkuCompanionMenuTitle, linkuCompanionServiceDescription } from "@/lib/wayfinder/copy";
import { buildKakaoMapPinHref, buildKakaoMapRouteHref } from "@/lib/wayfinder/kakao-map-links";
import { buildPublicMetadata } from "@/lib/seo";
import { WayfinderPublicShell } from "@/components/wayfinder/WayfinderPublicShell";
import { WayfinderStationDetail } from "@/components/wayfinder/WayfinderStationDetail";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ facility?: string }>;
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
    title: `${row.name} 이동 안내 | ${linkuCompanionMenuTitle}`,
    description: `${row.name} — ${linkuCompanionServiceDescription}. 카카오맵 길찾기.`,
    path: `/wayfinder/stations/${row.id}`,
    keywords: ["링크유", "동행", "지하철", "교통약자", "길찾기", row.name],
    noIndex: true,
  });
}

export default async function WayfinderStationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const initialFacilityId = typeof sp.facility === "string" ? sp.facility.trim() : "";
  const row = await loadStation(id);
  if (!row) notFound();

  const mapHref = buildKakaoMapPinHref(row.name, row.latitude, row.longitude);
  const routeHref = buildKakaoMapRouteHref(row.name, row.latitude, row.longitude);

  let facilities: ReturnType<typeof toPublicFacility>[] = [];
  let mapPoints = buildFacilityMapPoints(row.latitude, row.longitude, []);
  let facilitiesSource: "d1" | "pilot_seed" = "pilot_seed";
  let facilitiesSyncedAt: string | null = null;
  try {
    const ctx = getCfRequestContext();
    const loaded = await listWayfinderStationFacilities(ctx.env.DB, row.id, row.name);
    facilities = loaded.facilities.map(toPublicFacility);
    mapPoints = buildFacilityMapPoints(row.latitude, row.longitude, loaded.facilities);
    facilitiesSource = loaded.source;
    facilitiesSyncedAt = loaded.facilities[0]?.synced_at ?? null;
  } catch (e) {
    console.error("wayfinder facilities load error:", e);
  }

  return (
    <WayfinderPublicShell backHref="/wayfinder" backLabel="근처 역 다시 찾기">
      <WayfinderStationDetail
        name={row.name}
        lines={row.lines}
        latitude={row.latitude}
        longitude={row.longitude}
        mapHref={mapHref}
        routeHref={routeHref}
        facilities={facilities}
        mapPoints={mapPoints}
        facilitiesSource={facilitiesSource}
        facilitiesSyncedAt={facilitiesSyncedAt}
        initialSelectedFacilityId={initialFacilityId || null}
      />
    </WayfinderPublicShell>
  );
}
