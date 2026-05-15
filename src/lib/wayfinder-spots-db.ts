import type { D1Database } from "@cloudflare/workers-types";
import type { SubjectKind } from "@/lib/subject-kind";
import type { TenantRole } from "@/types/tenant-subscription";
import { roleAtLeast, getMembership } from "@/lib/tenant-membership";

export type WayfinderSpotRow = {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  subject_kind: string;
  slug: string;
  title: string;
  summary: string | null;
  guide_text: string | null;
  latitude: number | null;
  longitude: number | null;
  floor_label: string | null;
  contact_phone: string | null;
  is_published: number;
  created_at: string;
  updated_at: string;
};

const WF_SPOT_SELECT = `id, owner_id, tenant_id, subject_kind, slug, title, summary, guide_text,
              latitude, longitude, floor_label, contact_phone, is_published, created_at, updated_at`;

export type WayfinderSlugAvailability = "published" | "draft" | "missing";

const RESERVED_SLUGS = new Set(["api", "public", "static", "wayfinder", "dashboard", "login"]);

export function normalizeWayfinderSlug(raw: string): string | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (s.length < 3 || s.length > 64) return null;
  if (RESERVED_SLUGS.has(s)) return null;
  return s;
}

export async function wayfinderSlugExists(db: D1Database, slug: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS ok FROM wayfinder_spots WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<{ ok: number }>();
  return row != null;
}

export async function wayfinderSlugExistsExcept(db: D1Database, slug: string, exceptSpotId: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS ok FROM wayfinder_spots WHERE slug = ? AND id != ? LIMIT 1")
    .bind(slug, exceptSpotId)
    .first<{ ok: number }>();
  return row != null;
}

export async function listWayfinderSpotsForOwnerKind(
  db: D1Database,
  ownerId: string,
  subjectKind: SubjectKind,
  tenantId?: string
): Promise<WayfinderSpotRow[]> {
  const tenant = (tenantId ?? "").trim();
  const query = tenant
    ? `SELECT ${WF_SPOT_SELECT}
       FROM wayfinder_spots
       WHERE owner_id = ? AND subject_kind = ? AND tenant_id = ?
       ORDER BY datetime(updated_at) DESC`
    : `SELECT ${WF_SPOT_SELECT}
       FROM wayfinder_spots
       WHERE owner_id = ? AND subject_kind = ? AND tenant_id IS NULL
       ORDER BY datetime(updated_at) DESC`;
  const stmt = db.prepare(query);
  const { results } = await (tenant ? stmt.bind(ownerId, subjectKind, tenant) : stmt.bind(ownerId, subjectKind)).all<
    WayfinderSpotRow
  >();
  return results ?? [];
}

/**
 * 개인: 본인이 만든 스팟만. 조직: 본인 스팟 + 해당 테넌트에서 owner/admin 인 경우 동일 테넌트의 모든 스팟.
 */
export async function listWayfinderSpotsForDashboard(
  db: D1Database,
  userId: string,
  subjectKind: SubjectKind,
  tenantId?: string
): Promise<WayfinderSpotRow[]> {
  const tenant = (tenantId ?? "").trim();
  if (!tenant) {
    return listWayfinderSpotsForOwnerKind(db, userId, subjectKind, undefined);
  }
  const { results } = await db
    .prepare(
      `SELECT w.id, w.owner_id, w.tenant_id, w.subject_kind, w.slug, w.title, w.summary, w.guide_text,
              w.latitude, w.longitude, w.floor_label, w.contact_phone, w.is_published, w.created_at, w.updated_at
       FROM wayfinder_spots w
       WHERE w.subject_kind = ? AND w.tenant_id = ?
         AND (
           w.owner_id = ?
           OR EXISTS (
             SELECT 1 FROM tenant_members tm
             WHERE tm.tenant_id = w.tenant_id AND tm.user_id = ?
               AND tm.role IN ('owner', 'admin')
           )
         )
       ORDER BY datetime(w.updated_at) DESC`
    )
    .bind(subjectKind, tenant, userId, userId)
    .all<WayfinderSpotRow>();
  return results ?? [];
}

