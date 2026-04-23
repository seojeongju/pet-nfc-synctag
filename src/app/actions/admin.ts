"use server";
import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { parseSubjectKind, SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";
import { normalizeBleMac } from "@/lib/device-mode";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { isValidTagUidFormat, normalizeTagUid } from "@/lib/tag-uid-format";
import { mintNativeHandoffToken } from "@/lib/nfc-native-security";
import type {
    AdminTag,
    TagsInventoryPageParams,
    TagsInventoryPageResult,
    TagsInventoryStatusFilter,
} from "@/types/admin-tags";

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
    const normalized = uids.map(normalizeTagUid).filter((uid) => uid.length > 0);
    const uniqueNormalized = Array.from(new Set(normalized));
    const validUids = uniqueNormalized.filter(isValidTagUidFormat);
    const invalidCount = uniqueNormalized.length - validUids.length;
    const duplicateInRequest = normalized.length - uniqueNormalized.length;
    let duplicateExisting = 0;

    try {
        type TableInfoRow = { name?: string | null };
        const tableInfo = await db
            .prepare("PRAGMA table_info(tags)")
            .all<TableInfoRow>()
            .catch(() => ({ results: [] as TableInfoRow[] }));
        const tagColumns = new Set(
            (tableInfo.results ?? [])
                .map((row) => (typeof row.name === "string" ? row.name : ""))
                .filter((v) => v.length > 0)
        );
        const hasStatusColumn = tagColumns.has("status");
        const hasBatchIdColumn = tagColumns.has("batch_id");
        const hasAssignedKindColumn = tagColumns.has("assigned_subject_kind");

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
        const queries = toInsert.map((uid) => {
            const columns = ["id"];
            const values = ["?"];
            const binds: Array<string | null> = [uid];

            if (hasStatusColumn) {
                columns.push("status");
                values.push("?");
                binds.push("unsold");
            }
            if (hasBatchIdColumn) {
                columns.push("batch_id");
                values.push("?");
                binds.push(currentBatch);
            }
            if (hasAssignedKindColumn) {
                columns.push("assigned_subject_kind");
                values.push("?");
                binds.push(kind);
            }

            return db
                .prepare(
                    `INSERT OR IGNORE INTO tags (${columns.join(", ")}) VALUES (${values.join(", ")})`
                )
                .bind(...binds);
        });
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
        revalidatePath("/admin/nfc-tags");
        revalidatePath("/admin/nfc-tags/inventory");
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

const INVENTORY_PAGE_DEFAULT = 20;
const INVENTORY_PAGE_MAX = 100;

function parseInventoryStatus(raw: string | undefined): TagsInventoryStatusFilter {
    if (raw === "active" || raw === "unsold" || raw === "inactive") return raw;
    return "all";
}

/**
 * 태그 인벤토리 목록(페이지네이션·검색·상태·배치 필터). 관리자 전용.
 */
export async function getTagsInventoryPage(
    params: TagsInventoryPageParams = {}
): Promise<TagsInventoryPageResult> {
    await assertAdminRole();
    const db = getDB();

    const qRaw = (params.q ?? "").trim().slice(0, 120);
    const status = parseInventoryStatus(params.status);
    const batchTrim = (params.batch ?? "").trim().slice(0, 200);

    let page = Number(params.page) || 1;
    if (!Number.isFinite(page) || page < 1) page = 1;
    let pageSize = Number(params.pageSize) || INVENTORY_PAGE_DEFAULT;
    if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = INVENTORY_PAGE_DEFAULT;
    pageSize = Math.min(INVENTORY_PAGE_MAX, Math.max(10, Math.floor(pageSize)));

    const conditions: string[] = [];
    const binds: unknown[] = [];

    if (qRaw.length > 0) {
        const pat = `%${qRaw.toLowerCase()}%`;
        conditions.push(
            `(LOWER(t.id) LIKE ? OR LOWER(COALESCE(p.name,'')) LIKE ? OR LOWER(COALESCE(t.product_name,'')) LIKE ? OR LOWER(COALESCE(u.email,'')) LIKE ?)`
        );
        binds.push(pat, pat, pat, pat);
    }
    if (status !== "all") {
        conditions.push(`t.status = ?`);
        binds.push(status);
    }
    if (batchTrim.length > 0) {
        conditions.push(`t.batch_id = ?`);
        binds.push(batchTrim);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const baseFrom = `
        FROM tags t
        LEFT JOIN pets p ON t.pet_id = p.id
        LEFT JOIN user u ON p.owner_id = u.id
        ${whereSql}
    `;

    const countRow = await db
        .prepare(`SELECT COUNT(*) AS c ${baseFrom}`)
        .bind(...binds)
        .first<{ c: number }>();
    const total = Number(countRow?.c ?? 0);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    let safePage = page;
    if (safePage > totalPages) safePage = totalPages;
    const offset = (safePage - 1) * pageSize;
    const listBinds = [...binds, pageSize, offset];
    const { results } = await db
        .prepare(
            `SELECT t.*, p.name as pet_name, u.email as owner_email
             ${baseFrom}
             ORDER BY t.created_at DESC
             LIMIT ? OFFSET ?`
        )
        .bind(...listBinds)
        .all();

    return {
        rows: (results ?? []) as AdminTag[],
        total,
        page: safePage,
        pageSize,
    };
}

/**
 * 인벤토리 배치 필터용 batch_id 목록(최근 순, 상한).
 */
export async function getTagInventoryBatchOptions(): Promise<string[]> {
    await assertAdminRole();
    const db = getDB();
    const { results } = await db
        .prepare(
            `SELECT DISTINCT batch_id AS batch_id FROM tags
             WHERE batch_id IS NOT NULL AND trim(batch_id) != ''
             ORDER BY batch_id DESC
             LIMIT 200`
        )
        .all<{ batch_id: string }>();
    return (results ?? []).map((r) => r.batch_id).filter(Boolean);
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
    const webWriteFailures7d = await db
        .prepare("SELECT COUNT(*) AS value FROM admin_action_logs WHERE action='nfc_web_write' AND success = 0 AND created_at >= datetime('now', '-7 days')")
        .first<{ value: number }>()
        .catch(() => ({ value: 0 }));
    const nativeWriteSuccessFromWebFail7d = await db
        .prepare(`
            SELECT COUNT(*) AS value
            FROM admin_action_logs n
            WHERE n.action='nfc_native_write'
              AND n.success=1
              AND n.created_at >= datetime('now', '-7 days')
              AND EXISTS (
                SELECT 1
                FROM admin_action_logs w
                WHERE w.action='nfc_web_write'
                  AND w.success=0
                  AND w.created_at >= datetime('now', '-7 days')
                  AND json_extract(w.payload, '$.tagId') = json_extract(n.payload, '$.tagId')
              )
        `)
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
    const webFailCount = webWriteFailures7d?.value ?? 0;
    const nativeRecoveredCount = nativeWriteSuccessFromWebFail7d?.value ?? 0;
    const nativeRecoveryRate7d =
        webFailCount > 0 ? Number(((nativeRecoveredCount / webFailCount) * 100).toFixed(1)) : 0;

    return {
        totalCount,
        activeCount,
        unsoldCount,
        activationRate,
        recentLinks: recentLinks?.value ?? 0,
        failedRegistrations7d: failedRegistrations7d?.value ?? 0,
        webWriteFailures7d: webFailCount,
        nativeWriteSuccessFromWebFail7d: nativeRecoveredCount,
        nativeRecoveryRate7d,
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
    platform?: "all" | "android" | "ios" | "unknown";
    mode?: "all" | "linku" | "tools" | "unknown";
    appVersion?: string;
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
    const platform = params?.platform ?? "all";
    const mode = params?.mode ?? "all";
    const appVersion = (params?.appVersion ?? "").trim();
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
    if (platform !== "all") {
        whereParts.push("COALESCE(json_extract(payload, '$.platform'), 'unknown') = ?");
        bindValues.push(platform);
    }
    if (mode !== "all") {
        whereParts.push("COALESCE(json_extract(payload, '$.mode'), 'unknown') = ?");
        bindValues.push(mode);
    }
    if (appVersion) {
        whereParts.push("COALESCE(json_extract(payload, '$.appVersion'), 'unknown') LIKE ?");
        bindValues.push(`%${appVersion}%`);
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
    const id = normalizeTagUid(tagId);
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
    revalidatePath("/admin/nfc-tags");
    revalidatePath("/admin/nfc-tags/inventory");
    revalidatePath("/admin/monitoring");
}

const NFC_WRITE_ACTION = "nfc_web_write";
const NFC_READ_ACTION = "nfc_web_read";
const NFC_NATIVE_HANDOFF_ACTION = "nfc_native_handoff";

/**
 * Web NFC로 기록할 공개 URL을 반환합니다. 태그가 DB에 등록된 경우에만 허용합니다.
 */
export async function prepareNfcTagWrite(tagIdRaw: string): Promise<
    { ok: true; tagId: string; url: string } | { ok: false; error: string }
> {
    await assertAdminRole();
    const id = normalizeTagUid(tagIdRaw);
    if (!isValidTagUidFormat(id)) {
        return { ok: false, error: "UID 형식이 올바르지 않습니다." };
    }
    const base =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim() ||
        "";
    if (!base) {
        return { ok: false, error: "NEXT_PUBLIC_APP_URL이 설정되지 않았습니다." };
    }
    const db = getDB();
    const row = await db
        .prepare("SELECT id FROM tags WHERE id = ?")
        .bind(id)
        .first<{ id: string }>();
    if (!row) {
        return { ok: false, error: "등록되지 않은 태그입니다. 먼저 태그를 인벤토리에 등록하세요." };
    }
    const url = `${base}/t/${encodeURIComponent(id)}`;
    return { ok: true, tagId: id, url };
}

/**
 * Web NFC 기록 시도 결과를 admin_action_logs에 남깁니다.
 */
export async function recordNfcWebWriteAudit(input: {
    tagId: string;
    url: string;
    success: boolean;
    clientError?: string;
}): Promise<void> {
    await assertAdminRole();
    const db = getDB();
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
    const payload = JSON.stringify({
        tagId: input.tagId,
        url: input.url,
        ...(input.clientError ? { clientError: input.clientError } : {}),
    });
    await db
        .prepare(
            "INSERT INTO admin_action_logs (action, actor_email, success, payload) VALUES (?, ?, ?, ?)"
        )
        .bind(
            NFC_WRITE_ACTION,
            await getActorEmailSafe(),
            input.success ? 1 : 0,
            payload
        )
        .run();
    revalidatePath("/admin/tags");
    revalidatePath("/admin/nfc-tags");
}

/**
 * Web NFC UID 읽기 시도 결과를 admin_action_logs에 남깁니다.
 */
export async function recordNfcWebReadAudit(input: {
    success: boolean;
    source: "bulk_register" | "write_card";
    tagId?: string;
    clientError?: string;
}): Promise<void> {
    await assertAdminRole();
    const db = getDB();
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
    const payload = JSON.stringify({
        source: input.source,
        ...(input.tagId ? { tagId: input.tagId } : {}),
        ...(input.clientError ? { clientError: input.clientError } : {}),
    });
    await db
        .prepare(
            "INSERT INTO admin_action_logs (action, actor_email, success, payload) VALUES (?, ?, ?, ?)"
        )
        .bind(
            NFC_READ_ACTION,
            await getActorEmailSafe(),
            input.success ? 1 : 0,
            payload
        )
        .run();
    revalidatePath("/admin/tags");
    revalidatePath("/admin/nfc-tags");
}

export type PrepareNfcNativeHandoffResult =
    | {
        ok: true;
        tagId: string;
        url: string;
        appLink: string;
        handoffToken: string;
        expiresAt: number;
        jti: string;
    }
    | { ok: false; error: string };

/**
 * 전용 안드로이드 앱으로 URL 기록 작업을 전달할 수 있는 딥링크를 생성합니다.
 * 앱 스킴 예시: petidconnect://nfc/write?uid=...&url=...
 */
export async function prepareNfcNativeHandoff(tagIdRaw: string): Promise<PrepareNfcNativeHandoffResult> {
    const prep = await prepareNfcTagWrite(tagIdRaw);
    if (!prep.ok) return prep;
    const handoffSecret = process.env.NFC_NATIVE_HANDOFF_SECRET?.trim();
    if (!handoffSecret) {
        return { ok: false, error: "NFC_NATIVE_HANDOFF_SECRET이 설정되지 않았습니다." };
    }
    const { token, expiresAt, jti } = await mintNativeHandoffToken({
        uid: prep.tagId,
        url: prep.url,
        expiresInSec: 10 * 60,
        secret: handoffSecret,
    });

    const params = new URLSearchParams({
        uid: prep.tagId,
        url: prep.url,
        handoffToken: token,
        exp: String(expiresAt),
    });
    const appLink = `petidconnect://nfc/write?${params.toString()}`;
    const payload = JSON.stringify({
        tagId: prep.tagId,
        url: prep.url,
        appLink,
        jti,
        expiresAt,
        source: "admin_write_card",
    });

    const db = getDB();
    await db.prepare(`
            CREATE TABLE IF NOT EXISTS nfc_native_handoff_tokens (
                jti TEXT PRIMARY KEY,
                tag_id TEXT NOT NULL,
                url TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                issued_by TEXT,
                consumed_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
    await db
        .prepare(
            "INSERT OR REPLACE INTO nfc_native_handoff_tokens (jti, tag_id, url, expires_at, issued_by) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(
            jti,
            prep.tagId,
            prep.url,
            new Date(expiresAt * 1000).toISOString(),
            await getActorEmailSafe()
        )
        .run();
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
    await db
        .prepare(
            "INSERT INTO admin_action_logs (action, actor_email, success, payload) VALUES (?, ?, 1, ?)"
        )
        .bind(
            NFC_NATIVE_HANDOFF_ACTION,
            await getActorEmailSafe(),
            payload
        )
        .run();

    return {
        ok: true,
        tagId: prep.tagId,
        url: prep.url,
        appLink,
        handoffToken: token,
        expiresAt,
        jti,
    };
}
