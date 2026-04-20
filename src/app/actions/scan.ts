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

type FinderAction =
  | "call_click"
  | "sms_click"
  | "location_share_click"
  | "location_share_success"
  | "location_share_error";

export async function logFinderAction(input: {
  action: FinderAction;
  tagId?: string | null;
  petId?: string | null;
  detail?: string | null;
  userAgent?: string | null;
}) {
  const db = getDB();
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS finder_action_logs (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "action TEXT NOT NULL, " +
      "tag_id TEXT, " +
      "pet_id TEXT, " +
      "detail TEXT, " +
      "user_agent TEXT, " +
      "created_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
      ")"
  ).run();

  await db
    .prepare(
      "INSERT INTO finder_action_logs (action, tag_id, pet_id, detail, user_agent) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(
      input.action,
      input.tagId ?? null,
      input.petId ?? null,
      input.detail ?? null,
      input.userAgent ?? null
    )
    .run();

  return { ok: true as const };
}
