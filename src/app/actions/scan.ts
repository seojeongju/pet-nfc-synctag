"use server";
import { getDB } from "@/lib/db";

export async function updateScanLocation(tagId: string, lat: number, lng: number) {
  const db = getDB();
  const tag = await db
    .prepare(
      `SELECT t.id
       FROM tags t
       INNER JOIN pets p ON p.id = t.pet_id
       WHERE t.id = ? AND t.is_active = 1`
    )
    .bind(tagId)
    .first<{ id: string }>();
  if (!tag) {
    return { success: false as const, error: "invalid_tag" };
  }

  const result = await db
    .prepare(
      `UPDATE scan_logs
       SET latitude = ?, longitude = ?
       WHERE id = (SELECT id FROM scan_logs WHERE tag_id = ? ORDER BY scanned_at DESC LIMIT 1)`
    )
    .bind(lat, lng, tagId)
    .run();

  const changes = result.meta?.changes ?? 0;
  if (changes < 1) {
    return { success: false as const, error: "no_scan" };
  }

  return { success: true as const };
}
