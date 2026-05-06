"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { getDB, getR2 } from "@/lib/db";
import { getPetById } from "@/lib/pet-read";
import { nanoid } from "nanoid";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import { assertPersonalPetQuota, assertTenantPetQuota } from "@/lib/tenant-quota";
import { assertMigration0008Applied } from "@/lib/db-migration-0008";
import { assertTenantRole } from "@/lib/tenant-membership";
import { assertTenantActive } from "@/lib/tenant-status";
import { canUseModeFeature } from "@/lib/mode-visibility";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import type { D1Database } from "@cloudflare/workers-types";
import { enrichWithKakaoAddressLabels } from "@/lib/kakao-geocode";

interface PetData {
    name: string;
    breed?: string;
    medical_info?: string;
    emergency_contact?: string;
    photo_url?: string | null;
    subject_kind?: SubjectKind;
    tenant_id?: string | null;
}

export type PetActionResult =
    | { ok: true; id?: string }
    | { ok: false; error: string };

type ActorUser = {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    emailVerified?: boolean | number | null;
};

type ForeignKeyInfoRow = {
    table?: string | null;
    from?: string | null;
    to?: string | null;
};

function isSafeSqlIdent(input: string): boolean {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(input);
}

type PetOwnerRef = { table: string; column: string };

async function resolvePetOwnerReference(db: D1Database): Promise<PetOwnerRef> {
    const { results } = await db
        .prepare("PRAGMA foreign_key_list(pets)")
        .all<ForeignKeyInfoRow>()
        .catch(() => ({ results: [] as ForeignKeyInfoRow[] }));
    const fk = (results ?? []).find((r) => (r.from ?? "").trim() === "owner_id");
    const table = (fk?.table ?? "user").trim() || "user";
    const column = (fk?.to ?? "id").trim() || "id";
    return { table, column };
}

async function requireActorUserId(): Promise<string> {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    const id = session?.user?.id;
    if (!id) throw new Error("로그인이 필요합니다.");
    return id;
}

async function requireActorUser(): Promise<ActorUser> {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user?.id) throw new Error("로그인이 필요합니다.");
    return user as ActorUser;
}

async function resolveActorModePermission(
    db: D1Database,
    userId: string,
    subjectKind: SubjectKind,
    tenantId?: string | null
): Promise<boolean> {
    const roleRow = await db
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(userId)
        .first<{ role?: string | null }>();
    const isPlatformAdmin = isPlatformAdminRole(roleRow?.role);
    return canUseModeFeature(db, userId, subjectKind, { isPlatformAdmin, tenantId });
}

/**
 * 운영 중 user 레코드가 누락된 계정을 자동 복구합니다.
 * (세션은 유효하지만 user FK 대상이 없어 pets INSERT가 실패하는 경우 대응)
 */
async function ensureActorUserRow(
    db: D1Database,
    actor: ActorUser,
    ownerRef: PetOwnerRef
): Promise<void> {
    const table = ownerRef.table;
    const keyCol = ownerRef.column;
    if (!isSafeSqlIdent(table) || !isSafeSqlIdent(keyCol)) {
        throw new Error("DB 참조 스키마가 유효하지 않습니다. 관리자에게 문의해 주세요.");
    }

    const exists = await db
        .prepare(`SELECT 1 AS ok FROM ${table} WHERE ${keyCol} = ? LIMIT 1`)
        .bind(actor.id)
        .first<{ ok: number }>()
        .catch(() => null);
    if (exists?.ok) return;

    const email = (actor.email ?? "").trim().toLowerCase();
    const { results: cols } = await db
        .prepare(`PRAGMA table_info(${table})`)
        .all<{ name?: string }>()
        .catch(() => ({ results: [] as Array<{ name?: string }> }));
    const colSet = new Set((cols ?? []).map((c) => (c.name ?? "").trim()).filter(Boolean));

    const insertCols: string[] = [];
    const insertExprs: string[] = [];
    const insertVals: unknown[] = [];

    const pushBind = (col: string, val: unknown) => {
        if (!colSet.has(col)) return;
        insertCols.push(col);
        insertExprs.push("?");
        insertVals.push(val);
    };
    const pushExpr = (col: string, expr: string) => {
        if (!colSet.has(col)) return;
        insertCols.push(col);
        insertExprs.push(expr);
    };

    pushBind(keyCol, actor.id);
    if (keyCol !== "id") pushBind("id", actor.id);
    if (email) pushBind("email", email);
    pushBind("name", actor.name ?? null);
    pushBind("image", actor.image ?? null);
    if (colSet.has("emailVerified")) pushBind("emailVerified", actor.emailVerified ? 1 : 0);
    if (colSet.has("email_verified")) pushBind("email_verified", actor.emailVerified ? 1 : 0);
    pushExpr("createdAt", "CURRENT_TIMESTAMP");
    pushExpr("updatedAt", "CURRENT_TIMESTAMP");
    pushExpr("created_at", "CURRENT_TIMESTAMP");
    pushExpr("updated_at", "CURRENT_TIMESTAMP");

    if (insertCols.length === 0) {
        throw new Error(`계정 복구 실패: ${table}.${keyCol} 컬럼 구성을 확인해 주세요.`);
    }

    await db
        .prepare(`INSERT INTO ${table} (${insertCols.join(", ")}) VALUES (${insertExprs.join(", ")})`)
        .bind(...insertVals)
        .run()
        .catch((e) => {
            const msg = e instanceof Error ? e.message : String(e);
            throw new Error(`계정 복구 중 오류가 발생했습니다: ${msg}`);
        });
}

