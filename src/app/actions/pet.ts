"use server";
import { getDB, getR2 } from "@/lib/db";
import { nanoid } from "nanoid";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import { assertPersonalPetQuota, assertTenantPetQuota } from "@/lib/tenant-quota";
import { requireTenantMember } from "@/lib/tenant-membership";

interface PetData {
    name: string;
    breed?: string;
    medical_info?: string;
    emergency_contact?: string;
    photo_url?: string;
    subject_kind?: SubjectKind;
    tenant_id?: string | null;
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
    
    // Return the proxy API path and key
    return `/api/r2/${key}`;
}

export async function createPet(ownerId: string, data: PetData) {
    const db = getDB();
    const tenantId = (data.tenant_id ?? "").trim() || null;
    if (tenantId) {
        await requireTenantMember(db, ownerId, tenantId);
    } else {
        await assertPersonalPetQuota(db, ownerId);
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

export async function getPets(ownerId: string, subjectKind: SubjectKind = "pet", tenantId?: string) {
    const db = getDB();
    const kind = parseSubjectKind(subjectKind);
    const tenant = (tenantId ?? "").trim();
    const query = tenant
        ? "SELECT * FROM pets WHERE owner_id = ? AND tenant_id = ? AND COALESCE(subject_kind, 'pet') = ? ORDER BY created_at DESC"
        : "SELECT * FROM pets WHERE owner_id = ? AND tenant_id IS NULL AND COALESCE(subject_kind, 'pet') = ? ORDER BY created_at DESC";
    const stmt = db.prepare(query);
    const { results } = await (tenant
        ? stmt.bind(ownerId, tenant, kind)
        : stmt.bind(ownerId, kind))
        .all();
    return results;
}

export async function getPet(petId: string) {
    const db = getDB();
    return await db.prepare("SELECT * FROM pets WHERE id = ?").bind(petId).first();
}

export async function updatePet(petId: string, data: Partial<PetData>) {
    const db = getDB();
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

