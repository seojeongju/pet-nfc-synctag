import type { D1Database } from "@cloudflare/workers-types";

async function resolvePasswordChangeFlagColumn(db: D1Database): Promise<string | null> {
  const { results } = await db
    .prepare("PRAGMA table_info(user)")
    .all<{ name?: string }>()
    .catch(() => ({ results: [] as { name?: string }[] }));
  const colSet = new Set((results ?? []).map((r) => (r.name ?? "").trim()).filter(Boolean));
  if (colSet.has("must_change_password")) return "must_change_password";
  if (colSet.has("mustChangePassword")) return "mustChangePassword";
  return null;
}

export async function isPasswordChangeRequired(db: D1Database, userId: string): Promise<boolean> {
  const col = await resolvePasswordChangeFlagColumn(db);
  if (!col) return false;
  const row = await db
    .prepare(`SELECT ${col} AS required FROM user WHERE id = ? LIMIT 1`)
    .bind(userId)
    .first<{ required?: number | boolean | null }>()
    .catch(() => null);
  return Number(row?.required ?? 0) === 1;
}

export async function setPasswordChangeRequired(
  db: D1Database,
  userId: string,
  required: boolean
): Promise<void> {
  const col = await resolvePasswordChangeFlagColumn(db);
  if (!col) return;
  await db
    .prepare(`UPDATE user SET ${col} = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(required ? 1 : 0, userId)
    .run();
}
