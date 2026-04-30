import { getDB } from "@/lib/db";
import { assertMigration0008Applied } from "@/lib/db-migration-0008";

/**
 * RSC·메타데이터용 조회(읽기 전용). "use server" 액션 모듈에 묶이지 않도록 분리.
 */
export async function getPetById(petId: string) {
  const db = getDB();
  await assertMigration0008Applied(db);
  return await db.prepare("SELECT * FROM pets WHERE id = ?").bind(petId).first();
}
