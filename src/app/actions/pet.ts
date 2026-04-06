"use server";
import { getDB, getR2 } from "@/lib/db";
import { nanoid } from "nanoid";

interface PetData {
    name: string;
    breed?: string;
    medical_info?: string;
    emergency_contact?: string;
    photo_url?: string;
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
    const id = nanoid();
    
    await db.prepare(
        "INSERT INTO pets (id, owner_id, name, breed, medical_info, emergency_contact, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(id, ownerId, data.name, data.breed, data.medical_info, data.emergency_contact, data.photo_url)
    .run();
    
    return id;
}

export async function getPets(ownerId: string) {
    const db = getDB();
    const { results } = await db.prepare("SELECT * FROM pets WHERE owner_id = ? ORDER BY created_at DESC")
        .bind(ownerId)
        .all();
    return results;
}

export async function getPet(petId: string) {
    const db = getDB();
    return await db.prepare("SELECT * FROM pets WHERE id = ?").bind(petId).first();
}

export async function updatePet(petId: string, data: Partial<PetData>) {
    const db = getDB();
    const fields = Object.keys(data) as (keyof PetData)[];
    const setClause = fields.map(f => `${f} = ?`).join(", ");
    const values = fields.map(f => data[f]);
    
    await db.prepare(`UPDATE pets SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(...values, petId)
        .run();
}
