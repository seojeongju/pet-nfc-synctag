"use server";
import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function linkTag(petId: string, tagId: string) {
    const db = getDB();
    
    // 1. 관리자가 등록한 태그인지 확인 ('unsold' 상태여야 함)
    const existingTag = await db.prepare("SELECT id, status FROM tags WHERE id = ?").bind(tagId).first() as any;
    
    if (!existingTag) {
        throw new Error("등록되지 않은 정품 NFC 태그가 아닙니다. 관리자에게 문의하세요.");
    }

    if (existingTag.status === 'active' && existingTag.pet_id) {
        // 이미 다른 아이에게 연결된 경우 (필요 시 체크)
        // throw new Error("이미 다른 반려동물에게 등록된 태그입니다.");
    }
    
    // 2. 태그를 반려동물과 연결하고 상태를 'active'로 변경
    await db.prepare(`
        UPDATE tags 
        SET pet_id = ?, status = 'active', is_active = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `)
    .bind(petId, tagId)
    .run();
    
    revalidatePath(`/profile/${petId}`);
    revalidatePath(`/dashboard`);
    revalidatePath(`/admin/tags`);
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