/** 목록·수정 화면에 노출 가능한 스팟 단건 (조직은 owner/admin이 타인 스팟도 조회 가능) */
export async function getWayfinderSpotForDashboard(
  db: D1Database,
  spotId: string,
  userId: string,
  subjectKind: SubjectKind,
  tenantId?: string
): Promise<WayfinderSpotRow | null> {
  const row = await db
    .prepare(
      `SELECT ${WF_SPOT_SELECT}
       FROM wayfinder_spots WHERE id = ? AND subject_kind = ?`
    )
    .bind(spotId, subjectKind)
    .first<WayfinderSpotRow>();
  if (!row) return null;

  const tenant = (tenantId ?? "").trim();
  if (!row.tenant_id) {
    if (tenant) return null;
    return row.owner_id === userId ? row : null;
  }
  if (row.tenant_id !== tenant) return null;
  if (row.owner_id === userId) return row;
  const role = await getMembership(db, userId, row.tenant_id);
  if (role && roleAtLeast(role, "admin")) return row;
  return null;
}

export function canMutateWayfinderSpot(
  userId: string,
  spot: WayfinderSpotRow,
  tenantIdParam: string | null,
  tenantRole: TenantRole | null
): boolean {
  if (!spot.tenant_id) {
    if (tenantIdParam) return false;
    return spot.owner_id === userId;
  }
  if (spot.tenant_id !== tenantIdParam) return false;
  if (spot.owner_id === userId) return true;
  return tenantRole != null && roleAtLeast(tenantRole, "admin");
}

export async function deleteWayfinderSpotByIdOnly(db: D1Database, id: string): Promise<boolean> {
  const r = await db.prepare("DELETE FROM wayfinder_spots WHERE id = ?").bind(id).run();
  return (r.meta?.changes ?? 0) > 0;
}

export async function updateWayfinderSpotFields(
  db: D1Database,
  spotId: string,
  fields: {
    slug: string;
    title: string;
    summary: string | null;
    guideText: string | null;
    lat: number | null;
    lon: number | null;
    floorLabel: string | null;
    contactPhone: string | null;
    isPublished: number;
  }
): Promise<boolean> {
  const r = await db
    .prepare(
      `UPDATE wayfinder_spots SET
         slug = ?, title = ?, summary = ?, guide_text = ?,
         latitude = ?, longitude = ?, floor_label = ?, contact_phone = ?, is_published = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      fields.slug,
      fields.title,
      fields.summary,
      fields.guideText,
      fields.lat,
      fields.lon,
      fields.floorLabel,
      fields.contactPhone,
      fields.isPublished,
      spotId
    )
    .run();
  return (r.meta?.changes ?? 0) > 0;
}

export async function setWayfinderSpotPublished(db: D1Database, spotId: string, isPublished: number): Promise<boolean> {
  const r = await db
    .prepare(`UPDATE wayfinder_spots SET is_published = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(isPublished, spotId)
    .run();
  return (r.meta?.changes ?? 0) > 0;
}

export async function getWayfinderSlugAvailability(
  db: D1Database,
  slug: string
): Promise<WayfinderSlugAvailability> {
  const row = await db
    .prepare("SELECT is_published FROM wayfinder_spots WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<{ is_published: number }>();
  if (!row) return "missing";
  return Number(row.is_published) === 1 ? "published" : "draft";
}

export async function getPublishedWayfinderSpotBySlug(
  db: D1Database,
  slug: string
): Promise<WayfinderSpotRow | null> {
  return await db
    .prepare(
      `SELECT ${WF_SPOT_SELECT}
       FROM wayfinder_spots WHERE slug = ? AND is_published = 1`
    )
    .bind(slug)
    .first<WayfinderSpotRow>();
}

export async function deleteWayfinderSpotById(
  db: D1Database,
  id: string,
  ownerId: string
): Promise<boolean> {
  const r = await db
    .prepare("DELETE FROM wayfinder_spots WHERE id = ? AND owner_id = ?")
    .bind(id, ownerId)
    .run();
  return (r.meta?.changes ?? 0) > 0;
}