export async function uploadToR2(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) return null;

    const r2 = getR2();
    const key = `pets/${nanoid()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();

    await r2.put(key, arrayBuffer, {
        httpMetadata: { contentType: file.type }
    });

    return `/api/r2/${key}`;
}

export async function createPet(ownerId: string, data: PetData) {
    const actor = await requireActorUser();
    const actorId = actor.id;
    if (actorId !== ownerId) {
        throw new Error("다른 사용자의 프로필을 등록할 수 없습니다.");
    }

    const db = getDB();
    const ownerRef = await resolvePetOwnerReference(db);
    await ensureActorUserRow(db, actor, ownerRef);
    await assertMigration0008Applied(db);
    const tenantId = (data.tenant_id ?? "").trim() || null;
    if (tenantId) {
        await assertTenantActive(db, tenantId);
        await assertTenantRole(db, actorId, tenantId, "admin");
        await assertTenantPetQuota(db, tenantId);
    } else {
        await assertPersonalPetQuota(db, actorId);
    }

    const id = nanoid();
    const kind = parseSubjectKind(data.subject_kind);
    const mayUseFeature = await resolveActorModePermission(db, actorId, kind, tenantId);
    if (!mayUseFeature) {
        throw new Error("현재 모드에서는 등록 기능을 사용할 수 없습니다.");
    }
    const breed = data.breed ?? null;
    const medicalInfo = data.medical_info ?? null;
    const emergencyContact = data.emergency_contact ?? null;
    const photoUrl = data.photo_url ?? null;
    const insertValues: Record<string, string | null> = {
        owner_id: ownerId,
        tenant_id: tenantId,
    };

    try {
        await db.prepare(
            "INSERT INTO pets (id, owner_id, tenant_id, name, breed, medical_info, emergency_contact, photo_url, subject_kind) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(id, ownerId, tenantId, data.name, breed, medicalInfo, emergencyContact, photoUrl, kind)
        .run();
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("FOREIGN KEY constraint failed")) {
            const ownerRow = await db
                .prepare(`SELECT 1 AS ok FROM ${ownerRef.table} WHERE ${ownerRef.column} = ? LIMIT 1`)
                .bind(ownerId)
                .first<{ ok: number }>()
                .catch(() => null);
            if (!ownerRow?.ok) {
                throw new Error(
                    `계정 정보가 유효하지 않습니다. (${ownerRef.table}.${ownerRef.column}) 다시 로그인 후 시도해 주세요.`
                );
            }
            if (tenantId) {
                const tenantRow = await db
                    .prepare("SELECT id FROM tenants WHERE id = ?")
                    .bind(tenantId)
                    .first<{ id: string }>()
                    .catch(() => null);
                if (!tenantRow?.id) {
                    throw new Error("선택한 조직 정보가 유효하지 않습니다. 조직을 다시 선택해 주세요.");
                }
            }

            // DB 스키마가 환경별로 다를 수 있어, pets의 FK 정의를 직접 읽어 누락된 부모 키를 진단합니다.
            const { results: fkRows } = await db
                .prepare("PRAGMA foreign_key_list(pets)")
                .all<ForeignKeyInfoRow>()
                .catch(() => ({ results: [] as ForeignKeyInfoRow[] }));

            const missingRefs: Array<{ from: string; parent: string; parentCol: string; value: string }> = [];
            for (const fk of fkRows ?? []) {
                const from = (fk.from ?? "").trim();
                const parentTable = (fk.table ?? "").trim();
                const parentCol = (fk.to ?? "id").trim() || "id";
                if (!from || !parentTable || !parentCol) continue;
                if (!isSafeSqlIdent(parentTable) || !isSafeSqlIdent(parentCol)) continue;
                const value = insertValues[from];
                if (!value) continue;
                const parent = await db
                    .prepare(`SELECT 1 AS ok FROM ${parentTable} WHERE ${parentCol} = ? LIMIT 1`)
                    .bind(value)
                    .first<{ ok: number }>()
                    .catch(() => null);
                if (!parent?.ok) {
                    missingRefs.push({ from, parent: parentTable, parentCol, value });
                }
            }

            if (missingRefs.length > 0) {
                const detail = missingRefs
                    .map((v) => `${v.from} -> ${v.parent}.${v.parentCol}`)
                    .join(", ");
                throw new Error(`참조 데이터가 없습니다 (${detail}). 다시 로그인하거나 조직 선택을 확인해 주세요.`);
            }

            throw new Error("저장 중 참조 무결성 오류가 발생했습니다. 관리자에게 DB FK 구성을 확인해 달라고 요청해 주세요.");
        }
        throw error;
    }

    return id;
}

/**
 * 클라이언트에서 호출할 때 프로덕션에서 에러 메시지가 가려지는 문제를 피하기 위해
 * 결과 객체를 직접 반환합니다.
 */
export async function createPetSafe(ownerId: string, data: PetData): Promise<PetActionResult> {
    try {
        const id = await createPet(ownerId, data);
        return { ok: true, id };
    } catch (error: unknown) {
        const message =
            error instanceof Error && error.message
                ? error.message
                : "반려동물 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.";
        return { ok: false, error: message };
    }
}

export async function getPet(petId: string) {
    return getPetById(petId);
}

/** 실종 모드 토글 — 소유자만 호출 가능 */
export async function toggleLostMode(petId: string, isLost: boolean): Promise<void> {
    const actorId = await requireActorUserId();
    const db = getDB();
    await assertMigration0008Applied(db);

    // 소유자 또는 테넌트 어드민만 수정 가능
    const target = await db
        .prepare("SELECT owner_id, tenant_id, subject_kind FROM pets WHERE id = ?")
        .bind(petId)
        .first<{ owner_id: string; tenant_id: string | null; subject_kind: string | null }>();
    if (!target) throw new Error("반려동물을 찾을 수 없습니다.");

    if (target.tenant_id) {
        await assertTenantActive(db, target.tenant_id);
        await assertTenantRole(db, actorId, target.tenant_id, "admin");
    } else if (target.owner_id !== actorId) {
        throw new Error("수정 권한이 없습니다.");
    }
    const modeKind = parseSubjectKind(target.subject_kind);
    const mayUseFeature = await resolveActorModePermission(db, actorId, modeKind, target.tenant_id);
    if (!mayUseFeature) {
        throw new Error("현재 모드에서는 실종 모드 변경 기능을 사용할 수 없습니다.");
    }

    await db
        .prepare("UPDATE pets SET is_lost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(isLost ? 1 : 0, petId)
        .run();
}

export async function updatePet(petId: string, data: Partial<PetData>) {
    const actorId = await requireActorUserId();
    const db = getDB();
    await assertMigration0008Applied(db);

    const target = await db
        .prepare("SELECT owner_id, tenant_id, subject_kind FROM pets WHERE id = ?")
        .bind(petId)
        .first<{ owner_id: string; tenant_id: string | null; subject_kind: string | null }>();
    if (!target) {
        throw new Error("수정 대상이 존재하지 않습니다.");
    }

    if (target.tenant_id) {
        await assertTenantActive(db, target.tenant_id);
        await assertTenantRole(db, actorId, target.tenant_id, "admin");
    } else if (target.owner_id !== actorId) {
        throw new Error("수정 권한이 없습니다.");
    }
    const modeKind = parseSubjectKind(target.subject_kind);
    const mayUseFeature = await resolveActorModePermission(db, actorId, modeKind, target.tenant_id);
    if (!mayUseFeature) {
        throw new Error("현재 모드에서는 수정 기능을 사용할 수 없습니다.");
    }

    const payload: Partial<PetData> = { ...data };
    if (payload.subject_kind !== undefined) {
        payload.subject_kind = parseSubjectKind(payload.subject_kind);
    }

    const fields = (Object.keys(payload) as (keyof PetData)[]).filter(
        (k) => payload[k] !== undefined
    );
    if (fields.length === 0) return;

    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => payload[f]);

    await db.prepare(`UPDATE pets SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(...values, petId)
        .run();
}

