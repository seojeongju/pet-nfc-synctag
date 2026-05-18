import type { WayfinderFacilityPublic, WayfinderFacilityType } from "@/lib/wayfinder/facility-types";

export type FacilityFilterId = "all" | "elevator" | "accessible_toilet" | "wheelchair_lift";

export type FacilityFilterOption = {
  id: FacilityFilterId;
  label: string;
  types: WayfinderFacilityType[] | null;
};

export const FACILITY_FILTER_OPTIONS: FacilityFilterOption[] = [
  { id: "all", label: "전체", types: null },
  { id: "elevator", label: "엘리베이터", types: ["elevator"] },
  { id: "accessible_toilet", label: "장애인 화장실", types: ["accessible_toilet"] },
  { id: "wheelchair_lift", label: "휠체어리프트", types: ["wheelchair_lift"] },
];

export function filterFacilitiesByType<T extends { type: WayfinderFacilityType }>(
  items: T[],
  filterId: FacilityFilterId
): T[] {
  if (filterId === "all") return items;
  const option = FACILITY_FILTER_OPTIONS.find((o) => o.id === filterId);
  if (!option?.types) return items;
  return items.filter((f) => option.types!.includes(f.type));
}

export function countFacilitiesByFilter(
  facilities: WayfinderFacilityPublic[]
): Record<FacilityFilterId, number> {
  const counts: Record<FacilityFilterId, number> = {
    all: facilities.length,
    elevator: 0,
    accessible_toilet: 0,
    wheelchair_lift: 0,
  };
  for (const f of facilities) {
    if (f.type === "elevator") counts.elevator += 1;
    else if (f.type === "accessible_toilet") counts.accessible_toilet += 1;
    else if (f.type === "wheelchair_lift") counts.wheelchair_lift += 1;
  }
  return counts;
}
