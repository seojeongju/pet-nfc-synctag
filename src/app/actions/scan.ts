"use server";
import { getDB } from "@/lib/db";

export async function updateScanLocation(tagId: string, lat: number, lng: number) {
  const db = getDB();
  
  // Update the most recent scan for this tag
  // In a real app, we might pass a specific scan ID
  await db
    .prepare(
      `UPDATE scan_logs 
       SET latitude = ?, longitude = ? 
       WHERE id = (SELECT id FROM scan_logs WHERE tag_id = ? ORDER BY scanned_at DESC LIMIT 1)`
    )
    .bind(lat, lng, tagId)
    .run();
    
  return { success: true };
}

export async function getScanLogs(ownerId: string) {
  const db = getDB();
  const { results } = await db.prepare(`
    SELECT 
      sl.*, 
      p.name as pet_name, 
      p.photo_url as pet_photo,
      t.id as tag_id
    FROM scan_logs sl
    JOIN tags t ON sl.tag_id = t.id
    JOIN pets p ON t.pet_id = p.id
    WHERE p.owner_id = ?
    ORDER BY sl.scanned_at DESC
    LIMIT 50
  `)
  .bind(ownerId)
  .all();
  
  return results;
}
