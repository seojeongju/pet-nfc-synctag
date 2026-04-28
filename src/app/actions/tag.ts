"use server";
import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { parseSubjectKind } from "@/lib/subject-kind";
import { assertTenantRole } from "@/lib/tenant-membership";
import { assertTenantTagQuota } from "@/lib/tenant-quota";
import { assertMigration0008Applied } from "@/lib/db-migration-0008";
import { assertTenantActive } from "@/lib/tenant-status";
import { isValidTagUidFormat, normalizeTagUid } from "@/lib/tag-uid-format";
import { mintNativeHandoffToken } from "@/lib/nfc-native-security";
import { canUseModeFeature } from "@/lib/mode-visibility";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import type { SubjectKind } from "@/lib/subject-kind";

export type TagActionResult =
    | { ok: true }
    | { ok: false; error: string };

async function requireActor(): Promise<{ userId: string; email: string | null }> {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    if (!userId) throw new Error("로그인이 필요합니다.");
    return { userId, email: session.user.email ?? null };
}

async function getActorEmailSafe() {
    try {
        const actor = await requireActor();
        return actor.email ?? "system";
    } catch {
        return "system";
    }
}

async function resolveActorModePermission(
    userId: string,
    subjectKind: SubjectKind,
    tenantId?: string | null
): Promise<boolean> {
    const db = getDB();
    const roleRow = await db
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(userId)
        .first<{ role?: string | null }>();
    const isPlatformAdmin = isPlatformAdminRole(roleRow?.role);
    return canUseModeFeature(db, userId, subjectKind, { isPlatformAdmin, tenantId });
}

