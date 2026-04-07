"use server";
import { getDB } from "@/lib/db";
import { revalidatePath } from "next/cache";

function normalizeUid(uid: string): string {
    return uid.trim().toUpperCase();
}

function isValidUidFormat(uid: string): boolean {
    const hexWithColon = /^([0-9A-F]{2}:){3,15}[0-9A-F]{2}$/;
    const alnum = /^[A-Z0-9_-]{8,32}$/;
    return hexWithColon.test(uid) || alnum.test(uid);
}

/**
 * NFC 태그를 시스템에 대량으로 미리 등록합니다 (관리자 전용)
 */
export async function registerBulkTags(uids: string[], batchId?: string) {
    const db = getDB();
    const currentBatch = batchId || `BATCH-${Date.now()}`;
    const normalizedUids = Array.from(
        new Set(uids.map(normalizeUid).filter(isValidUidFormat))
    );
    
    // 중복 제거 및 트랜잭션 처리 (D1 배치는 순차 처리 권장)
    const queries = normalizedUids.map(uid => 
        db.prepare("INSERT OR IGNORE INTO tags (id, status, batch_id) VALUES (?, 'unsold', ?)")
          .bind(uid, currentBatch)
    );
    
    await db.batch(queries);
    
    revalidatePath("/admin/tags");
    return { success: true, count: normalizedUids.length, batchId: currentBatch };
}

/**
 * 시스템의 모든 태그 현황을 조회합니다
 */
export async function getAllTags() {
    const db = getDB();
    const { results } = await db.prepare(`
        SELECT t.*, p.name as pet_name, u.email as owner_email
        FROM tags t
        LEFT JOIN pets p ON t.pet_id = p.id
        LEFT JOIN user u ON p.owner_id = u.id
        ORDER BY t.created_at DESC
    `).all();
    
    return results;
}

/**
 * 관리자 대시보드용 통계 데이터를 가져옵니다
 */
export async function getAdminStats() {
    const db = getDB();
    type CountRow = Record<string, number>;
    type BatchResult = { results: CountRow[] };
    
    const stats = await db.batch([
        db.prepare("SELECT count(*) as total FROM tags"),
        db.prepare("SELECT count(*) as active FROM tags WHERE status = 'active'"),
        db.prepare("SELECT count(*) as unsold FROM tags WHERE status = 'unsold'"),
        db.prepare("SELECT count(*) as total_users FROM user")
    ]) as BatchResult[];
    
    return {
        totalTags: stats[0].results[0].total,
        activeTags: stats[1].results[0].active,
        unsoldTags: stats[2].results[0].unsold,
        totalUsers: stats[3].results[0].total_users
    };
}
