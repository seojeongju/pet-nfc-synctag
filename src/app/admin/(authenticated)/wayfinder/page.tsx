import { redirect } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { resolveAdminScope } from "@/lib/admin-authz";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import {
  WayfinderAccessibilitySyncCard,
  type WayfinderSyncStationOption,
} from "@/components/admin/wayfinder/WayfinderAccessibilitySyncCard";
import { getDedupedMetroStationsForSync } from "@/lib/wayfinder/sync-station-accessibility";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

export const runtime = "edge";

const PILOT_STATIONS: WayfinderSyncStationOption[] = [
  { id: "seoul-station", name: "서울역" },
  { id: "gangnam-station", name: "강남역" },
  { id: "jamsil-station", name: "잠실역" },
  { id: "hongdae-station", name: "홍대입구" },
];

async function loadSyncStationOptions(): Promise<WayfinderSyncStationOption[]> {
  try {
    const ctx = getCfRequestContext();
    const { results } = await ctx.env.DB.prepare(
      `SELECT id, name FROM wayfinder_stations WHERE is_active = 1 ORDER BY name ASC`
    ).all<{ id: string; name: string }>();
    if (results && results.length > 0) {
      return results.map((r) => ({ id: r.id, name: r.name }));
    }
  } catch {
    /* 테이블 미적용 등 */
  }
  return PILOT_STATIONS;
}

export default async function AdminWayfinderPage() {
  const scope = await resolveAdminScope("admin");
  if (!scope.actor.isPlatformAdmin) {
    redirect("/admin/nfc-tags");
  }

  const stations = await loadSyncStationOptions();

  return (
    <div className={cn("relative", adminUi.pageBottomSafe)}>
      <div className={adminUi.nfcTagsPageBody}>
        <div className="mb-8 space-y-6">
          <AdminPageIntro
            title="링크유-동행 · 교통약자 시설"
            subtitle="수도권 전체 역(역명 중복 제거) 또는 파일럿·단일 역 단위로 공공데이터 편의시설을 D1에 동기화합니다."
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
              { label: "동행 시설 동기화" },
            ]}
          />
        </div>
        <WayfinderAccessibilitySyncCard
          stations={stations}
          initialMetroStationCount={getDedupedMetroStationsForSync().length}
        />
      </div>
    </div>
  );
}
