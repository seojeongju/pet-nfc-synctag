"use server";
import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { parseSubjectKind } from "@/lib/subject-kind";
import { requireTenantMember } from "@/lib/tenant-membership";\nimport { assertTenantTagQuota } from "@/lib/tenant-quota";

function normalizeUid(uid: string): string {
    return uid.trim().toUpperCase();
}

function isValidUidFormat(uid: string): boolean {
    // ?덉슜: HEX UID (?? 04:A1:B2:C3) ?먮뒗 ?곸닽??UID(8~32??
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
        throw new Error("UID ?뺤떇???щ컮瑜댁? ?딆뒿?덈떎. ?쒓렇 ?룸㈃ UID瑜??ㅼ떆 ?뺤씤??二쇱꽭??");
    }
    
    // 1. 愿由ъ옄媛 ?깅줉???쒓렇?몄? ?뺤씤 ('unsold' ?곹깭?ъ빞 ??
    const existingTag = await db.prepare("SELECT id, status, pet_id FROM tags WHERE id = ?").bind(normalizedTagId).first<ExistingTag>();
    
    if (!existingTag) {
        throw new Error("?깅줉?섏? ?딆? ?뺥뭹 NFC ?쒓렇媛 ?꾨떃?덈떎. 愿由ъ옄?먭쾶 臾몄쓽?섏꽭??");
    }

    if (existingTag.status === 'active' && existingTag.pet_id) {
        throw new Error("?대? ?ㅻⅨ 諛섎젮?숇Ъ?먭쾶 ?곌껐???쒓렇?낅땲??");
    }
    
    const context = getRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) {
        throw new Error("濡쒓렇?몄씠 ?꾩슂?⑸땲??");
    }

    const petScope = await db
        .prepare("SELECT owner_id, tenant_id FROM pets WHERE id = ?")
        .bind(petId)
        .first<{ owner_id: string; tenant_id: string | null }>();
    if (!petScope || petScope.owner_id !== userId) {
        throw new Error("?대떦 愿由???곸뿉 ?곌껐??沅뚰븳???놁뒿?덈떎.");
    }
    if (petScope.tenant_id) {
        await requireTenantMember(db, userId, petScope.tenant_id);
    }

    // 2. ?쒓렇瑜?諛섎젮?숇Ъ怨??곌껐?섍퀬 ?곹깭瑜?'active'濡?蹂寃?    await db.prepare(`
        UPDATE tags 
        SET pet_id = ?, tenant_id = ?, status = 'active', is_active = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `)
    .bind(petId, petScope.tenant_id, normalizedTagId)
    .run();

    const modeRow = await db
      .prepare("SELECT assigned_subject_kind FROM tags WHERE id = ?")
      .bind(normalizedTagId)
      .first<{ assigned_subject_kind: string | null }>()
      .catch(() => null);
    if (modeRow?.assigned_subject_kind) {
      const k = parseSubjectKind(modeRow.assigned_subject_kind);
      await db
        .prepare("UPDATE pets SET subject_kind = ? WHERE id = ?")
        .bind(k, petId)
        .run()
        .catch(() => {});
    }

    // 3. ?곌껐 ?대젰 媛먯궗 濡쒓렇 (異붿쟻/遺꾩꽍??
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
    const context = getRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) {
        throw new Error("濡쒓렇?몄씠 ?꾩슂?⑸땲??");
    }

    const existing = await db
        .prepare(
            `SELECT t.pet_id AS pet_id, p.owner_id AS owner_id, p.tenant_id AS tenant_id
             FROM tags t
             LEFT JOIN pets p ON p.id = t.pet_id
             WHERE t.id = ?`
        )
        .bind(normalizedTagId)
        .first<{ pet_id?: string | null; owner_id?: string | null; tenant_id?: string | null }>();

    if (existing?.pet_id) {
        if (!existing.owner_id || existing.owner_id !== userId) {
            throw new Error("?대떦 ?쒓렇瑜??댁젣??沅뚰븳???놁뒿?덈떎.");
        }
        if (existing.tenant_id) {
            await requireTenantMember(db, userId, existing.tenant_id);
        }
    }

    await db.prepare("UPDATE tags SET pet_id = NULL, tenant_id = NULL, is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
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

export type PetTagRow = { id: string; is_active?: boolean };

/**
 * NFC 怨듦컻 吏꾩엯(?tag=) ??蹂댄샇??UI瑜????? ?몄뀡???ㅼ젣 ?뚯쑀?먯씤吏 寃利앺븳 ???쒓렇 紐⑸줉留?諛섑솚
 */
export async function verifyOwnerAndLoadPetTags(petId: string) {
    const context = getRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return { ok: false as const, error: "login_required" as const, tags: [] as PetTagRow[] };
    }
    const db = getDB();
    const pet = await db
        .prepare("SELECT owner_id FROM pets WHERE id = ?")
        .bind(petId)
        .first<{ owner_id: string }>();
    if (!pet || pet.owner_id !== session.user.id) {
        return { ok: false as const, error: "forbidden" as const, tags: [] as PetTagRow[] };
    }
    const { results } = await db.prepare("SELECT id, is_active FROM tags WHERE pet_id = ?").bind(petId).all<PetTagRow>();
    return { ok: true as const, tags: results ?? [] };
}

