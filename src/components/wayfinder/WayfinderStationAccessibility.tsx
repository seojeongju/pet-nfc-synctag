import {
  Accessibility,
  ArrowUpFromLine,
  Bath,
  CircleHelp,
  Phone,
  Zap,
} from "lucide-react";
import type { WayfinderFacilityPublic, WayfinderFacilityType } from "@/lib/wayfinder/facility-types";

type Props = {
  facilities: WayfinderFacilityPublic[];
  dataSource: "d1" | "pilot_seed";
  syncedAt: string | null;
};

const TYPE_ICONS: Partial<Record<WayfinderFacilityType, typeof Accessibility>> = {
  elevator: ArrowUpFromLine,
  wheelchair_lift: Accessibility,
  accessible_toilet: Bath,
  sign_language_phone: Phone,
  wheelchair_charger: Zap,
};

function FacilityIcon({ type }: { type: WayfinderFacilityType }) {
  const Icon = TYPE_ICONS[type] ?? CircleHelp;
  return <Icon className="h-4 w-4 shrink-0 text-teal-700" aria-hidden />;
}

function FacilityRow({ facility: f }: { facility: WayfinderFacilityPublic }) {
  const meta: string[] = [];
  if (f.entrance) meta.push(`${f.entrance}번 출입구`);
  if (f.floor) meta.push(f.floor);
  if (f.lineName) meta.push(f.lineName);

  return (
    <div className="flex gap-2.5">
      <FacilityIcon type={f.type} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-900">{f.label}</p>
        {meta.length > 0 ? (
          <p className="mt-0.5 text-[11px] font-semibold text-slate-600">{meta.join(" · ")}</p>
        ) : null}
        {f.operationLabel ? (
          <p className="mt-1 inline-flex rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
            {f.operationLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function formatSyncedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function WayfinderStationAccessibility({ facilities, dataSource, syncedAt }: Props) {
  const hasFacilities = facilities.length > 0;

  return (
    <section
      className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4"
      aria-label="교통약자 편의시설"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-teal-800">
          <Accessibility className="h-4 w-4" aria-hidden />
          교통약자 편의시설
        </p>
        {dataSource === "pilot_seed" ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
            예시 데이터
          </span>
        ) : (
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-900">
            공공데이터 연동
          </span>
        )}
      </div>

      {!hasFacilities ? (
        <p className="text-xs font-semibold leading-relaxed text-teal-950/90">
          이 역의 편의시설 정보를 불러오지 못했습니다. 역무원·안내 데스크에 문의하거나 아래 길찾기를
          이용해 주세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {facilities.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-teal-100/80 bg-white/90 px-3 py-2.5 shadow-sm"
            >
              <FacilityRow facility={f} />
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-3 space-y-1 border-t border-teal-100/80 pt-3 text-xs font-semibold leading-relaxed text-teal-950/85">
        <li>· 승강기·리프트 이용이 어려우면 역 직원에게 도움을 요청하세요.</li>
        <li>· 긴급 시 119 또는 역 안내 데스크에 연락하세요.</li>
        <li>· NFC로 설치된 지점 안내가 있으면 해당 태그를 스캔해 보조 안내를 받을 수 있습니다.</li>
        {dataSource === "pilot_seed" ? (
          <li>· 운영 환경에서는 공공데이터 동기화 후 실제 시설 목록이 표시됩니다.</li>
        ) : syncedAt ? (
          <li>· 데이터 기준: {formatSyncedAt(syncedAt)}</li>
        ) : null}
      </ul>
    </section>
  );
}
