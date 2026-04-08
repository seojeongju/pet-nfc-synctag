"use server";
import { getDB } from "@/lib/db";
import type { SubjectKind } from "@/lib/subject-kind";
import { parseSubjectKind } from "@/lib/subject-kind";

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

export async function getScanLogs(
  ownerId: string,
  subjectKind: SubjectKind = "pet",
  tenantId?: string
) {
  const db = getDB();
  const kind = parseSubjectKind(subjectKind);
  const tenant = (tenantId ?? "").trim();
  const query = tenant
    ? `
    SELECT 
      sl.*, 
      p.name as pet_name, 
      p.photo_url as pet_photo,
      t.id as tag_id
    FROM scan_logs sl
    JOIN tags t ON sl.tag_id = t.id
    JOIN pets p ON t.pet_id = p.id
    WHERE p.owner_id = ?
      AND p.tenant_id = ?
      AND COALESCE(p.subject_kind, 'pet') = ?
    ORDER BY sl.scanned_at DESC
    LIMIT 50
  `
    : `
    SELECT 
      sl.*, 
      p.name as pet_name, 
      p.photo_url as pet_photo,
      t.id as tag_id
    FROM scan_logs sl
    JOIN tags t ON sl.tag_id = t.id
    JOIN pets p ON t.pet_id = p.id
    WHERE p.owner_id = ?
      AND p.tenant_id IS NULL
      AND COALESCE(p.subject_kind, 'pet') = ?
    ORDER BY sl.scanned_at DESC
    LIMIT 50
  `;
  const stmt = db.prepare(query);
  const { results } = await (tenant
    ? stmt.bind(ownerId, tenant, kind)
    : stmt.bind(ownerId, kind)
  ).all();

  return results;
}
