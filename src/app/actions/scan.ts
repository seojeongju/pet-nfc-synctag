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
