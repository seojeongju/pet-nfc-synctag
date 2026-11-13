/**
 * 통합 관리자(플랫폼 관리자 전용) 집계. 서비스별 KPI를 한 번에 모은다.
 * `tag_designs`는 마이그레이션 0042 적용 전일 수 있어 실패 시 null로 돌려준다.
 */
import type { TagDesignStatus } from "@/lib/platform/tag-design";

export type PlatformOverview = {
  users: number;
  tags: { total: number; active: number; unsold: number };
  linkuSubjects: number;
  shop: { pendingOrders: number; totalOrders: number };
  /** null = tag_designs 테이블 없음(0042 미적용) */
  studio: Record<TagDesignStatus, number> | null;
};

async function countOrZero(db: D1Database, sql: string): Promise<number> {
  try {
    const row = await db.prepare(sql).first<{ n: number }>();
    return Number(row?.n ?? 0);
  } catch {
    return 0;
  }
}

export async function getPlatformOverview(db: D1Database): Promise<PlatformOverview> {
  const [users, total, active, unsold, subjects, pendingOrders, totalOrders, studio] = await Promise.all([
    countOrZero(db, "SELECT count(*) AS n FROM user"),
    countOrZero(db, "SELECT count(*) AS n FROM tags"),
    countOrZero(db, "SELECT count(*) AS n FROM tags WHERE status = 'active'"),
    countOrZero(db, "SELECT count(*) AS n FROM tags WHERE status = 'unsold'"),
    countOrZero(db, "SELECT count(*) AS n FROM pets"),
    countOrZero(db, "SELECT count(*) AS n FROM shop_orders WHERE status = 'pending'"),
    countOrZero(db, "SELECT count(*) AS n FROM shop_orders"),
    getStudioStatusCounts(db),
  ]);
  return {
    users,
    tags: { total, active, unsold },
    linkuSubjects: subjects,
    shop: { pendingOrders, totalOrders },
    studio,
  };
}

export async function getStudioStatusCounts(db: D1Database): Promise<Record<TagDesignStatus, number> | null> {
  try {
    const { results } = await db
      .prepare("SELECT status, count(*) AS n FROM tag_designs GROUP BY status")
      .all<{ status: string; n: number }>();
    const counts: Record<TagDesignStatus, number> = { draft: 0, ready: 0, requested: 0, locked: 0 };
    for (const r of results ?? []) {
      if (r.status in counts) counts[r.status as TagDesignStatus] = Number(r.n);
    }
    return counts;
  } catch {
    return null;
  }
}

export type AdminTagDesignRow = {
  id: string;
  title: string;
  service_id: string;
  form_factor_id: string;
  status: TagDesignStatus;
  design_json: string;
  updated_at: string;
  user_email: string | null;
  user_name: string | null;
};

export async function listTagDesignsForAdmin(
  db: D1Database,
  opts: { status?: TagDesignStatus | null; limit: number; offset: number }
): Promise<{ rows: AdminTagDesignRow[]; total: number } | null> {
  try {
    const where = opts.status ? "WHERE d.status = ?" : "";
    const binds = opts.status ? [opts.status] : [];
    const [{ results }, totalRow] = await Promise.all([
      db
        .prepare(
          `SELECT d.id, d.title, d.service_id, d.form_factor_id, d.status, d.design_json, d.updated_at,
                  u.email AS user_email, u.name AS user_name
           FROM tag_designs d LEFT JOIN user u ON u.id = d.user_id
           ${where}
           ORDER BY d.updated_at DESC LIMIT ? OFFSET ?`
        )
        .bind(...binds, opts.limit, opts.offset)
        .all<AdminTagDesignRow>(),
      db
        .prepare(`SELECT count(*) AS n FROM tag_designs d ${where}`)
        .bind(...binds)
        .first<{ n: number }>(),
    ]);
    return { rows: results ?? [], total: Number(totalRow?.n ?? 0) };
  } catch {
    return null;
  }
}