export async function updatePetSafe(petId: string, data: Partial<PetData>): Promise<PetActionResult> {
    try {
        await updatePet(petId, data);
        return { ok: true };
    } catch (error: unknown) {
        const message =
            error instanceof Error && error.message
                ? error.message
                : "정보 수정에 실패했습니다. 잠시 후 다시 시도해 주세요.";
        return { ok: false, error: message };
    }
}

function extractR2KeyFromPhotoUrl(photoUrl?: string | null): string | null {
    if (!photoUrl) return null;
    const trimmed = photoUrl.trim();
    if (!trimmed) return null;

    const prefix = "/api/r2/";
    if (trimmed.startsWith(prefix)) {
        return trimmed.slice(prefix.length);
    }

    try {
        const parsed = new URL(trimmed);
        if (parsed.pathname.startsWith(prefix)) {
            return parsed.pathname.slice(prefix.length);
        }
    } catch {
        // URL 파싱 실패 시 R2 삭제를 생략합니다.
    }
    return null;
}

export async function deletePet(petId: string): Promise<void> {
    const actorId = await requireActorUserId();
    const db = getDB();
    await assertMigration0008Applied(db);

    const target = await db
        .prepare("SELECT owner_id, tenant_id, photo_url, subject_kind FROM pets WHERE id = ?")
        .bind(petId)
        .first<{ owner_id: string; tenant_id: string | null; photo_url: string | null; subject_kind: string | null }>();
    if (!target) {
        throw new Error("삭제 대상이 존재하지 않습니다.");
    }

    if (target.tenant_id) {
        await assertTenantActive(db, target.tenant_id);
        await assertTenantRole(db, actorId, target.tenant_id, "admin");
    } else if (target.owner_id !== actorId) {
        throw new Error("삭제 권한이 없습니다.");
    }
    const modeKind = parseSubjectKind(target.subject_kind);
    const mayUseFeature = await resolveActorModePermission(db, actorId, modeKind, target.tenant_id);
    if (!mayUseFeature) {
        throw new Error("현재 모드에서는 삭제 기능을 사용할 수 없습니다.");
    }

    const actorEmail = (await requireActorUser()).email ?? "system";

    const tagRows = await db
        .prepare("SELECT id FROM tags WHERE pet_id = ?")
        .bind(petId)
        .all<{ id: string }>();
    const releasedTagIds = (tagRows.results ?? []).map((r) => r.id).filter(Boolean);

    if (releasedTagIds.length > 0) {
        await db
            .prepare(
                `UPDATE tags
                 SET pet_id = NULL, tenant_id = NULL, is_active = 0, updated_at = CURRENT_TIMESTAMP
                 WHERE pet_id = ?`
            )
            .bind(petId)
            .run();

        await db.prepare(`
            CREATE TABLE IF NOT EXISTS tag_link_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tag_id TEXT NOT NULL,
                pet_id TEXT NOT NULL,
                action TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
        for (const tid of releasedTagIds) {
            await db
                .prepare("INSERT INTO tag_link_logs (tag_id, pet_id, action) VALUES (?, ?, 'unlink')")
                .bind(tid, petId)
                .run();
        }

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
                "tags_released_on_pet_delete",
                actorEmail,
                JSON.stringify({ petId, tagIds: releasedTagIds, actorId })
            )
            .run();

        revalidatePath(`/profile/${petId}`);
    }

    await db.prepare("DELETE FROM pets WHERE id = ?").bind(petId).run();

    const dashboardKind = target.subject_kind ? parseSubjectKind(target.subject_kind) : "pet";
    revalidatePath(`/dashboard`);
    revalidatePath(`/dashboard/${dashboardKind}/pets`);

    const photoKey = extractR2KeyFromPhotoUrl(target.photo_url);
    if (photoKey) {
        await getR2().delete(photoKey).catch(() => null);
    }
}

export async function deletePetSafe(petId: string): Promise<PetActionResult> {
    try {
        await deletePet(petId);
        return { ok: true };
    } catch (error: unknown) {
        const message =
            error instanceof Error && error.message
                ? error.message
                : "삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.";
        return { ok: false, error: message };
    }
}
export async function getLatestLocations(subjectKind: SubjectKind, tenantId?: string | null) {
    const actorId = await requireActorUserId();
    const db = getDB();
    
    // 1. 유효한 펫 목록 조회 (테넌트 필터 포함)
    const petsQuery = tenantId 
        ? db.prepare("SELECT id, name, photo_url, is_lost, breed FROM pets WHERE tenant_id = ? AND subject_kind = ?")
            .bind(tenantId, subjectKind)
        : db.prepare("SELECT id, name, photo_url, is_lost, breed FROM pets WHERE owner_id = ? AND tenant_id IS NULL AND subject_kind = ?")
            .bind(actorId, subjectKind);
            
    const pets = await petsQuery.all<{ id: string; name: string; photo_url: string | null; is_lost: number | null; breed: string | null }>();
    
    if (!pets.results || pets.results.length === 0) return [];

    const petIds = pets.results.map(p => p.id);
    
    interface LatestLocationRow {
        pet_id: string;
        latitude: number;
        longitude: number;
        timestamp: string;
        type: string;
    }

    // 2. 최신 스캔 로그 조회
    const latestScans = await db.prepare(`
        SELECT t.pet_id, s.latitude, s.longitude, s.scanned_at as timestamp, 'NFC 스캔' as type 
        FROM scan_logs s
        JOIN tags t ON s.tag_id = t.id
        WHERE t.pet_id IN (${petIds.map(() => "?").join(",")})
        GROUP BY t.pet_id
        HAVING s.scanned_at = MAX(s.scanned_at)
    `).bind(...petIds).all<LatestLocationRow>();

    // 3. 최신 BLE 이벤트 조회
    const latestBle = await db.prepare(`
        SELECT b.pet_id, b.latitude, b.longitude, b.created_at as timestamp, b.event_type as type
        FROM ble_location_events b
        WHERE b.pet_id IN (${petIds.map(() => "?").join(",")})
        GROUP BY b.pet_id
        HAVING b.created_at = MAX(b.created_at)
    `).bind(...petIds).all<LatestLocationRow>();

    // 4. 결과 병합 및 최신 선택
    const results = pets.results.map(pet => {
        const scan = latestScans.results?.find(s => s.pet_id === pet.id);
        const ble = latestBle.results?.find(b => b.pet_id === pet.id);
        
        let latest = null;
        if (scan && ble) {
            latest = new Date(scan.timestamp) > new Date(ble.timestamp) ? scan : ble;
        } else {
            latest = scan || ble;
        }

        return {
            ...pet,
            location: latest ? {
                lat: latest.latitude,
                lng: latest.longitude,
                timestamp: latest.timestamp,
                type: latest.type
            } : null
        };
    });

    // 5. 역지오코딩으로 주소 정보 추가
    // enrichWithKakaoAddressLabels는 { latitude, longitude } 형태를 기대하므로 변환 후 호출
    const locationsWithCoords = results
        .filter(r => r.location)
        .map(r => ({
            id: r.id,
            latitude: r.location!.lat,
            longitude: r.location!.lng
        }));
    
    const enriched = await enrichWithKakaoAddressLabels(locationsWithCoords);
    const addressMap = new Map(enriched.map(e => [e.id, e.addressLabel]));

    return results.map(r => ({
        ...r,
        location: r.location ? {
            ...r.location,
            addressLabel: addressMap.get(r.id) ?? null
        } : null
    }));
}

