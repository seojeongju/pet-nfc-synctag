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

    await db.prepare(
        "INSERT INTO pets (id, owner_id, tenant_id, name, breed, medical_info, emergency_contact, photo_url, subject_kind) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(id, ownerId, tenantId, data.name, data.breed, data.medical_info, data.emergency_contact, data.photo_url, kind)
    .run();

    return id;
}

export async function getPet(petId: string) {
    const db = getDB();
    await assertMigration0008Applied(db);
    return await db.prepare("SELECT * FROM pets WHERE id = ?").bind(petId).first();
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



