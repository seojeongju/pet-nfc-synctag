import type { D1Database } from "@cloudflare/workers-types";

export type HealthRecordType = "vaccine" | "medical" | "grooming" | "note";

export interface HealthRecord {
  id: string;
  pet_id: string;
  type: HealthRecordType;
  title: string;
  description: string | null;
  record_date: string;
  created_at: string;
}

/** 건강 기록 유형별 한국어 레이블 */
export const healthRecordTypeLabel: Record<HealthRecordType, string> = {
  vaccine: "예방접종",
  medical: "진료·치료",
  grooming: "미용·목욕",
  note: "메모",
};

/** 건강 기록 유형별 색상 (Tailwind 클래스) */
export const healthRecordTypeColor: Record<HealthRecordType, { bg: string; text: string; border: string }> = {
  vaccine: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  medical: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  grooming: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  note: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};

/** 유효한 HealthRecordType인지 검사 */
export function parseHealthRecordType(val: unknown): HealthRecordType {
  const valid: HealthRecordType[] = ["vaccine", "medical", "grooming", "note"];
  if (typeof val === "string" && (valid as string[]).includes(val)) {
    return val as HealthRecordType;
  }
  return "note";
}

/** 특정 펫의 건강 기록 전체 목록 (최신순) */
export async function listHealthRecordsForPet(
  db: D1Database,
  petId: string,
  limit = 50
): Promise<HealthRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT id, pet_id, type, title, description, record_date, created_at
       FROM health_records
       WHERE pet_id = ?
       ORDER BY record_date DESC, created_at DESC
       LIMIT ?`
    )
    .bind(petId, limit)
    .all<HealthRecord>();
  return results ?? [];
}

/** 최근 건강 기록 N건 (대시보드 요약용) */
export async function listRecentHealthRecordsForPet(
  db: D1Database,
  petId: string,
  limit = 3
): Promise<HealthRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT id, pet_id, type, title, description, record_date, created_at
       FROM health_records
       WHERE pet_id = ?
       ORDER BY record_date DESC, created_at DESC
       LIMIT ?`
    )
    .bind(petId, limit)
    .all<HealthRecord>();
  return results ?? [];
}

/** 건강 기록 단건 조회 */
export async function getHealthRecord(
  db: D1Database,
  id: string
): Promise<HealthRecord | null> {
  return db
    .prepare(
      `SELECT id, pet_id, type, title, description, record_date, created_at
       FROM health_records WHERE id = ?`
    )
    .bind(id)
    .first<HealthRecord>();
}
