import type { D1Database } from "@cloudflare/workers-types";

const METRO_OFFSET_KEY = "metro_sync_offset";

export async function getWayfinderSyncMeta(db: D1Database, key: string): Promise<string | null> {
  try {
    const row = await db
      .prepare(`SELECT value FROM wayfinder_sync_meta WHERE key = ?`)
      .bind(key)
      .first<{ value: string }>();
    return row?.value?.trim() || null;
  } catch {
    return null;
  }
}

export async function setWayfinderSyncMeta(db: D1Database, key: string, value: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO wayfinder_sync_meta (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .bind(key, value, now)
    .run();
}

export async function getMetroSyncOffset(db: D1Database): Promise<number> {
  const raw = await getWayfinderSyncMeta(db, METRO_OFFSET_KEY);
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export async function setMetroSyncOffset(db: D1Database, offset: number): Promise<void> {
  await setWayfinderSyncMeta(db, METRO_OFFSET_KEY, String(Math.max(0, Math.floor(offset))));
}

export async function resetMetroSyncOffset(db: D1Database): Promise<void> {
  await setMetroSyncOffset(db, 0);
}
