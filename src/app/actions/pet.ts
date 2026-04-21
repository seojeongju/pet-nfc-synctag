"use server";
import { headers } from "next/headers";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { getDB, getR2 } from "@/lib/db";
import { nanoid } from "nanoid";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import { assertPersonalPetQuota, assertTenantPetQuota } from "@/lib/tenant-quota";
import { assertMigration0008Applied } from "@/lib/db-migration-0008";
import { assertTenantRole } from "@/lib/tenant-membership";
import { assertTenantActive } from "@/lib/tenant-status";

interface PetData {
    name: string;
    breed?: string;
    medical_info?: string;
    emergency_contact?: string;
    photo_url?: string;
    subject_kind?: SubjectKind;
    tenant_id?: string | null;
}

export type PetActionResult =
    | { ok: true; id?: string }
    | { ok: false; error: string };

async function requireActorUserId(): Promise<string> {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    const id = session?.user?.id;
    if (!id) throw new Error("로그인이 필요합니다.");
    return id;
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
    const actorId = await requireActorUserId();
    if (actorId !== ownerId) {
        throw new Error("다른 사용자의 프로필을 등록할 수 없습니다.");
    }

    const db = getDB();
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

    try {
        await db.prepare(
            "INSERT INTO pets (id, owner_id, tenant_id, name, breed, medical_info, emergency_contact, photo_url, subject_kind) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(id, ownerId, tenantId, data.name, data.breed, data.medical_info, data.emergency_contact, data.photo_url, kind)
        .run();
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("FOREIGN KEY constraint failed")) {
            const ownerRow = await db
                .prepare("SELECT id FROM user WHERE id = ?")
                .bind(ownerId)
                .first<{ id: string }>()
                .catch(() => null);
            if (!ownerRow?.id) {
                throw new Error("계정 정보가 유효하지 않습니다. 다시 로그인 후 시도해 주세요.");
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
            throw new Error("저장 중 참조 무결성 오류가 발생했습니다. 새로고침 후 다시 시도해 주세요.");
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
    const db = getDB();
    await assertMigration0008Applied(db);
    return await db.prepare("SELECT * FROM pets WHERE id = ?").bind(petId).first();
}

/** 실종 모드 토글 — 소유자만 호출 가능 */
export async function toggleLostMode(petId: string, isLost: boolean): Promise<void> {
    const actorId = await requireActorUserId();
    const db = getDB();
    await assertMigration0008Applied(db);

    // 소유자 또는 테넌트 어드민만 수정 가능
    const target = await db
        .prepare("SELECT owner_id, tenant_id FROM pets WHERE id = ?")
        .bind(petId)
        .first<{ owner_id: string; tenant_id: string | null }>();
    if (!target) throw new Error("반려동물을 찾을 수 없습니다.");

    if (target.tenant_id) {
        await assertTenantActive(db, target.tenant_id);
        await assertTenantRole(db, actorId, target.tenant_id, "admin");
    } else if (target.owner_id !== actorId) {
        throw new Error("수정 권한이 없습니다.");
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
        .prepare("SELECT owner_id, tenant_id FROM pets WHERE id = ?")
        .bind(petId)
        .first<{ owner_id: string; tenant_id: string | null }>();
    if (!target) {
        throw new Error("수정 대상이 존재하지 않습니다.");
    }

    if (target.tenant_id) {
        await assertTenantActive(db, target.tenant_id);
        await assertTenantRole(db, actorId, target.tenant_id, "admin");
    } else if (target.owner_id !== actorId) {
        throw new Error("수정 권한이 없습니다.");
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
    return pets.results.map(pet => {
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
}

