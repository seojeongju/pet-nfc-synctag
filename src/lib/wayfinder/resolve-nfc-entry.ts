import { getDB } from "@/lib/db";
import { decodeTagPathParam, normalizeTagUid } from "@/lib/tag-uid-format";
import { getPublishedWayfinderSpotBySlug, normalizeWayfinderSlug } from "@/lib/wayfinder-spots-db";
import { buildKakaoMapPinHref, buildKakaoMapRouteHref } from "@/lib/wayfinder/kakao-map-links";
import { normalizeContactPhoneForLink } from "@/lib/wayfinder/normalize-contact-phone";
import type { WayfinderCompanionEntryQuery } from "@/lib/wayfinder/companion-url";
import { isWayfinderNfcEntryQuery } from "@/lib/wayfinder/companion-url";

export type WayfinderOptionalSpotCardData = {
  slug: string;
  title: string;
  summary: string | null;
  floorLabel: string | null;
  contactPhoneDisplay: string | null;
  contactPhone: string | null;
  mapHref: string | null;
  routeHref: string | null;
};

export type WayfinderStationAnchor = {
  stationId: string;
  stationName: string;
  facilityId: string | null;
  facilityLabel: string | null;
};

export type WayfinderNfcEntryContext = {
  fromNfc: boolean;
  tagId: string | null;
  spot: WayfinderOptionalSpotCardData | null;
  stationAnchor: WayfinderStationAnchor | null;
};

async function loadOptionalSpotBySlug(slugRaw: string): Promise<WayfinderOptionalSpotCardData | null> {
  const slug = normalizeWayfinderSlug(slugRaw);
  if (!slug) return null;
  try {
    const row = await getPublishedWayfinderSpotBySlug(getDB(), slug);
    if (!row) return null;
    const hasCoords =
      row.latitude != null &&
      row.longitude != null &&
      Number.isFinite(row.latitude) &&
      Number.isFinite(row.longitude);
    const contactPhoneDisplay = (row.contact_phone ?? "").trim() || null;
    const contactPhone = normalizeContactPhoneForLink(row.contact_phone);
    return {
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      floorLabel: row.floor_label,
      contactPhoneDisplay,
      contactPhone,
      mapHref: hasCoords ? buildKakaoMapPinHref(row.title, row.latitude!, row.longitude!) : null,
      routeHref: hasCoords ? buildKakaoMapRouteHref(row.title, row.latitude!, row.longitude!) : null,
    };
  } catch {
    return null;
  }
}

async function stationAnchorFromTagId(tagId: string): Promise<WayfinderStationAnchor | null> {
  try {
    const row = await getDB()
      .prepare(
        `SELECT t.wayfinder_station_id AS station_id,
                t.wayfinder_facility_id AS facility_id,
                s.name AS station_name,
                f.label AS facility_label
         FROM tags t
         LEFT JOIN wayfinder_stations s ON s.id = t.wayfinder_station_id
         LEFT JOIN wayfinder_station_facilities f ON f.id = t.wayfinder_facility_id
         WHERE t.id = ?`
      )
      .bind(tagId)
      .first<{
        station_id: string | null;
        facility_id: string | null;
        station_name: string | null;
        facility_label: string | null;
      }>();
    const stationId = (row?.station_id ?? "").trim();
    if (!stationId) return null;
    return {
      stationId,
      stationName: (row?.station_name ?? "").trim() || stationId,
      facilityId: (row?.facility_id ?? "").trim() || null,
      facilityLabel: (row?.facility_label ?? "").trim() || null,
    };
  } catch {
    return null;
  }
}

async function spotSlugFromTagId(tagId: string): Promise<string | null> {
  try {
    const row = await getDB()
      .prepare(
        `SELECT w.slug AS slug
         FROM tags t
         LEFT JOIN wayfinder_spots w ON w.id = t.wayfinder_spot_id
         WHERE t.id = ?`
      )
      .bind(tagId)
      .first<{ slug: string | null }>();
    const slug = (row?.slug ?? "").trim();
    return slug || null;
  } catch {
    return null;
  }
}

export async function resolveWayfinderNfcEntry(
  query: WayfinderCompanionEntryQuery
): Promise<WayfinderNfcEntryContext> {
  const fromNfc = isWayfinderNfcEntryQuery(query);
  const tagRaw = (query.tag ?? "").trim();
  const tagId = tagRaw ? normalizeTagUid(decodeTagPathParam(tagRaw)) : null;

  let spotSlug = (query.spot ?? "").trim();
  if (!spotSlug && tagId) {
    spotSlug = (await spotSlugFromTagId(tagId)) ?? "";
  }

  const spot = spotSlug ? await loadOptionalSpotBySlug(spotSlug) : null;
  const stationAnchor = tagId ? await stationAnchorFromTagId(tagId) : null;

  return { fromNfc, tagId, spot, stationAnchor };
}
