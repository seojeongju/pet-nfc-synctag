import type { D1Database } from "@cloudflare/workers-types";
import type { JewelryWarrantyRow } from "@/types/warranty";

export async function countActiveWarrantiesForPet(
  db: D1Database,
  petId: string
): Promise<number> {
  const r = await db
    .prepare(
      "SELECT COUNT(*) as c FROM jewelry_warranty_certificates WHERE pet_id = ? AND status = 'active'"
    )
    .bind(petId)
    .first<{ c: number }>();
  return Number(r?.c ?? 0);
}

export async function getActiveWarrantyByPetId(
  db: D1Database,
  petId: string
): Promise<JewelryWarrantyRow | null> {
  const row = await db
    .prepare(
      "SELECT * FROM jewelry_warranty_certificates WHERE pet_id = ? AND status = 'active' ORDER BY issued_at DESC LIMIT 1"
    )
    .bind(petId)
    .first<JewelryWarrantyRow>();
  return row ?? null;
}

export async function getWarrantyByIdForOwner(
  db: D1Database,
  id: string,
  ownerId: string
): Promise<JewelryWarrantyRow | null> {
  const row = await db
    .prepare("SELECT * FROM jewelry_warranty_certificates WHERE id = ? AND owner_id = ?")
    .bind(id, ownerId)
    .first<JewelryWarrantyRow>();
  return row ?? null;
}

export async function getWarrantyByPublicId(
  db: D1Database,
  publicVerifyId: string
): Promise<JewelryWarrantyRow | null> {
  const row = await db
    .prepare("SELECT * FROM jewelry_warranty_certificates WHERE public_verify_id = ?")
    .bind(publicVerifyId)
    .first<JewelryWarrantyRow>();
  return row ?? null;
}
