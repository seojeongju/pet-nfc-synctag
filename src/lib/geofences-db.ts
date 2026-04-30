import type { D1Database } from "@cloudflare/workers-types";

export type GeofenceRow = {
  id: string;
  owner_id: string;
  pet_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type GeofenceWithPetName = GeofenceRow & { pet_name: string };

export async function listGeofencesForOwnerKind(
  db: D1Database,
  ownerId: string,
  subjectKind: string,
  tenantId?: string
): Promise<GeofenceWithPetName[]> {
  const tenant = (tenantId ?? "").trim();
  const query = tenant
    ? `SELECT g.id, g.owner_id, g.pet_id, g.name, g.latitude, g.longitude, g.radius_meters,
              g.is_active, g.created_at, g.updated_at, p.name AS pet_name
       FROM geofences g
       INNER JOIN pets p ON p.id = g.pet_id
       WHERE g.owner_id = ?
         AND p.tenant_id = ?
         AND p.subject_kind = ?
       ORDER BY datetime(g.updated_at) DESC`
    : `SELECT g.id, g.owner_id, g.pet_id, g.name, g.latitude, g.longitude, g.radius_meters,
              g.is_active, g.created_at, g.updated_at, p.name AS pet_name
       FROM geofences g
       INNER JOIN pets p ON p.id = g.pet_id
       WHERE g.owner_id = ?
         AND p.tenant_id IS NULL
         AND p.subject_kind = ?
       ORDER BY datetime(g.updated_at) DESC`;
  const stmt = db.prepare(query);
  const { results } = await (tenant
    ? stmt.bind(ownerId, tenant, subjectKind)
    : stmt.bind(ownerId, subjectKind)
  ).all<GeofenceWithPetName>();
  return results ?? [];
}

export async function getGeofenceById(
  db: D1Database,
  id: string,
  ownerId: string
): Promise<GeofenceRow | null> {
  return await db
    .prepare(
      "SELECT id, owner_id, pet_id, name, latitude, longitude, radius_meters, is_active, created_at, updated_at FROM geofences WHERE id = ? AND owner_id = ?"
    )
    .bind(id, ownerId)
    .first<GeofenceRow>();
}

export async function listGeofencesForPet(
  db: D1Database,
  petId: string,
  userId: string
): Promise<GeofenceRow[]> {
  const { results } = await db
    .prepare(
      `SELECT g.id, g.owner_id, g.pet_id, g.name, g.latitude, g.longitude, g.radius_meters,
              g.is_active, g.created_at, g.updated_at
       FROM geofences g
       INNER JOIN pets p ON p.id = g.pet_id
       WHERE g.pet_id = ?
         AND (
           p.owner_id = ?
           OR (
             p.tenant_id IS NOT NULL
             AND EXISTS (
               SELECT 1 FROM tenant_members tm
               WHERE tm.tenant_id = p.tenant_id AND tm.user_id = ?
             )
           )
         )
       ORDER BY datetime(g.created_at) ASC`
    )
    .bind(petId, userId, userId)
    .all<GeofenceRow>();
  return results ?? [];
}

export async function deleteGeofenceById(
  db: D1Database,
  id: string,
  ownerId: string
): Promise<boolean> {
  const r = await db
    .prepare("DELETE FROM geofences WHERE id = ? AND owner_id = ?")
    .bind(id, ownerId)
    .run();
  return (r.meta?.changes ?? 0) > 0;
}