export async function linkTag(petId: string, tagId: string) {
    const db = getDB();
    await assertMigration0008Applied(db);
    type ExistingTag = { id: string; status: string; pet_id?: string | null };
    const normalizedTagId = normalizeTagUid(tagId);

    if (!isValidTagUidFormat(normalizedTagId)) {
        throw new Error("UID 형식이 올바르지 않습니다. 태그 뒷면 UID를 다시 확인해 주세요.");
    }

    const existingTag = await db
        .prepare("SELECT id, status, pet_id FROM tags WHERE id = ?")
        .bind(normalizedTagId)
        .first<ExistingTag>();

    if (!existingTag) {
        throw new Error("등록되지 않은 정품 NFC 태그가 아닙니다. 관리자에게 문의하세요.");
    }

    if (existingTag.status === "active" && existingTag.pet_id && existingTag.pet_id !== petId) {
        throw new Error("이미 다른 반려동물에게 연결된 태그입니다.");
    }

    const { userId } = await requireActor();

    const petScope = await db
        .prepare("SELECT owner_id, tenant_id, subject_kind FROM pets WHERE id = ?")
        .bind(petId)
        .first<{ owner_id: string; tenant_id: string | null; subject_kind: string | null }>();
    if (!petScope) {
        throw new Error("연결 대상이 존재하지 않습니다.");
    }

    if (petScope.tenant_id) {
        await assertTenantActive(db, petScope.tenant_id);
        await assertTenantRole(db, userId, petScope.tenant_id, "admin");
        await assertTenantTagQuota(db, petScope.tenant_id);
    } else if (petScope.owner_id !== userId) {
        throw new Error("해당 관리 대상에 연결할 권한이 없습니다.");
    }
    const petKind = parseSubjectKind(petScope.subject_kind);
    const mayUseFeature = await resolveActorModePermission(userId, petKind, petScope.tenant_id);
    if (!mayUseFeature) {
        throw new Error("현재 모드에서는 태그 연결 기능을 사용할 수 없습니다.");
    }

    // 같은 관리 대상에 이미 연결된 태그를 다시 스캔한 경우도 idempotent 하게 성공 처리합니다.
    await db.prepare(`
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

    await db.prepare(`
        CREATE TABLE IF NOT EXISTS tag_link_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tag_id TEXT NOT NULL,
            pet_id TEXT NOT NULL,
            action TEXT NOT NULL,
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
    const dashboardKind = petScope.subject_kind
        ? parseSubjectKind(petScope.subject_kind)
        : "pet";
    revalidatePath(`/dashboard/${dashboardKind}/pets/${petId}`);
    revalidatePath(`/admin/tags`);
    revalidatePath(`/admin/nfc-tags`);
}

export async function linkTagSafe(petId: string, tagId: string): Promise<TagActionResult> {
    try {
        await linkTag(petId, tagId);
        return { ok: true };
    } catch (error: unknown) {
        const message =
            error instanceof Error && error.message
                ? error.message
                : "NFC 태그 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.";
        console.error("[linkTagSafe] failed:", error);
        return { ok: false, error: message };
    }
}

export type PrepareGuardianNfcNativeHandoffResult =
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

export async function prepareGuardianNfcNativeHandoff(input: {
    petId: string;
    tagIdRaw: string;
}): Promise<PrepareGuardianNfcNativeHandoffResult> {
    const db = getDB();
    await assertMigration0008Applied(db);

    const { userId, email } = await requireActor();
    const petId = input.petId.trim();
    const tagId = normalizeTagUid(input.tagIdRaw);
    if (!petId) {
        return { ok: false, error: "연결 대상을 먼저 선택해 주세요." };
    }
    if (!isValidTagUidFormat(tagId)) {
        return { ok: false, error: "UID 형식이 올바르지 않습니다." };
    }

    const base =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim() ||
        "";
    if (!base) {
        return { ok: false, error: "NEXT_PUBLIC_APP_URL이 설정되지 않았습니다." };
    }
    const handoffSecret = process.env.NFC_NATIVE_HANDOFF_SECRET?.trim();
    if (!handoffSecret) {
        return { ok: false, error: "NFC_NATIVE_HANDOFF_SECRET이 설정되지 않았습니다." };
    }

    const petScope = await db
        .prepare("SELECT owner_id, tenant_id FROM pets WHERE id = ?")
        .bind(petId)
        .first<{ owner_id: string; tenant_id: string | null }>();
    if (!petScope) {
        return { ok: false, error: "연결 대상이 존재하지 않습니다." };
    }
    if (petScope.tenant_id) {
        await assertTenantActive(db, petScope.tenant_id);
        await assertTenantRole(db, userId, petScope.tenant_id, "admin");
    } else if (petScope.owner_id !== userId) {
        return { ok: false, error: "해당 관리 대상에 대한 권한이 없습니다." };
    }

    const linked = await db
        .prepare("SELECT id, pet_id FROM tags WHERE id = ?")
        .bind(tagId)
        .first<{ id: string; pet_id: string | null }>();
    if (!linked) {
        return { ok: false, error: "등록되지 않은 태그입니다. 먼저 태그를 연결해 주세요." };
    }
    if (linked.pet_id !== petId) {
        return { ok: false, error: "선택한 관리 대상에 연결된 태그가 아닙니다. 먼저 태그를 연결해 주세요." };
    }

    const url = `${base}/t/${encodeURIComponent(tagId)}`;
    const { token, expiresAt, jti } = await mintNativeHandoffToken({
        uid: tagId,
        url,
        expiresInSec: 10 * 60,
        secret: handoffSecret,
    });
    const params = new URLSearchParams({
        uid: tagId,
        url,
        handoffToken: token,
        exp: String(expiresAt),
    });
    const appLink = `petidconnect://nfc/write?${params.toString()}`;

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
            tagId,
            url,
            new Date(expiresAt * 1000).toISOString(),
            email ?? userId
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
        .prepare("INSERT INTO admin_action_logs (action, actor_email, success, payload) VALUES (?, ?, 1, ?)")
        .bind(
            "nfc_native_handoff",
            email ?? "system",
            JSON.stringify({
                source: "guardian_dashboard",
                petId,
                tagId,
                url,
                appLink,
                jti,
                expiresAt,
            })
        )
        .run();

    return {
        ok: true,
        tagId,
        url,
        appLink,
        handoffToken: token,
        expiresAt,
        jti,
    };
}

export async function unlinkTag(tagId: string) {
    const db = getDB();
    await assertMigration0008Applied(db);
    const normalizedTagId = normalizeTagUid(tagId);
    const { userId } = await requireActor();

    const existing = await db
        .prepare(
            `SELECT t.pet_id AS pet_id, p.owner_id AS owner_id, p.tenant_id AS tenant_id,
                    p.subject_kind AS subject_kind
             FROM tags t
             LEFT JOIN pets p ON p.id = t.pet_id
             WHERE t.id = ?`
        )
        .bind(normalizedTagId)
        .first<{
            pet_id?: string | null;
            owner_id?: string | null;
            tenant_id?: string | null;
            subject_kind?: string | null;
        }>();

    if (existing?.pet_id) {
        if (existing.tenant_id) {
            await assertTenantActive(db, existing.tenant_id);
            await assertTenantRole(db, userId, existing.tenant_id, "admin");
        } else if (!existing.owner_id || existing.owner_id !== userId) {
            throw new Error("해당 태그를 해제할 권한이 없습니다.");
        }
        const existingKind = parseSubjectKind(existing.subject_kind);
        const mayUseFeature = await resolveActorModePermission(userId, existingKind, existing.tenant_id);
        if (!mayUseFeature) {
            throw new Error("현재 모드에서는 태그 해제 기능을 사용할 수 없습니다.");
        }
    }

    await db.prepare("UPDATE tags SET pet_id = NULL, tenant_id = NULL, is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(normalizedTagId)
        .run();

    if (existing?.pet_id) {
        const unlinkedPetId = existing.pet_id;
        const dashboardKind = existing.subject_kind
            ? parseSubjectKind(existing.subject_kind)
            : "pet";
        revalidatePath(`/dashboard/${dashboardKind}/pets/${unlinkedPetId}`);
        revalidatePath(`/profile/${unlinkedPetId}`);
    }

    if (existing?.pet_id) {
        await db.prepare(`
            CREATE TABLE IF NOT EXISTS tag_link_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tag_id TEXT NOT NULL,
                pet_id TEXT NOT NULL,
                action TEXT NOT NULL,
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

export async function getPetTags(petId: string, tenantId?: string | null): Promise<PetTagRow[]> {
    const db = getDB();
    await assertMigration0008Applied(db);
    const tenant = (tenantId ?? "").trim();
    const query = tenant
        ? "SELECT t.id, t.is_active FROM tags t INNER JOIN pets p ON p.id = t.pet_id WHERE t.pet_id = ? AND p.tenant_id = ?"
        : "SELECT t.id, t.is_active FROM tags t INNER JOIN pets p ON p.id = t.pet_id WHERE t.pet_id = ? AND p.tenant_id IS NULL";
    const stmt = db.prepare(query);
    const { results } = await (tenant
        ? stmt.bind(petId, tenant)
        : stmt.bind(petId)
    ).all<PetTagRow>();
    return results ?? [];
}

export type PetTagRow = { id: string; is_active?: boolean };

export async function verifyOwnerAndLoadPetTags(petId: string, tenantId?: string | null) {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return { ok: false as const, error: "login_required" as const, tags: [] as PetTagRow[] };
    }
    const db = getDB();
    await assertMigration0008Applied(db);
    const tenant = (tenantId ?? "").trim();
    const pet = await db
        .prepare("SELECT owner_id, tenant_id FROM pets WHERE id = ?")
        .bind(petId)
        .first<{ owner_id: string; tenant_id?: string | null }>();
    if (!pet || pet.owner_id !== session.user.id) {
        return { ok: false as const, error: "forbidden" as const, tags: [] as PetTagRow[] };
    }
    const petTenant = (pet.tenant_id ?? "").trim();
    if (tenant !== petTenant) {
        return { ok: false as const, error: "forbidden" as const, tags: [] as PetTagRow[] };
    }
    const query = tenant
        ? "SELECT t.id, t.is_active FROM tags t INNER JOIN pets p ON p.id = t.pet_id WHERE t.pet_id = ? AND p.tenant_id = ?"
        : "SELECT t.id, t.is_active FROM tags t INNER JOIN pets p ON p.id = t.pet_id WHERE t.pet_id = ? AND p.tenant_id IS NULL";
    const stmt = db.prepare(query);
    const { results } = await (tenant
        ? stmt.bind(petId, tenant)
        : stmt.bind(petId)
    ).all<PetTagRow>();
    return { ok: true as const, tags: results ?? [] };
}



