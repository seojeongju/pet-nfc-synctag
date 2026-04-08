import type { D1Database } from "@cloudflare/workers-types";

export type BleLocationEventRow = {
  id: string;
  pet_id: string;
  event_type: string;
  latitude: number | null;
  longitude: number | null;
  rssi: number | null;
  raw_payload: string | null;
  created_at: string;
  pet_name: string;
  pet_photo: string | null;
};

export async function isPetOwnedBy(
  db: D1Database,
  petId: string,
  ownerId: string
): Promise<boolean> {
  const row = await db
    .prepare("SELECT owner_id FROM pets WHERE id = ?")
    .bind(petId)
    .first<{ owner_id: string }>();
  return row?.owner_id === ownerId;
}

export async function insertBleLocationEvent(
  db: D1Database,
  row: {
    id: string;
    owner_id: string;
    pet_id: string;
    event_type: string;
    latitude: number | null;
    longitude: number | null;
    rssi: number | null;
    raw_payload: string | null;
  }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ble_location_events (id, owner_id, pet_id, event_type, latitude, longitude, rssi, raw_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      row.id,
      row.owner_id,
      row.pet_id,
      row.event_type,
      row.latitude,
      row.longitude,
      row.rssi,
      row.raw_payload
    )
    .run();
}

export async function listBleLocationEventsForOwner(
  db: D1Database,
  ownerId: string,
  subjectKind: string,
  limit: number,
  tenantId?: string
): Promise<BleLocationEventRow[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const tenant = (tenantId ?? "").trim();
  const query = tenant
    ? `SELECT e.id, e.pet_id, e.event_type, e.latitude, e.longitude, e.rssi, e.raw_payload, e.created_at,
              p.name AS pet_name, p.photo_url AS pet_photo
       FROM ble_location_events e
       INNER JOIN pets p ON p.id = e.pet_id
       WHERE e.owner_id = ?
         AND p.tenant_id = ?
         AND COALESCE(p.subject_kind, 'pet') = ?
       ORDER BY datetime(e.created_at) DESC
       LIMIT ?`
    : `SELECT e.id, e.pet_id, e.event_type, e.latitude, e.longitude, e.rssi, e.raw_payload, e.created_at,
              p.name AS pet_name, p.photo_url AS pet_photo
       FROM ble_location_events e
       INNER JOIN pets p ON p.id = e.pet_id
       WHERE e.owner_id = ?
         AND p.tenant_id IS NULL
         AND COALESCE(p.subject_kind, 'pet') = ?
       ORDER BY datetime(e.created_at) DESC
       LIMIT ?`;
  const stmt = db.prepare(query);
  const { results } = await (tenant
    ? stmt.bind(ownerId, tenant, subjectKind, safeLimit)
    : stmt.bind(ownerId, subjectKind, safeLimit)
  ).all<BleLocationEventRow>();
  return results ?? [];
}
