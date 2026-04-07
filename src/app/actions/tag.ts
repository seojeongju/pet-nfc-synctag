"use server";
import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";

function normalizeUid(uid: string): string {
    return uid.trim().toUpperCase();
}

function isValidUidFormat(uid: string): boolean {
    // 허용: HEX UID (예: 04:A1:B2:C3) 또는 영숫자 UID(8~32자)
    const hexWithColon = /^([0-9A-F]{2}:){3,15}[0-9A-F]{2}$/;
    const alnum = /^[A-Z0-9_-]{8,32}$/;
    return hexWithColon.test(uid) || alnum.test(uid);
}

async function getActorEmailSafe() {
    try {
        const context = getRequestContext();
        const auth = getAuth(context.env);
        const session = await auth.api.getSession({ headers: await headers() });
        return session?.user?.email ?? "system";
    } catch {
        return "system";
    }
}

export async function linkTag(petId: string, tagId: string) {
    const db = getDB();
    type ExistingTag = { id: string; status: string; pet_id?: string | null };
    const normalizedTagId = normalizeUid(tagId);

    if (!isValidUidFormat(normalizedTagId)) {
        throw new Error("UID 형식이 올바르지 않습니다. 태그 뒷면 UID를 다시 확인해 주세요.");
    }
    
    // 1. 관리자가 등록한 태그인지 확인 ('unsold' 상태여야 함)
    const existingTag = await db.prepare("SELECT id, status, pet_id FROM tags WHERE id = ?").bind(normalizedTagId).first<ExistingTag>();
    
    if (!existingTag) {
        throw new Error("등록되지 않은 정품 NFC 태그가 아닙니다. 관리자에게 문의하세요.");
    }

    if (existingTag.status === 'active' && existingTag.pet_id) {
        throw new Error("이미 다른 반려동물에게 연결된 태그입니다.");
    }
    
    // 2. 태그를 반려동물과 연결하고 상태를 'active'로 변경
    await db.prepare(`
        UPDATE tags 
        SET pet_id = ?, status = 'active', is_active = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `)
    .bind(petId, normalizedTagId)
    .run();

    // 3. 연결 이력 감사 로그 (추적/분석용)
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS tag_link_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag_id TEXT NOT NULL,
            pet_id TEXT NOT NULL,
            action TEXT NOT NULL, -- link | unlink
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
    await db.prepare(
        "INSERT INTO tag_link_logs (tag_id, pet_id, action) VALUES (?, ?, 'link')"
    ).bind(normalizedTagId, petId).run();
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
    ).bind("tag_link", await getActorEmailSafe(), JSON.stringify({ tagId: normalizedTagId, petId })).run();
    
    revalidatePath(`/profile/${petId}`);
    revalidatePath(`/dashboard`);
    revalidatePath(`/admin/tags`);
}

export async function unlinkTag(tagId: string) {
    const db = getDB();
    const normalizedTagId = normalizeUid(tagId);
    const existing = await db.prepare("SELECT pet_id FROM tags WHERE id = ?").bind(normalizedTagId).first<{ pet_id?: string | null }>();

    await db.prepare("UPDATE tags SET pet_id = NULL, is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(normalizedTagId)
        .run();

    if (existing?.pet_id) {
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS tag_link_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tag_id TEXT NOT NULL,
                pet_id TEXT NOT NULL,
                action TEXT NOT NULL, -- link | unlink
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
        await db.prepare(
            "INSERT INTO tag_link_logs (tag_id, pet_id, action) VALUES (?, ?, 'unlink')"
        ).bind(normalizedTagId, existing.pet_id).run();
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
        ).bind("tag_unlink", await getActorEmailSafe(), JSON.stringify({ tagId: normalizedTagId, petId: existing.pet_id })).run();
    }
        
    revalidatePath(`/dashboard`);
}

export async function getPetTags(petId: string) {
    const db = getDB();
    const { results } = await db.prepare("SELECT * FROM tags WHERE pet_id = ?")
        .bind(petId)
        .all();
    return results;
}
