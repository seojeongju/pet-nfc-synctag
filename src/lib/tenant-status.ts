import type { D1Database } from "@cloudflare/workers-types";

export async function getTenantStatus(
  db: D1Database,
  tenantId: string
): Promise<"active" | "suspended" | null> {
  const id = String(tenantId ?? "").trim();
  if (!id) return null;

  const row = await db
    .prepare("SELECT status FROM tenants WHERE id = ?")
    .bind(id)
    .first<{ status?: string | null }>();

  if (!row?.status) return null;
  return row.status === "suspended" ? "suspended" : "active";
}

/** D1 일시 오류 시에도 페이지 전체가 error.tsx로 가지 않도록 */
export async function isTenantSuspendedSafe(
  db: D1Database,
  tenantId: string | null | undefined
): Promise<boolean> {
  const id = typeof tenantId === "string" ? tenantId.trim() : "";
  if (!id) return false;
  try {
    return (await getTenantStatus(db, id)) === "suspended";
  } catch (e) {
    console.error("[isTenantSuspendedSafe]", e);
    return false;
  }
}

export async function assertTenantActive(db: D1Database, tenantId: string): Promise<void> {
  const status = await getTenantStatus(db, tenantId);
  if (!status) {
    throw new Error("유효하지 않은 조직입니다.");
  }
  if (status !== "active") {
    throw new Error("중지(suspended)된 조직에서는 변경 작업을 수행할 수 없습니다.");
  }
}
