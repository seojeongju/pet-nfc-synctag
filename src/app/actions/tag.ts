"use server";
import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const runtime = "edge";

export async function linkTag(petId: string, tagId: string) {
    const db = getDB();
    
    // 1. Check if tag exists or create it
    const existingTag = await db.prepare("SELECT id FROM tags WHERE id = ?").bind(tagId).first();
    
    if (!existingTag) {
        await db.prepare("INSERT INTO tags (id, pet_id, is_active) VALUES (?, ?, ?)")
            .bind(tagId, petId, 1)
            .run();
    } else {
        // 2. Link existing tag to this pet
        await db.prepare("UPDATE tags SET pet_id = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(petId, tagId)
            .run();
    }
    
    revalidatePath(`/profile/${petId}`);
    revalidatePath(`/dashboard`);
}

export async function unlinkTag(tagId: string) {
    const db = getDB();
    await db.prepare("UPDATE tags SET pet_id = NULL, is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(tagId)
        .run();
        
    revalidatePath(`/dashboard`);
}

export async function getPetTags(petId: string) {
    const db = getDB();
    const { results } = await db.prepare("SELECT * FROM tags WHERE pet_id = ?")
        .bind(petId)
        .all();
    return results;
}
