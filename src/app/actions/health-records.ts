"use server";

import { headers } from "next/headers";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { nanoid } from "nanoid";
import {
  parseHealthRecordType,
  type HealthRecordType,
} from "@/lib/health-records-db";

/** 현재 로그인 사용자 ID 확인 */
async function requireActorUserId(): Promise<string> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const id = session?.user?.id;
  if (!id) throw new Error("로그인이 필요합니다.");
  return id;
}

/** 펫 소유자 검증 */
async function assertPetOwner(petId: string, actorId: string) {
  const db = getDB();
  const row = await db
    .prepare("SELECT owner_id FROM pets WHERE id = ?")
    .bind(petId)
    .first<{ owner_id: string }>();
  if (!row) throw new Error("반려동물을 찾을 수 없습니다.");
  if (row.owner_id !== actorId) throw new Error("수정 권한이 없습니다.");
}

/** 건강 기록 생성 */
export async function createHealthRecord(formData: FormData) {
  const actorId = await requireActorUserId();
  const petId = (formData.get("pet_id") as string | null)?.trim();
  const typeRaw = formData.get("type");
  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const recordDate = (formData.get("record_date") as string | null)?.trim();

  if (!petId || !title || !recordDate) throw new Error("필수 항목을 모두 입력해 주세요.");

  await assertPetOwner(petId, actorId);

  const type: HealthRecordType = parseHealthRecordType(typeRaw);
  const db = getDB();
  const id = nanoid();

  await db
    .prepare(
      `INSERT INTO health_records (id, pet_id, type, title, description, record_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, petId, type, title, description, recordDate)
    .run();
}

/** 건강 기록 삭제 */
export async function deleteHealthRecord(formData: FormData) {
  const actorId = await requireActorUserId();
  const id = (formData.get("id") as string | null)?.trim();
  if (!id) throw new Error("삭제할 기록 ID가 없습니다.");

  const db = getDB();
  // 기록 소유자 검증 (pet_id → owner_id 경유)
  const row = await db
    .prepare(
      `SELECT hr.pet_id, p.owner_id
       FROM health_records hr
       JOIN pets p ON p.id = hr.pet_id
       WHERE hr.id = ?`
    )
    .bind(id)
    .first<{ pet_id: string; owner_id: string }>();

  if (!row) throw new Error("기록을 찾을 수 없습니다.");
  if (row.owner_id !== actorId) throw new Error("삭제 권한이 없습니다.");

  await db.prepare("DELETE FROM health_records WHERE id = ?").bind(id).run();
}
