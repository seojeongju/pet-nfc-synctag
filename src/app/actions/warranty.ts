"use server";

import { headers } from "next/headers";
import { customAlphabet, nanoid } from "nanoid";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { countActiveWarrantiesForPet } from "@/lib/jewelry-warranty-db";
import { parseSubjectKind } from "@/lib/subject-kind";
import type { JewelryWarrantyProductSnapshot } from "@/types/warranty";
import { canUseModeFeature } from "@/lib/mode-visibility";
import { isPlatformAdminRole } from "@/lib/platform-admin";

const certNoSuffix = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);

export type IssueJewelryWarrantyResult =
  | { ok: true; certificateId: string; certificateNo: string }
  | { ok: false; error: string };

const DEFAULT_ISSUER = "WOW3D PRO (주)와우쓰리디";
const PRODUCT_LINE = "링크유 골드";
const SCOPE =
  "제조·소재 결함에 한하며, 착용·충격·변형 등 소비자 과실로 인한 손상은 제외됩니다. 유효기간은 발급일로부터 1년입니다.";

function makeCertificateNo(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `LWG-${y}${m}${day}-${certNoSuffix()}`;
}

function addOneYearIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

async function requireUserId(): Promise<string> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const id = session?.user?.id;
  if (!id) throw new Error("로그인이 필요합니다.");
  return id;
}

/**
 * 링크유 골드(`subject_kind === 'gold'`) 관리 대상에 대해 전자 보증서 1건을 발급합니다.
 * 활성 보증서가 이미 있으면 발급하지 않습니다(재발급은 별도 정책).
 */
export async function issueJewelryWarrantyCertificate(
  petId: string,
  options?: { orderId?: string | null }
): Promise<IssueJewelryWarrantyResult> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const db = getDB();
  const pet = await db
    .prepare(
      "SELECT id, owner_id, name, breed, subject_kind FROM pets WHERE id = ?"
    )
    .bind(petId)
    .first<{
      id: string;
      owner_id: string;
      name: string;
      breed: string | null;
      subject_kind: string | null;
    }>();

  if (!pet) {
    return { ok: false, error: "관리 대상을 찾을 수 없어요." };
  }
  if (pet.owner_id !== userId) {
    return { ok: false, error: "권한이 없어요." };
  }
  if (parseSubjectKind(pet.subject_kind) !== "gold") {
    return { ok: false, error: "골드 모드에서만 보증서를 발급할 수 있어요." };
  }
  const roleRow = await db
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(userId)
    .first<{ role?: string | null }>();
  const isPlatformAdmin = isPlatformAdminRole(roleRow?.role);
  const mayUseFeature = await canUseModeFeature(db, userId, "gold", {
    isPlatformAdmin,
  });
  if (!mayUseFeature) {
    return { ok: false, error: "현재 계정은 골드 모드 기능을 사용할 수 없어요." };
  }

  const active = await countActiveWarrantiesForPet(db, petId);
  if (active > 0) {
    return { ok: false, error: "이미 유효한 보증서가 있어요. 추가 발급이 필요하면 고객센터로 문의해 주세요." };
  }

  const id = nanoid();
  const certificateNo = makeCertificateNo();
  const publicVerifyId = nanoid(18);
  const validUntil = addOneYearIso();
  const orderId =
    typeof options?.orderId === "string" && options.orderId.trim()
      ? options.orderId.trim()
      : null;

  const snapshot: JewelryWarrantyProductSnapshot = {
    issuerName: DEFAULT_ISSUER,
    productLine: PRODUCT_LINE,
    petName: pet.name,
    breed: pet.breed,
    orderId,
    warrantyScopeSummary: SCOPE,
  };
  const snapshotJson = JSON.stringify(snapshot);

  try {
    await db
      .prepare(
        `INSERT INTO jewelry_warranty_certificates (
          id, pet_id, owner_id, order_id, certificate_no, public_verify_id,
          issued_at, valid_until, product_snapshot_json, status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, 'active', datetime('now'))`
      )
      .bind(
        id,
        petId,
        userId,
        orderId,
        certificateNo,
        publicVerifyId,
        validUntil,
        snapshotJson
      )
      .run();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return { ok: false, error: "일시적 충돌이 있었어요. 잠시 후 다시 시도해 주세요." };
    }
    return { ok: false, error: "보증서를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  return { ok: true, certificateId: id, certificateNo };
}
