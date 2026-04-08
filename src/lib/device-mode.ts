import type { D1Database } from "@cloudflare/workers-types";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";

/** BLE MAC: AA:BB:CC:DD:EE:FF */
export function normalizeBleMac(input: string): string {
  return input.trim().toUpperCase().replace(/-/g, ":").replace(/\s+/g, "");
}

export type TagDeviceRow = {
  id: string;
  product_name: string | null;
  assigned_subject_kind: string | null;
  ble_mac: string | null;
  status: string | null;
  pet_id: string | null;
};

async function selectTagById(db: D1Database, id: string): Promise<TagDeviceRow | null> {
  try {
    return await db
      .prepare(
        `SELECT id, product_name, assigned_subject_kind, ble_mac, status, pet_id
         FROM tags WHERE id = ?`
      )
      .bind(id)
      .first<TagDeviceRow>();
  } catch {
    const row = await db
      .prepare(`SELECT id, ble_mac, status, pet_id FROM tags WHERE id = ?`)
      .bind(id)
      .first<{ id: string; ble_mac: string | null; status: string | null; pet_id: string | null }>();
    if (!row) return null;
    return {
      ...row,
      product_name: null,
      assigned_subject_kind: null,
    };
  }
}

async function selectTagByBle(db: D1Database, mac: string): Promise<TagDeviceRow | null> {
  try {
    return await db
      .prepare(
        `SELECT id, product_name, assigned_subject_kind, ble_mac, status, pet_id
         FROM tags WHERE ble_mac IS NOT NULL AND ble_mac = ?`
      )
      .bind(mac)
      .first<TagDeviceRow>();
  } catch {
    const row = await db
      .prepare(
        `SELECT id, ble_mac, status, pet_id FROM tags WHERE ble_mac IS NOT NULL AND ble_mac = ?`
      )
      .bind(mac)
      .first<{ id: string; ble_mac: string | null; status: string | null; pet_id: string | null }>();
    if (!row) return null;
    return {
      ...row,
      product_name: null,
      assigned_subject_kind: null,
    };
  }
}

/**
 * NFC UID 또는 BLE MAC으로 태그 행 조회 (UID 우선, 이후 ble_mac).
 */
export async function findTagByDeviceHint(
  db: D1Database,
  raw: string
): Promise<TagDeviceRow | null> {
  const id = raw.trim().toUpperCase();
  if (!id) return null;

  const byId = await selectTagById(db, id);
  if (byId) return byId;

  const mac = normalizeBleMac(raw);
  if (mac.length < 11) return null;

  return await selectTagByBle(db, mac);
}

/** 관리자가 지정한 모드만 반환. 미지정이면 null → 허브에서 모드 선택 유지 */
export async function resolveDeviceAssignedKind(
  db: D1Database,
  raw: string
): Promise<SubjectKind | null> {
  const row = await findTagByDeviceHint(db, raw);
  if (!row?.assigned_subject_kind) return null;
  return parseSubjectKind(row.assigned_subject_kind);
}
