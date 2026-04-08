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
  subjectKind: string
): Promise<GeofenceWithPetName[]> {
  const { results } = await db
    .prepare(
      `SELECT g.id, g.owner_id, g.pet_id, g.name, g.latitude, g.longitude, g.radius_meters,
              g.is_active, g.created_at, g.updated_at, p.name AS pet_name
       FROM geofences g
       INNER JOIN pets p ON p.id = g.pet_id
       WHERE g.owner_id = ? AND COALESCE(p.subject_kind, 'pet') = ?
       ORDER BY datetime(g.updated_at) DESC`
    )
    .bind(ownerId, subjectKind)
    .all<GeofenceWithPetName>();
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
  ownerId: string
): Promise<GeofenceRow[]> {
  const { results } = await db
    .prepare(
      `SELECT id, owner_id, pet_id, name, latitude, longitude, radius_meters, is_active, created_at, updated_at
       FROM geofences WHERE pet_id = ? AND owner_id = ? ORDER BY datetime(created_at) ASC`
    )
    .bind(petId, ownerId)
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
