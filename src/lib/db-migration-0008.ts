import type { D1Database } from "@cloudflare/workers-types";

type Migration0008Status = {
  ok: boolean;
  missingTables: string[];
  missingColumns: Array<{ table: string; column: string }>;
  plansSeeded: boolean;
};

const REQUIRED_TABLES = ["tenants", "tenant_members", "plans", "subscriptions"] as const;
const REQUIRED_COLUMNS: Array<{ table: string; column: string }> = [
  { table: "pets", column: "tenant_id" },
  { table: "tags", column: "tenant_id" },
];

async function tableExists(db: D1Database, name: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .bind(name)
    .first<{ ok: number }>();
  return Boolean(row?.ok);
}

async function columnExists(db: D1Database, table: string, column: string): Promise<boolean> {
  const { results } = await db.prepare(`PRAGMA table_info(${table})`).all<{ name?: string }>();
  return (results ?? []).some((r) => r.name === column);
}

async function hasPlanSeed(db: D1Database): Promise<boolean> {
  const row = await db
    .prepare("SELECT COUNT(*) AS c FROM plans WHERE code IN ('free','starter','business')")
    .first<{ c: number }>()
    .catch(() => ({ c: 0 }));
  return Number(row?.c ?? 0) >= 3;
}

export async function getMigration0008Status(db: D1Database): Promise<Migration0008Status> {
  const missingTables: string[] = [];
  for (const t of REQUIRED_TABLES) {
    if (!(await tableExists(db, t))) {
      missingTables.push(t);
    }
  }

  const missingColumns: Array<{ table: string; column: string }> = [];
  for (const item of REQUIRED_COLUMNS) {
    if (!(await columnExists(db, item.table, item.column))) {
      missingColumns.push(item);
    }
  }

  const plansSeeded = await hasPlanSeed(db);
  const ok = missingTables.length === 0 && missingColumns.length === 0 && plansSeeded;

  return { ok, missingTables, missingColumns, plansSeeded };
}

export async function assertMigration0008Applied(db: D1Database): Promise<void> {
  const status = await getMigration0008Status(db);
  if (status.ok) return;

  const parts: string[] = [];
  if (status.missingTables.length > 0) {
    parts.push(`missing tables: ${status.missingTables.join(", ")}`);
  }
  if (status.missingColumns.length > 0) {
    parts.push(
      `missing columns: ${status.missingColumns
        .map((v) => `${v.table}.${v.column}`)
        .join(", ")}`
    );
  }
  if (!status.plansSeeded) {
    parts.push("plans seed missing (free/starter/business)");
  }

  throw new Error(
    `DB migration 0008 is not fully applied (${parts.join("; ")}). Run: wrangler d1 migrations apply <DB_NAME>.`
  );
}
