"use server";

import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB } from "@/lib/db";
import { getFormFactor, type FormFactorId } from "@/lib/platform/form-factors";
import { getPlatformService, type PlatformServiceId } from "@/lib/platform/services";
import {
  defaultTagDesign,
  normalizeTagDesign,
  type TagDesignRecord,
  type TagDesignSpec,
  type TagDesignStatus,
} from "@/lib/platform/tag-design";

const MAX_DESIGNS_PER_USER = 50;
const MAX_TITLE_LENGTH = 40;

async function getActorId(): Promise<string | null> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

async function requireActorId(): Promise<string> {
  const id = await getActorId();
  if (!id) throw new Error("로그인이 필요합니다.");
  return id;
}

type TagDesignRow = {
  id: string;
  user_id: string;
  service_id: string;
  form_factor_id: string;
  title: string;
  design_json: string;
  status: string;
  updated_at: string;
};

function rowToRecord(row: TagDesignRow): TagDesignRecord {
  const serviceId = row.service_id as PlatformServiceId;
  const formFactorId = row.form_factor_id as FormFactorId;
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(row.design_json);
  } catch {
    parsed = null;
  }
  return {
    id: row.id,
    serviceId,
    formFactorId,
    title: row.title,
    spec: normalizeTagDesign(parsed, formFactorId, serviceId),
    status: row.status as TagDesignStatus,
    updatedAt: row.updated_at,
  };
}

/** 스튜디오 시작: 서비스·폼팩터로 새 초안을 만들고 에디터로 이동 (form action) */
export async function createTagDesignAction(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("serviceId") ?? "");
  const formFactorId = String(formData.get("formFactorId") ?? "");
  const userId = await getActorId();
  if (!userId) {
    const back = `/studio?service=${encodeURIComponent(serviceId)}&form=${encodeURIComponent(formFactorId)}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(back)}`);
  }

  const service = getPlatformService(serviceId);
  const formFactor = getFormFactor(formFactorId);
  if (!service || !formFactor || !formFactor.allowedServices.includes(service.id)) {
    throw new Error("서비스와 태그 모양 조합을 확인해 주세요.");
  }

  const db = getDB();
  const count = await db
    .prepare("SELECT COUNT(*) AS n FROM tag_designs WHERE user_id = ?")
    .bind(userId)
    .first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_DESIGNS_PER_USER) {
    throw new Error(`디자인은 최대 ${MAX_DESIGNS_PER_USER}개까지 저장할 수 있습니다. 사용하지 않는 디자인을 삭제해 주세요.`);
  }

  const id = `td_${nanoid(16)}`;
  const spec = defaultTagDesign(formFactor, service.id);
  await db
    .prepare(
      `INSERT INTO tag_designs (id, user_id, service_id, form_factor_id, title, design_json, status)
       VALUES (?, ?, ?, ?, ?, ?, 'draft')`
    )
    .bind(id, userId, service.id, formFactor.id, `${service.name} · ${formFactor.name}`, JSON.stringify(spec))
    .run();

  redirect(`/studio/${id}`);
}

export async function getMyTagDesign(designId: string): Promise<TagDesignRecord | null> {
  const userId = await requireActorId();
  const row = await getDB()
    .prepare(
      `SELECT id, user_id, service_id, form_factor_id, title, design_json, status, updated_at
       FROM tag_designs WHERE id = ? AND user_id = ?`
    )
    .bind(designId, userId)
    .first<TagDesignRow>();
  return row ? rowToRecord(row) : null;
}

export async function listMyTagDesigns(): Promise<TagDesignRecord[]> {
  const userId = await getActorId();
  if (!userId) return [];
  const { results } = await getDB()
    .prepare(
      `SELECT id, user_id, service_id, form_factor_id, title, design_json, status, updated_at
       FROM tag_designs WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?`
    )
    .bind(userId, MAX_DESIGNS_PER_USER)
    .all<TagDesignRow>();
  return (results ?? []).map(rowToRecord);
}

export async function saveTagDesign(input: {
  designId: string;
  title: string;
  spec: TagDesignSpec;
  markReady?: boolean;
}): Promise<{ ok: true; spec: TagDesignSpec; status: TagDesignStatus } | { ok: false; error: string }> {
  try {
    const userId = await requireActorId();
    const db = getDB();
    const row = await db
      .prepare("SELECT service_id, form_factor_id, status FROM tag_designs WHERE id = ? AND user_id = ?")
      .bind(input.designId, userId)
      .first<{ service_id: string; form_factor_id: string; status: string }>();
    if (!row) return { ok: false, error: "디자인을 찾을 수 없습니다." };
    if (row.status === "requested" || row.status === "locked") {
      return { ok: false, error: "제작 요청이 접수된 디자인은 수정할 수 없습니다." };
    }

    const spec = normalizeTagDesign(input.spec, row.form_factor_id as FormFactorId, row.service_id as PlatformServiceId);
    if (input.markReady && spec.lines.every((l) => !l.trim())) {
      return { ok: false, error: "태그에 넣을 문구를 한 줄 이상 입력해 주세요." };
    }
    const title = input.title.trim().slice(0, MAX_TITLE_LENGTH) || "내 태그 디자인";
    const status: TagDesignStatus = input.markReady ? "ready" : "draft";

    await db
      .prepare(
        `UPDATE tag_designs SET title = ?, design_json = ?, status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`
      )
      .bind(title, JSON.stringify(spec), status, input.designId, userId)
      .run();
    revalidatePath("/studio");
    return { ok: true, spec, status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "저장에 실패했습니다." };
  }
}

export async function deleteTagDesignAction(formData: FormData): Promise<void> {
  const userId = await requireActorId();
  const designId = String(formData.get("designId") ?? "");
  await getDB()
    .prepare("DELETE FROM tag_designs WHERE id = ? AND user_id = ? AND status IN ('draft','ready')")
    .bind(designId, userId)
    .run();
  revalidatePath("/studio");
}
