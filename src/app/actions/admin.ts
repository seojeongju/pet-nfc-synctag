"use server";
import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { parseSubjectKind, SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";
import { normalizeBleMac } from "@/lib/device-mode";
import { isValidTagUidFormat, normalizeTagUid } from "@/lib/tag-uid-format";
import {
    computeNdefWriteUrlForInventoryTag,
    type NdefWriteWayfinderWarning,
} from "@/lib/nfc-inventory-ndef-url";
import { mintNativeHandoffToken } from "@/lib/nfc-native-security";
import {
    requirePlatformOrTenantAdminActor,
    resolveAdminScope,
} from "@/lib/admin-authz";
import type {
    AdminTag,
    AdminWayfinderSpotPickRow,
    TagBatchesPageResult,
    TagBatchSummaryRow,
    TagLinkLogRow,
    TagLinkLogsPageResult,
    TagsInventoryLinkFilter,
    TagsInventoryPageParams,
    TagsInventoryPageResult,
    TagsInventoryStatusFilter,
    TagsInventoryWayfinderFilter,
} from "@/types/admin-tags";
import type { AdminScope } from "@/lib/admin-authz";

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

/** 대량 등록·인벤토리 편집 공통: 스팟 존재 및 테넌트/개인 스팟 규칙 검증 */
async function resolveWayfinderSpotForInventoryTagLink(
    db: D1Database,
    scope: AdminScope,
    spotId: string,
    hasWayfinderSpotColumn: boolean
): Promise<{ id: string; subject_kind: string }> {
    if (!hasWayfinderSpotColumn) {
        throw new Error(
            "tags.wayfinder_spot_id 컬럼이 없습니다. 마이그레이션 0034_tags_wayfinder_spot.sql 을 적용하세요."
        );
    }
    const trimmed = spotId.trim();
    const forcedTenantId =
        scope.actor.isPlatformAdmin || !scope.tenantIds || scope.tenantIds.length === 0
            ? null
            : scope.tenantIds[0] ?? null;
    const wfRow = await db
        .prepare("SELECT id, tenant_id, subject_kind FROM wayfinder_spots WHERE id = ?")
        .bind(trimmed)
        .first<{ id: string; tenant_id: string | null; subject_kind: string }>();
    if (!wfRow) {
        throw new Error("동행 스팟을 찾을 수 없습니다.");
    }
    if (!scope.actor.isPlatformAdmin) {
        const stid = (wfRow.tenant_id ?? "").trim() || null;
        if (stid) {
            if (!forcedTenantId || stid !== forcedTenantId) {
                throw new Error("선택한 동행 스팟은 현재 조직 인벤토리 범위와 맞지 않습니다.");
            }
        } else if (forcedTenantId) {
            throw new Error("개인(비조직) 동행 스팟에는 테넌트 인벤토리 태그를 연결할 수 없습니다.");
        }
    }
    return { id: wfRow.id, subject_kind: wfRow.subject_kind };
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
    /** 링크유-동행 스팟 연결 시: NDEF URL은 /wayfinder?from=nfc&tag=UID (GPS·근처 역 메인) */
    wayfinderSpotId?: string | null;
    /**
     * 이미 인벤토리에 있는 UID 처리
     * - skip: 기존과 동일(INSERT만, 중복은 건너뜀)
     * - update_meta: 할당 모드·배치 ID를 현재 등록 설정으로 갱신(펫 연결은 유지)
     */
    existingUidBehavior?: "skip" | "update_meta";
};

/**
 * NFC 태그를 시스템에 대량으로 미리 등록합니다 (관리자 전용)
 */
export async function registerBulkTags(uids: string[], options?: RegisterBulkTagsOptions) {
    const scope = await resolveAdminScope("admin");
    const db = getDB();
    const forcedTenantId =
        scope.actor.isPlatformAdmin || !scope.tenantIds || scope.tenantIds.length === 0
            ? null
            : scope.tenantIds[0] ?? null;
    const kind = options?.assignedSubjectKind ?? null;
    const kindSlug =
        kind && (SUBJECT_KINDS as readonly string[]).includes(kind) ? kind : "generic";
    let currentBatch = options?.batchId || `BATCH-${kindSlug}-${Date.now()}`;
    const normalized = uids.map(normalizeTagUid).filter((uid) => uid.length > 0);
    const uniqueNormalized = Array.from(new Set(normalized));
    const validUids = uniqueNormalized.filter(isValidTagUidFormat);
    const invalidCount = uniqueNormalized.length - validUids.length;
    const duplicateInRequest = normalized.length - uniqueNormalized.length;
    let duplicateExisting = 0;
    let updatedExistingMeta = 0;

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
        const hasTenantIdColumn = tagColumns.has("tenant_id");
        const hasWayfinderSpotColumn = tagColumns.has("wayfinder_spot_id");

        const wayfinderSpotIdOpt = (options?.wayfinderSpotId ?? "").trim() || null;
        let effectiveAssignedKind: SubjectKind | null = kind;
        if (wayfinderSpotIdOpt) {
            const wf = await resolveWayfinderSpotForInventoryTagLink(
                db,
                scope,
                wayfinderSpotIdOpt,
                hasWayfinderSpotColumn
            );
            effectiveAssignedKind = parseSubjectKind(wf.subject_kind);
        }
        const assignKindForTags = effectiveAssignedKind;
        if (!options?.batchId && wayfinderSpotIdOpt) {
            currentBatch = `BATCH-wf-${Date.now()}`;
        }

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
        const existingUidBehavior = options?.existingUidBehavior ?? "skip";

        if (existingUidBehavior === "update_meta" && hasAssignedKindColumn) {
            const toUpdateMeta = validUids.filter((uid) => existingSet.has(uid));
            const setParts: string[] = ["updated_at = CURRENT_TIMESTAMP"];
            const setBinds: unknown[] = [];
            setParts.push("assigned_subject_kind = ?");
            setBinds.push(assignKindForTags);
            if (hasBatchIdColumn) {
                setParts.push("batch_id = ?");
                setBinds.push(currentBatch);
            }
            if (hasWayfinderSpotColumn && wayfinderSpotIdOpt) {
                setParts.push("wayfinder_spot_id = ?");
                setBinds.push(wayfinderSpotIdOpt);
            }
            const setSql = setParts.join(", ");

            let tenantWhere = "";
            const tenantBinds: unknown[] = [];
            if (!scope.actor.isPlatformAdmin) {
                if (forcedTenantId) {
                    tenantWhere = " AND tenant_id = ?";
                    tenantBinds.push(forcedTenantId);
                } else if (scope.tenantIds && scope.tenantIds.length > 0) {
                    tenantWhere = ` AND tenant_id IN (${scope.tenantIds.map(() => "?").join(", ")})`;
                    tenantBinds.push(...scope.tenantIds);
                }
            }

            const updateChunks = chunkArray(toUpdateMeta, 200);
            for (const chunk of updateChunks) {
                if (chunk.length === 0) continue;
                const ph = chunk.map(() => "?").join(",");
                const countRow = await db
                    .prepare(
                        `SELECT COUNT(*) AS c FROM tags WHERE id IN (${ph})${tenantWhere}`
                    )
                    .bind(...chunk, ...tenantBinds)
                    .first<{ c: number }>();
                updatedExistingMeta += Number(countRow?.c ?? 0);
                if (Number(countRow?.c ?? 0) === 0) continue;
                await db
                    .prepare(
                        `UPDATE tags SET ${setSql} WHERE id IN (${ph})${tenantWhere}`
                    )
                    .bind(...setBinds, ...chunk, ...tenantBinds)
                    .run();
            }
        }

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
                binds.push(assignKindForTags);
            }
            if (hasWayfinderSpotColumn && wayfinderSpotIdOpt) {
                columns.push("wayfinder_spot_id");
                values.push("?");
                binds.push(wayfinderSpotIdOpt);
            }
            if (hasTenantIdColumn && forcedTenantId) {
                columns.push("tenant_id");
                values.push("?");
                binds.push(forcedTenantId);
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
            assignedSubjectKind: assignKindForTags,
            wayfinderSpotId: wayfinderSpotIdOpt,
            requestedCount: normalized.length,
            registeredCount: toInsert.length,
            invalidCount,
            duplicateInRequest,
            duplicateExisting,
            updatedExistingMeta,
            existingUidBehavior,
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

function parseInventoryLink(raw: string | undefined): TagsInventoryLinkFilter {
    if (raw === "linked" || raw === "unlinked") return raw;
    return "all";
}

function parseInventoryWayfinder(raw: string | undefined): TagsInventoryWayfinderFilter {
    if (raw === "linked" || raw === "unlinked") return raw;
    return "all";
}

function parseIsoDateDay(raw: string | undefined): string | null {
    const t = (raw ?? "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

async function resolveTagScopeTenantId(tenantIdRaw?: string | null): Promise<string | null> {
    const scope = await resolveAdminScope("admin");
    const tenantId = (tenantIdRaw ?? "").trim() || null;
    if (tenantId) {
        await requirePlatformOrTenantAdminActor(tenantId, "admin");
        return tenantId;
    }
    if (scope.actor.isPlatformAdmin) {
        return null;
    }
    if (!scope.tenantIds || scope.tenantIds.length === 0) {
        throw new Error("조직 스코프(tenant)가 필요합니다.");
    }
    return scope.tenantIds[0] ?? null;
}

/**
 * 태그 인벤토리 목록(페이지네이션·검색·상태·배치 필터). 관리자 전용.
 */
export async function getTagsInventoryPage(
    params: TagsInventoryPageParams = {}
): Promise<TagsInventoryPageResult> {
    const scopeTenantId = await resolveTagScopeTenantId(params.tenantId);
    const db = getDB();

    const qRaw = (params.q ?? "").trim().slice(0, 120);
    const status = parseInventoryStatus(params.status);
    const batchTrim = (params.batch ?? "").trim().slice(0, 200);
    const linkFilter = parseInventoryLink(params.link);
    const wfFilter = parseInventoryWayfinder(params.wf);
    const kindRaw = (params.kind ?? "").trim();
    let regFrom = parseIsoDateDay(params.regFrom);
    let regTo = parseIsoDateDay(params.regTo);
    if (regFrom && regTo && regFrom > regTo) {
        const tmp = regFrom;
        regFrom = regTo;
        regTo = tmp;
    }

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
            `(LOWER(t.id) LIKE ? OR LOWER(COALESCE(p.name,'')) LIKE ? OR LOWER(COALESCE(t.product_name,'')) LIKE ? OR LOWER(COALESCE(u.email,'')) LIKE ? OR LOWER(COALESCE(wf.slug,'')) LIKE ? OR LOWER(COALESCE(wf.title,'')) LIKE ?)`
        );
        binds.push(pat, pat, pat, pat, pat, pat);
    }
    if (status !== "all") {
        conditions.push(`t.status = ?`);
        binds.push(status);
    }
    if (batchTrim.length > 0) {
        conditions.push(`t.batch_id = ?`);
        binds.push(batchTrim);
    }
    if (scopeTenantId) {
        conditions.push(`COALESCE(t.tenant_id, p.tenant_id) = ?`);
        binds.push(scopeTenantId);
    }
    if (linkFilter === "linked") {
        conditions.push(`t.pet_id IS NOT NULL`);
    } else if (linkFilter === "unlinked") {
        conditions.push(`t.pet_id IS NULL`);
    }
    if (wfFilter === "linked") {
        conditions.push(
            `(t.wayfinder_spot_id IS NOT NULL AND trim(COALESCE(t.wayfinder_spot_id, '')) != '')`
        );
    } else if (wfFilter === "unlinked") {
        conditions.push(
            `(t.wayfinder_spot_id IS NULL OR trim(COALESCE(t.wayfinder_spot_id, '')) = '')`
        );
    }
    if (kindRaw === "__unset__") {
        conditions.push(
            `(t.assigned_subject_kind IS NULL OR trim(COALESCE(t.assigned_subject_kind, '')) = '')`
        );
    } else if (kindRaw.length > 0 && (SUBJECT_KINDS as readonly string[]).includes(kindRaw)) {
        conditions.push(`t.assigned_subject_kind = ?`);
        binds.push(kindRaw);
    }
    if (regFrom) {
        conditions.push(`date(t.created_at) >= date(?)`);
        binds.push(regFrom);
    }
    if (regTo) {
        conditions.push(`date(t.created_at) <= date(?)`);
        binds.push(regTo);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const baseFrom = `
        FROM tags t
        LEFT JOIN pets p ON t.pet_id = p.id
        LEFT JOIN user u ON p.owner_id = u.id
        LEFT JOIN wayfinder_spots wf ON wf.id = t.wayfinder_spot_id
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
            `SELECT t.*, p.name as pet_name, u.email as owner_email,
                    wf.slug AS wayfinder_spot_slug, wf.title AS wayfinder_spot_title
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
export async function getTagInventoryBatchOptions(tenantId?: string): Promise<string[]> {
    const scopeTenantId = await resolveTagScopeTenantId(tenantId);
    const db = getDB();
    const where = scopeTenantId
        ? "WHERE batch_id IS NOT NULL AND trim(batch_id) != '' AND tenant_id = ?"
        : "WHERE batch_id IS NOT NULL AND trim(batch_id) != ''";
    const stmt = db.prepare(
        `SELECT DISTINCT batch_id AS batch_id FROM tags
         ${where}
         ORDER BY batch_id DESC
         LIMIT 200`
    );
    const { results } = await (scopeTenantId ? stmt.bind(scopeTenantId) : stmt).all<{ batch_id: string }>();
    return (results ?? []).map((r) => r.batch_id).filter(Boolean);
}

const BATCH_INVENTORY_PAGE_DEFAULT = 5;
const BATCH_INVENTORY_PAGE_MAX = 50;
const BATCH_INVENTORY_PAGE_MIN = 3;

/**
 * 인벤토리「배치 등록 통계」용: batch_id별 집계를 페이지로 나눔
 */
export async function getTagBatchesPage(
    params: { page?: number; pageSize?: number; tenantId?: string } = {}
): Promise<TagBatchesPageResult> {
    const scopeTenantId = await resolveTagScopeTenantId(params.tenantId);
    const db = getDB();
    const pageRaw = Math.max(1, Number(params.page) || 1);
    let pageSize = Number(params.pageSize) || BATCH_INVENTORY_PAGE_DEFAULT;
    if (!Number.isFinite(pageSize)) pageSize = BATCH_INVENTORY_PAGE_DEFAULT;
    pageSize = Math.min(
        BATCH_INVENTORY_PAGE_MAX,
        Math.max(BATCH_INVENTORY_PAGE_MIN, Math.floor(pageSize))
    );

    const countSql = scopeTenantId
        ? `SELECT COUNT(*) AS c FROM (
         SELECT 1 AS x FROM tags
         WHERE batch_id IS NOT NULL AND trim(COALESCE(batch_id, '')) != '' AND tenant_id = ?
         GROUP BY batch_id
       )`
        : `SELECT COUNT(*) AS c FROM (
         SELECT 1 AS x FROM tags
         WHERE batch_id IS NOT NULL AND trim(COALESCE(batch_id, '')) != ''
         GROUP BY batch_id
       )`;
    const countStmt = db.prepare(countSql);
    const countRow = await (scopeTenantId ? countStmt.bind(scopeTenantId) : countStmt)
        .first<{ c: number }>()
        .catch(() => ({ c: 0 }));
    const total = Math.max(0, Math.floor(Number(countRow?.c ?? 0)));

    const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
    let safePage = pageRaw;
    if (safePage > totalPages) safePage = totalPages;
    if (safePage < 1) safePage = 1;
    const offset = (safePage - 1) * pageSize;

    const listSql = scopeTenantId
        ? `SELECT * FROM (
         SELECT
           batch_id,
           COUNT(*) AS total_count,
           SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
           SUM(CASE WHEN status = 'unsold' THEN 1 ELSE 0 END) AS unsold_count,
           MAX(created_at) AS latest_created_at
         FROM tags
         WHERE batch_id IS NOT NULL AND trim(COALESCE(batch_id, '')) != '' AND tenant_id = ?
         GROUP BY batch_id
       ) AS bat
       ORDER BY bat.latest_created_at DESC
       LIMIT ? OFFSET ?`
        : `SELECT * FROM (
         SELECT
           batch_id,
           COUNT(*) AS total_count,
           SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
           SUM(CASE WHEN status = 'unsold' THEN 1 ELSE 0 END) AS unsold_count,
           MAX(created_at) AS latest_created_at
         FROM tags
         WHERE batch_id IS NOT NULL AND trim(COALESCE(batch_id, '')) != ''
         GROUP BY batch_id
       ) AS bat
       ORDER BY bat.latest_created_at DESC
       LIMIT ? OFFSET ?`;
    const listStmt = db.prepare(listSql);
    const { results } = await (scopeTenantId
        ? listStmt.bind(scopeTenantId, pageSize, offset)
        : listStmt.bind(pageSize, offset))
        .all<TagBatchSummaryRow>()
        .catch(() => ({ results: [] as TagBatchSummaryRow[] }));

    return {
        rows: results ?? [],
        total,
        page: safePage,
        pageSize,
    };
}

/**
 * 관리자 대시보드용 통계 데이터를 가져옵니다
 */
export async function getAdminStats() {
    const scope = await resolveAdminScope("admin");
    const db = getDB();
    type CountRow = Record<string, number>;
    type BatchResult = { results: CountRow[] };
    if (scope.actor.isPlatformAdmin || !scope.tenantIds || scope.tenantIds.length === 0) {
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
    const placeholders = scope.tenantIds.map(() => "?").join(", ");
    const stats = await db.batch([
        db.prepare(`SELECT count(*) as total FROM tags WHERE tenant_id IN (${placeholders})`).bind(...scope.tenantIds),
        db.prepare(`SELECT count(*) as active FROM tags WHERE status = 'active' AND tenant_id IN (${placeholders})`).bind(...scope.tenantIds),
        db.prepare(`SELECT count(*) as unsold FROM tags WHERE status = 'unsold' AND tenant_id IN (${placeholders})`).bind(...scope.tenantIds),
        db.prepare(
            `SELECT count(DISTINCT tm.user_id) as total_users
             FROM tenant_members tm
             WHERE tm.tenant_id IN (${placeholders})`
        ).bind(...scope.tenantIds),
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
    const scope = await resolveAdminScope("admin");
    const db = getDB();
    const placeholders = scope.tenantIds?.map(() => "?").join(", ") ?? "";
    const { results } = await (
        scope.actor.isPlatformAdmin || !scope.tenantIds || scope.tenantIds.length === 0
            ? db.prepare(`SELECT COALESCE(subject_kind, 'pet') AS k, COUNT(*) AS c FROM pets GROUP BY k`)
            : db.prepare(
                `SELECT COALESCE(p.subject_kind, 'pet') AS k, COUNT(*) AS c
                 FROM pets p
                 WHERE EXISTS (
                   SELECT 1 FROM tenant_members tm
                   WHERE tm.user_id = p.owner_id
                     AND tm.tenant_id IN (${placeholders})
                 )
                 GROUP BY COALESCE(p.subject_kind, 'pet')`
            ).bind(...scope.tenantIds)
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

export async function getTagOpsStats(tenantId?: string) {
    const scopeTenantId = await resolveTagScopeTenantId(tenantId);
    const db = getDB();
    const total = await (scopeTenantId
        ? db.prepare("SELECT COUNT(*) AS value FROM tags WHERE tenant_id = ?").bind(scopeTenantId)
        : db.prepare("SELECT COUNT(*) AS value FROM tags")
    ).first<{ value: number }>();
    const active = await (scopeTenantId
        ? db.prepare("SELECT COUNT(*) AS value FROM tags WHERE status = 'active' AND tenant_id = ?").bind(scopeTenantId)
        : db.prepare("SELECT COUNT(*) AS value FROM tags WHERE status = 'active'")
    ).first<{ value: number }>();
    const unsold = await (scopeTenantId
        ? db.prepare("SELECT COUNT(*) AS value FROM tags WHERE status = 'unsold' AND tenant_id = ?").bind(scopeTenantId)
        : db.prepare("SELECT COUNT(*) AS value FROM tags WHERE status = 'unsold'")
    ).first<{ value: number }>();
    const recentLinks = await (scopeTenantId
        ? db.prepare(
            `SELECT COUNT(*) AS value
             FROM tag_link_logs l
             INNER JOIN tags t ON t.id = l.tag_id
             WHERE l.action='link' AND l.created_at >= datetime('now', '-7 days') AND t.tenant_id = ?`
        ).bind(scopeTenantId)
        : db.prepare("SELECT COUNT(*) AS value FROM tag_link_logs WHERE action='link' AND created_at >= datetime('now', '-7 days')")
    ).first<{ value: number }>().catch(() => ({ value: 0 }));
    const failedRegistrations7d = scopeTenantId
        ? { value: 0 }
        : await db
            .prepare("SELECT COALESCE(SUM(CAST(json_extract(payload, '$.failedCount') AS INTEGER)), 0) AS value FROM admin_action_logs WHERE action='bulk_register' AND created_at >= datetime('now', '-7 days')")
            .first<{ value: number }>()
            .catch(() => ({ value: 0 }));
    const webWriteFailures7d = await (scopeTenantId
        ? db.prepare(
            `SELECT COUNT(*) AS value
             FROM admin_action_logs a
             WHERE a.action='nfc_web_write'
               AND a.success = 0
               AND a.created_at >= datetime('now', '-7 days')
               AND EXISTS (
                 SELECT 1 FROM tags t
                 WHERE t.id = json_extract(a.payload, '$.tagId')
                   AND t.tenant_id = ?
               )`
          ).bind(scopeTenantId)
        : db.prepare("SELECT COUNT(*) AS value FROM admin_action_logs WHERE action='nfc_web_write' AND success = 0 AND created_at >= datetime('now', '-7 days')")
      ).first<{ value: number }>()
      .catch(() => ({ value: 0 }));
    const nativeWriteSuccessFromWebFail7d = await (scopeTenantId
        ? db.prepare(`
            SELECT COUNT(*) AS value
            FROM admin_action_logs n
            WHERE n.action='nfc_native_write'
              AND n.success=1
              AND n.created_at >= datetime('now', '-7 days')
              AND EXISTS (
                SELECT 1 FROM tags t
                WHERE t.id = json_extract(n.payload, '$.tagId')
                  AND t.tenant_id = ?
              )
              AND EXISTS (
                SELECT 1
                FROM admin_action_logs w
                WHERE w.action='nfc_web_write'
                  AND w.success=0
                  AND w.created_at >= datetime('now', '-7 days')
                  AND json_extract(w.payload, '$.tagId') = json_extract(n.payload, '$.tagId')
              )
        `).bind(scopeTenantId)
        : db.prepare(`
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
      ).first<{ value: number }>()
      .catch(() => ({ value: 0 }));

    const batchRows = await (scopeTenantId
        ? db.prepare(`
        SELECT 
            batch_id,
            COUNT(*) AS total_count,
            SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active_count,
            SUM(CASE WHEN status='unsold' THEN 1 ELSE 0 END) AS unsold_count,
            MAX(created_at) AS latest_created_at
        FROM tags
        WHERE batch_id IS NOT NULL AND tenant_id = ?
        GROUP BY batch_id
        ORDER BY latest_created_at DESC
        LIMIT 8
    `).bind(scopeTenantId)
        : db.prepare(`
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
    `)
    ).all<{
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

const TAG_LINK_LOGS_PAGE_DEFAULT = 20;
const TAG_LINK_LOGS_PAGE_MAX = 100;
const TAG_LINK_LOGS_PAGE_MIN = 5;

/**
 * tag_link_logs(연결/해제) — 인벤토리 감사 `page`와 겹치지 않도록 별도 페이징
 */
export async function getTagLinkLogsPage(
    params: { page?: number; pageSize?: number } = {}
): Promise<TagLinkLogsPageResult> {
    const scope = await resolveAdminScope("admin");
    const db = getDB();
    const pageRaw = Math.max(1, Number(params.page) || 1);
    let pageSize = Number(params.pageSize) || TAG_LINK_LOGS_PAGE_DEFAULT;
    if (!Number.isFinite(pageSize)) pageSize = TAG_LINK_LOGS_PAGE_DEFAULT;
    pageSize = Math.min(
        TAG_LINK_LOGS_PAGE_MAX,
        Math.max(TAG_LINK_LOGS_PAGE_MIN, Math.floor(pageSize))
    );

    const placeholders = scope.tenantIds?.map(() => "?").join(", ") ?? "";
    const countRow = await (
        scope.actor.isPlatformAdmin || !scope.tenantIds || scope.tenantIds.length === 0
            ? db.prepare("SELECT COUNT(*) AS c FROM tag_link_logs")
            : db.prepare(
                `SELECT COUNT(*) AS c
                 FROM tag_link_logs l
                 LEFT JOIN tags t ON t.id = l.tag_id
                 LEFT JOIN pets p ON p.id = l.pet_id
                 WHERE COALESCE(t.tenant_id, p.tenant_id) IN (${placeholders})`
            ).bind(...scope.tenantIds)
    )
        .first<{ c: number }>()
        .catch(() => ({ c: 0 }));
    const total = Math.max(0, Math.floor(Number(countRow?.c ?? 0)));

    const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
    let safePage = pageRaw;
    if (safePage > totalPages) safePage = totalPages;
    if (safePage < 1) safePage = 1;
    const offset = (safePage - 1) * pageSize;

    const { results } = await (
        scope.actor.isPlatformAdmin || !scope.tenantIds || scope.tenantIds.length === 0
            ? db
                  .prepare(
                      `SELECT
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
                  LIMIT ? OFFSET ?`
                  )
                  .bind(pageSize, offset)
            : db
                  .prepare(
                      `SELECT
                      l.id,
                      l.tag_id,
                      l.pet_id,
                      l.action,
                      l.created_at,
                      p.name AS pet_name,
                      u.email AS owner_email
                  FROM tag_link_logs l
                  LEFT JOIN tags t ON t.id = l.tag_id
                  LEFT JOIN pets p ON l.pet_id = p.id
                  LEFT JOIN user u ON p.owner_id = u.id
                  WHERE COALESCE(t.tenant_id, p.tenant_id) IN (${placeholders})
                  ORDER BY l.created_at DESC
                  LIMIT ? OFFSET ?`
                  )
                  .bind(...scope.tenantIds, pageSize, offset)
    )
        .all<TagLinkLogRow>()
        .catch(() => ({ results: [] as TagLinkLogRow[] }));

    return {
        rows: results ?? [],
        total,
        page: safePage,
        pageSize,
    };
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
    const scope = await resolveAdminScope("admin");
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
    if (!scope.actor.isPlatformAdmin && scope.tenantIds && scope.tenantIds.length > 0) {
        const placeholders = scope.tenantIds.map(() => "?").join(", ");
        whereParts.push(
            `(
              EXISTS (
                SELECT 1
                FROM tags t_scope
                WHERE t_scope.id = json_extract(payload, '$.tagId')
                  AND t_scope.tenant_id IN (${placeholders})
              )
              OR COALESCE(json_extract(payload, '$.tenantId'), '') IN (${placeholders})
            )`
        );
        bindValues.push(...scope.tenantIds, ...scope.tenantIds);
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
    await resolveAdminScope("admin");
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
    await resolveAdminScope("admin");
}

/**
 * 제품명·할당 모드(링크유-펫/메모리/키즈/러기지)·BLE MAC·동행 스팟 연결 관리 (출고 전·운영 중)
 */
export async function updateTagProductProfile(
    tagId: string,
    payload: {
        product_name: string | null;
        assigned_subject_kind: string | null;
        ble_mac: string | null;
        /**
         * 동행 스팟: `null`·빈 문자열 = 연결 해제.
         * 키를 생략하면 `wayfinder_spot_id` 컬럼은 변경하지 않음(구 클라이언트 호환).
         */
        wayfinder_spot_id?: string | null;
    }
) {
    const scope = await resolveAdminScope("admin");
    const db = getDB();
    const id = normalizeTagUid(tagId);
    if (!isValidTagUidFormat(id)) {
        throw new Error("UID 형식이 올바르지 않습니다.");
    }

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
    const hasWayfinderSpotColumn = tagColumns.has("wayfinder_spot_id");

    const row = await db
        .prepare("SELECT id, pet_id, tenant_id FROM tags WHERE id = ?")
        .bind(id)
        .first<{ id: string; pet_id: string | null; tenant_id: string | null }>();
    if (!row) {
        throw new Error("태그를 찾을 수 없습니다.");
    }

    if (!scope.actor.isPlatformAdmin) {
        const tid = (row.tenant_id ?? "").trim();
        if (!tid || !scope.tenantIds?.includes(tid)) {
            throw new Error("이 태그를 수정할 권한이 없습니다.");
        }
    }

    const productName = payload.product_name?.trim() || null;
    const modeRaw = payload.assigned_subject_kind;
    const modeFromPayload: string | null =
        !modeRaw || !String(modeRaw).trim()
            ? null
            : parseSubjectKind(String(modeRaw));
    const mac = payload.ble_mac?.trim() ? normalizeBleMac(payload.ble_mac) : null;

    let modeToStore = modeFromPayload;
    let wayfinderBind: string | null | undefined = undefined;

    if (hasWayfinderSpotColumn && "wayfinder_spot_id" in payload) {
        const trimmedWf =
            payload.wayfinder_spot_id == null ? "" : String(payload.wayfinder_spot_id).trim();
        if (!trimmedWf) {
            wayfinderBind = null;
        } else {
            const wf = await resolveWayfinderSpotForInventoryTagLink(
                db,
                scope,
                trimmedWf,
                hasWayfinderSpotColumn
            );
            wayfinderBind = wf.id;
            modeToStore = parseSubjectKind(wf.subject_kind);
        }
    }

    const runUpdate = async () => {
        if (hasWayfinderSpotColumn && wayfinderBind !== undefined) {
            return db
                .prepare(
                    `UPDATE tags SET product_name = ?, assigned_subject_kind = ?, ble_mac = ?, wayfinder_spot_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
                )
                .bind(productName, modeToStore, mac, wayfinderBind, id)
                .run();
        }
        return db
            .prepare(
                `UPDATE tags SET product_name = ?, assigned_subject_kind = ?, ble_mac = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
            )
            .bind(productName, modeToStore, mac, id)
            .run();
    };

    await runUpdate().catch((e: Error) => {
        throw new Error(
            e.message?.includes("no such column")
                ? "DB 마이그레이션(product_name, assigned_subject_kind, wayfinder_spot_id)을 적용해 주세요."
                : e.message
        );
    });

    revalidatePath("/admin/tags");
    revalidatePath("/admin/nfc-tags");
    revalidatePath("/admin/nfc-tags/inventory");
    revalidatePath("/admin/monitoring");
}

/**
 * 인벤토리에서 태그 행을 삭제합니다. 관리 대상에 연결된 태그는 삭제할 수 없습니다(먼저 연결 해제).
 */
export async function deleteInventoryTagAdmin(tagId: string) {
    const scope = await resolveAdminScope("admin");
    const db = getDB();
    const id = normalizeTagUid(tagId);
    if (!isValidTagUidFormat(id)) {
        throw new Error("UID 형식이 올바르지 않습니다.");
    }

    const row = await db
        .prepare("SELECT id, pet_id, tenant_id FROM tags WHERE id = ?")
        .bind(id)
        .first<{ id: string; pet_id: string | null; tenant_id: string | null }>();
    if (!row) {
        throw new Error("태그를 찾을 수 없습니다.");
    }
    if (row.pet_id) {
        throw new Error(
            "이 태그는 관리 대상에 연결되어 있습니다. 보호자 대시보드에서 태그 연결을 해제한 뒤 삭제하거나, 대량 등록에서「기존 UID 할당 모드 갱신」을 사용해 주세요."
        );
    }

    if (!scope.actor.isPlatformAdmin) {
        const tid = (row.tenant_id ?? "").trim();
        if (!tid || !scope.tenantIds?.includes(tid)) {
            throw new Error("이 태그를 삭제할 권한이 없습니다.");
        }
    }

    await db.prepare("DELETE FROM tags WHERE id = ?").bind(id).run();

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
        .prepare("INSERT INTO admin_action_logs (action, actor_email, success, payload) VALUES (?, ?, 1, ?)")
        .bind("inventory_tag_delete", await getActorEmailSafe(), JSON.stringify({ tagId: id }))
        .run();

    revalidatePath("/admin/tags");
    revalidatePath("/admin/nfc-tags");
    revalidatePath("/admin/nfc-tags/inventory");
    revalidatePath("/admin/monitoring");
}

const NFC_WRITE_ACTION = "nfc_web_write";
const NFC_READ_ACTION = "nfc_web_read";
const NFC_NATIVE_HANDOFF_ACTION = "nfc_native_handoff";

export type PrepareNfcTagWriteResult =
    | { ok: true; tagId: string; url: string; warnings?: NdefWriteWayfinderWarning[] }
    | { ok: false; error: string };

/**
 * Web NFC로 기록할 공개 URL을 반환합니다. 태그가 DB에 등록된 경우에만 허용합니다.
 * 미발행 동행 스팟은 URL을 반환하되 warnings에 담깁니다(클라이언트에서 확인 후 기록).
 */
export async function prepareNfcTagWrite(tagIdRaw: string): Promise<PrepareNfcTagWriteResult> {
    const scope = await resolveAdminScope("admin");
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
    const row = await (
        scope.actor.isPlatformAdmin || !scope.tenantIds || scope.tenantIds.length === 0
            ? db
                  .prepare(
                      `SELECT t.id AS tag_id, t.wayfinder_spot_id AS wf_spot,
                              w.slug AS wf_slug, w.is_published AS wf_pub, w.title AS wf_title
                       FROM tags t
                       LEFT JOIN wayfinder_spots w ON w.id = t.wayfinder_spot_id
                       WHERE t.id = ?`
                  )
                  .bind(id)
            : db
                  .prepare(
                      `SELECT t.id AS tag_id, t.wayfinder_spot_id AS wf_spot,
                              w.slug AS wf_slug, w.is_published AS wf_pub, w.title AS wf_title
                       FROM tags t
                       LEFT JOIN wayfinder_spots w ON w.id = t.wayfinder_spot_id
                       WHERE t.id = ?
                         AND t.tenant_id IN (${scope.tenantIds.map(() => "?").join(", ")})`
                  )
                  .bind(id, ...scope.tenantIds)
    ).first<{
        tag_id: string;
        wf_spot: string | null;
        wf_slug: string | null;
        wf_pub: number | null;
        wf_title: string | null;
    }>();
    if (!row) {
        return { ok: false, error: "등록되지 않은 태그입니다. 먼저 태그를 인벤토리에 등록하세요." };
    }
    const built = computeNdefWriteUrlForInventoryTag(base, id, row, {
        allowUnpublishedWayfinder: true,
    });
    if (!built.ok) {
        return { ok: false, error: built.error };
    }
    return {
        ok: true,
        tagId: id,
        url: built.url,
        ...(built.warnings?.length ? { warnings: built.warnings } : {}),
    };
}

const WAYFINDER_SPOT_PICK_LIMIT = 400;

/** 대량 등록(동행 스팟 연결)용 스팟 선택 목록 */
export async function listWayfinderSpotsForAdminTagLink(): Promise<AdminWayfinderSpotPickRow[]> {
    const scope = await resolveAdminScope("admin");
    const db = getDB();
    if (scope.actor.isPlatformAdmin || !scope.tenantIds || scope.tenantIds.length === 0) {
        const { results } = await db
            .prepare(
                `SELECT id, slug, title, tenant_id, is_published, subject_kind
                 FROM wayfinder_spots
                 ORDER BY datetime(updated_at) DESC
                 LIMIT ?`
            )
            .bind(WAYFINDER_SPOT_PICK_LIMIT)
            .all<{
                id: string;
                slug: string;
                title: string;
                tenant_id: string | null;
                is_published: number;
                subject_kind: string;
            }>();
        return results ?? [];
    }
    const ph = scope.tenantIds.map(() => "?").join(", ");
    const { results } = await db
        .prepare(
            `SELECT id, slug, title, tenant_id, is_published, subject_kind
             FROM wayfinder_spots
             WHERE tenant_id IN (${ph})
             ORDER BY datetime(updated_at) DESC
             LIMIT ?`
        )
        .bind(...scope.tenantIds, WAYFINDER_SPOT_PICK_LIMIT)
        .all<{
            id: string;
            slug: string;
            title: string;
            tenant_id: string | null;
            is_published: number;
            subject_kind: string;
        }>();
    return results ?? [];
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
    if (prep.warnings?.some((w) => w.code === "wayfinder_unpublished")) {
        const w = prep.warnings.find((x) => x.code === "wayfinder_unpublished");
        return {
            ok: false,
            error:
                `${w?.message ?? "동행 스팟이 미발행입니다."} 앱 핸드오프는 발행된 스팟만 지원합니다. 스팟을 발행하거나 Web NFC(확인 후 기록)를 사용하세요.`,
        };
    }
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
