"use server";
import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { parseSubjectKind, SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";
import { normalizeBleMac } from "@/lib/device-mode";
import { isPlatformAdminRole } from "@/lib/platform-admin";

function normalizeUid(uid: string): string {
    return uid.trim().toUpperCase();
}

function isValidUidFormat(uid: string): boolean {
    const hexWithColon = /^([0-9A-F]{2}:){3,15}[0-9A-F]{2}$/;
    const alnum = /^[A-Z0-9_-]{8,32}$/;
    return hexWithColon.test(uid) || alnum.test(uid);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

async function getActorEmailSafe() {
    try {
        const context = getCfRequestContext();
        const auth = getAuth(context.env);
        const session = await auth.api.getSession({ headers: await headers() });
        return session?.user?.email ?? "system";
    } catch {
        return "system";
    }
}

export type RegisterBulkTagsOptions = {
    batchId?: string;
    /** 등록 시점에 태그에 부여할 할당 모드 (허브 자동 진입 등에 사용) */
    assignedSubjectKind?: SubjectKind | null;
};

/**
 * NFC 태그를 시스템에 대량으로 미리 등록합니다 (관리자 전용)
 */
export async function registerBulkTags(uids: string[], options?: RegisterBulkTagsOptions) {
    const db = getDB();
    const kind = options?.assignedSubjectKind ?? null;
    const kindSlug =
        kind && (SUBJECT_KINDS as readonly string[]).includes(kind) ? kind : "generic";
    const currentBatch = options?.batchId || `BATCH-${kindSlug}-${Date.now()}`;
    const normalized = uids.map(normalizeUid).filter((uid) => uid.length > 0);
    const uniqueNormalized = Array.from(new Set(normalized));
    const validUids = uniqueNormalized.filter(isValidUidFormat);
    const invalidCount = uniqueNormalized.length - validUids.length;
    const duplicateInRequest = normalized.length - uniqueNormalized.length;
    let duplicateExisting = 0;

    try {
        const chunks = chunkArray(validUids, 200);
        for (const chunk of chunks) {
            if (chunk.length === 0) continue;
            const placeholders = chunk.map(() => "?").join(",");
            const { results } = await db
                .prepare(`SELECT id FROM tags WHERE id IN (${placeholders})`)
                .bind(...chunk)
                .all<{ id: string }>();
            duplicateExisting += results.length;
        }

        const existingSet = new Set<string>();
        for (const chunk of chunks) {
            if (chunk.length === 0) continue;
            const placeholders = chunk.map(() => "?").join(",");
            const { results } = await db
                .prepare(`SELECT id FROM tags WHERE id IN (${placeholders})`)
                .bind(...chunk)
                .all<{ id: string }>();
            for (const row of results) existingSet.add(row.id);
        }
        const toInsert = validUids.filter((uid) => !existingSet.has(uid));
        
        // 중복 제거 및 트랜잭션 처리 (D1 배치는 순차 처리 권장)
        const queries = toInsert.map((uid) =>
            db
                .prepare(
                    "INSERT OR IGNORE INTO tags (id, status, batch_id, assigned_subject_kind) VALUES (?, 'unsold', ?, ?)"
                )
                .bind(uid, currentBatch, kind)
        );
        if (queries.length > 0) {
            await db.batch(queries);
        }

        const result = {
            success: true,
            batchId: currentBatch,
            assignedSubjectKind: kind,
            requestedCount: normalized.length,
            registeredCount: toInsert.length,
            invalidCount,
            duplicateInRequest,
            duplicateExisting,
            failedCount: invalidCount + duplicateInRequest + duplicateExisting,
        };

        await db.prepare(`
            CREATE TABLE IF NOT EXISTS admin_action_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                actor_email TEXT,
                success BOOLEAN NOT NULL DEFAULT 1,
                payload TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
        await db.prepare(
            "INSERT INTO admin_action_logs (action, actor_email, success, payload) VALUES (?, ?, 1, ?)"
        ).bind("bulk_register", await getActorEmailSafe(), JSON.stringify(result)).run();
        
        revalidatePath("/admin/tags");
        return result;
    } catch (error) {
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS admin_action_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                actor_email TEXT,
                success BOOLEAN NOT NULL DEFAULT 1,
                payload TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
        await db.prepare(
            "INSERT INTO admin_action_logs (action, actor_email, success, payload) VALUES (?, ?, 0, ?)"
        ).bind("bulk_register", await getActorEmailSafe(), JSON.stringify({ error: error instanceof Error ? error.message : String(error) })).run();
        throw error;
    }
}

/**
 * 시스템의 모든 태그 현황을 조회합니다
 */
export async function getAllTags() {
    const db = getDB();
    const { results } = await db.prepare(`
        SELECT t.*, p.name as pet_name, u.email as owner_email
        FROM tags t
        LEFT JOIN pets p ON t.pet_id = p.id
        LEFT JOIN user u ON p.owner_id = u.id
        ORDER BY t.created_at DESC
    `).all();
    
    return results;
}

/**
 * 관리자 대시보드용 통계 데이터를 가져옵니다
 */
export async function getAdminStats() {
    const db = getDB();
    type CountRow = Record<string, number>;
    type BatchResult = { results: CountRow[] };
    
    const stats = await db.batch([
        db.prepare("SELECT count(*) as total FROM tags"),
        db.prepare("SELECT count(*) as active FROM tags WHERE status = 'active'"),
        db.prepare("SELECT count(*) as unsold FROM tags WHERE status = 'unsold'"),
        db.prepare("SELECT count(*) as total_users FROM user")
    ]) as BatchResult[];
    
    return {
        totalTags: stats[0].results[0].total,
        activeTags: stats[1].results[0].active,
        unsoldTags: stats[2].results[0].unsold,
        totalUsers: stats[3].results[0].total_users
    };
}

/** 관리 대상(pets) subject_kind별 건수 — COALESCE(subject_kind,'pet') 기준 */
export async function getPetsSubjectKindCounts() {
    const db = getDB();
    const { results } = await db
        .prepare(
            `SELECT COALESCE(subject_kind, 'pet') AS k, COUNT(*) AS c FROM pets GROUP BY k`
        )
        .all<{ k: string; c: number }>()
        .catch(() => ({ results: [] as { k: string; c: number }[] }));

    const counts = Object.fromEntries(SUBJECT_KINDS.map((k) => [k, 0])) as Record<SubjectKind, number>;
    const kinds = SUBJECT_KINDS as readonly string[];
    for (const row of results) {
        const raw = row.k ?? "pet";
        if (kinds.includes(raw)) counts[raw as SubjectKind] = row.c;
    }
    return counts;
}

export async function getTagOpsStats() {
    const db = getDB();
    const total = await db.prepare("SELECT COUNT(*) AS value FROM tags").first<{ value: number }>();
    const active = await db.prepare("SELECT COUNT(*) AS value FROM tags WHERE status = 'active'").first<{ value: number }>();
    const unsold = await db.prepare("SELECT COUNT(*) AS value FROM tags WHERE status = 'unsold'").first<{ value: number }>();
    const recentLinks = await db
        .prepare("SELECT COUNT(*) AS value FROM tag_link_logs WHERE action='link' AND created_at >= datetime('now', '-7 days')")
        .first<{ value: number }>()
        .catch(() => ({ value: 0 }));
    const failedRegistrations7d = await db
        .prepare("SELECT COALESCE(SUM(CAST(json_extract(payload, '$.failedCount') AS INTEGER)), 0) AS value FROM admin_action_logs WHERE action='bulk_register' AND created_at >= datetime('now', '-7 days')")
        .first<{ value: number }>()
        .catch(() => ({ value: 0 }));

    const batchRows = await db.prepare(`
        SELECT 
            batch_id,
            COUNT(*) AS total_count,
            SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active_count,
            SUM(CASE WHEN status='unsold' THEN 1 ELSE 0 END) AS unsold_count,
            MAX(created_at) AS latest_created_at
        FROM tags
        WHERE batch_id IS NOT NULL
        GROUP BY batch_id
        ORDER BY latest_created_at DESC
        LIMIT 8
    `).all<{
        batch_id: string;
        total_count: number;
        active_count: number;
        unsold_count: number;
        latest_created_at: string;
    }>();

    const totalCount = total?.value ?? 0;
    const activeCount = active?.value ?? 0;
    const unsoldCount = unsold?.value ?? 0;
    const activationRate = totalCount > 0 ? Number(((activeCount / totalCount) * 100).toFixed(1)) : 0;

    return {
        totalCount,
        activeCount,
        unsoldCount,
        activationRate,
        recentLinks: recentLinks?.value ?? 0,
        failedRegistrations7d: failedRegistrations7d?.value ?? 0,
        batches: batchRows.results,
    };
}

export async function getTagLinkLogs(limit = 30) {
    const db = getDB();
    const safeLimit = Math.max(1, Math.min(limit, 200));

    const logs = await db.prepare(`
        SELECT
            l.id,
            l.tag_id,
            l.pet_id,
            l.action,
            l.created_at,
            p.name AS pet_name,
            u.email AS owner_email
        FROM tag_link_logs l
        LEFT JOIN pets p ON l.pet_id = p.id
        LEFT JOIN user u ON p.owner_id = u.id
        ORDER BY l.created_at DESC
        LIMIT ?
    `)
    .bind(safeLimit)
    .all<{
        id: number;
        tag_id: string;
        pet_id: string;
        action: "link" | "unlink";
        created_at: string;
        pet_name?: string | null;
        owner_email?: string | null;
    }>()
    .catch(() => ({ results: [] as Array<{
        id: number;
        tag_id: string;
        pet_id: string;
        action: "link" | "unlink";
        created_at: string;
        pet_name?: string | null;
        owner_email?: string | null;
    }> }));

    return logs.results;
}

export async function getAdminAuditLogs(params?: {
    limit?: number;
    page?: number;
    success?: "all" | "success" | "failed";
    days?: number;
    actorEmail?: string;
    action?: string;
    sortBy?: "created_at" | "action" | "success";
    sortOrder?: "asc" | "desc";
}) {
    const db = getDB();
    const safeLimit = Math.max(1, Math.min(params?.limit ?? 30, 200));
    const page = Math.max(1, params?.page ?? 1);
    const offset = (page - 1) * safeLimit;
    const successFilter = params?.success ?? "all";
    const days = Math.max(1, Math.min(params?.days ?? 30, 365));
    const actorEmail = (params?.actorEmail ?? "").trim();
    const action = (params?.action ?? "").trim();
    const sortBy = params?.sortBy ?? "created_at";
    const sortOrder = params?.sortOrder === "asc" ? "ASC" : "DESC";

    const whereParts: string[] = ["created_at >= datetime('now', ?)"];
    const bindValues: Array<string | number> = [`-${days} days`];
    if (successFilter === "success") whereParts.push("success = 1");
    if (successFilter === "failed") whereParts.push("success = 0");
    if (actorEmail) {
        whereParts.push("actor_email = ?");
        bindValues.push(actorEmail);
    }
    if (action) {
        whereParts.push("action = ?");
        bindValues.push(action);
    }
    const whereClause = whereParts.join(" AND ");

    const countResult = await db.prepare(`
        SELECT COUNT(*) AS total
        FROM admin_action_logs
        WHERE ${whereClause}
    `)
    .bind(...bindValues)
    .first<{ total: number }>()
    .catch(() => ({ total: 0 }));

    const rowsBindValues = [...bindValues, safeLimit, offset];

    const rows = await db.prepare(`
        SELECT id, action, actor_email, success, payload, created_at
        FROM admin_action_logs
        WHERE ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}, id DESC
        LIMIT ? OFFSET ?
    `)
    .bind(...rowsBindValues)
    .all<{
        id: number;
        action: string;
        actor_email?: string | null;
        success: number;
        payload?: string | null;
        created_at: string;
    }>()
    .catch(() => ({ results: [] as Array<{
        id: number;
        action: string;
        actor_email?: string | null;
        success: number;
        payload?: string | null;
        created_at: string;
    }> }));
    return {
        rows: rows.results,
        total: countResult?.total ?? 0,
        page,
        pageSize: safeLimit,
    };
}

export async function getAdminFailureTopActions(days = 7, limit = 5) {
    const db = getDB();
    const safeDays = Math.max(1, Math.min(days, 365));
    const safeLimit = Math.max(1, Math.min(limit, 20));
    const result = await db.prepare(`
        SELECT action, COUNT(*) AS failure_count
        FROM admin_action_logs
        WHERE success = 0 AND created_at >= datetime('now', ?)
        GROUP BY action
        ORDER BY failure_count DESC
        LIMIT ?
    `)
    .bind(`-${safeDays} days`, safeLimit)
    .all<{ action: string; failure_count: number }>()
    .catch(() => ({ results: [] as Array<{ action: string; failure_count: number }> }));
    return result.results;
}

async function assertAdminRole() {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("인증이 필요합니다.");
    const row = await getDB()
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(session.user.id)
        .first<{ role?: string | null }>();
    if (!isPlatformAdminRole(row?.role)) throw new Error("플랫폼 관리자만 수정할 수 있습니다.");
}

/**
 * 제품명·할당 모드(링크유 - 펫/메모리/키즈/캐리)·BLE MAC 관리 (출고 전·운영 중)
 */
export async function updateTagProductProfile(
    tagId: string,
    payload: {
        product_name: string | null;
        assigned_subject_kind: string | null;
        ble_mac: string | null;
    }
) {
    await assertAdminRole();
    const db = getDB();
    const id = normalizeUid(tagId);
    const productName = payload.product_name?.trim() || null;
    const modeRaw = payload.assigned_subject_kind;
    const mode: string | null =
        !modeRaw || !String(modeRaw).trim()
            ? null
            : parseSubjectKind(String(modeRaw));
    const mac = payload.ble_mac?.trim() ? normalizeBleMac(payload.ble_mac) : null;

    await db
        .prepare(
            `UPDATE tags SET product_name = ?, assigned_subject_kind = ?, ble_mac = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        )
        .bind(productName, mode, mac, id)
        .run()
        .catch((e: Error) => {
            throw new Error(
                e.message?.includes("no such column")
                    ? "DB 마이그레이션(product_name, assigned_subject_kind)을 적용해 주세요."
                    : e.message
            );
        });

    revalidatePath("/admin/tags");
    revalidatePath("/admin/monitoring");
}
