"use server";

import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB } from "@/lib/db";
import { getFormFactor, type FormFactorId } from "@/lib/platform/form-factors";
import { checkChipMargin } from "@/lib/platform/production-check";
import { getPlatformService, type PlatformServiceId } from "@/lib/platform/services";
import {
  defaultTagDesign,
  isAllowedStudioImageSrc,
  normalizeTagDesign,
  type TagDesignRecord,
  type TagDesignSpec,
  type TagDesignStatus,
} from "@/lib/platform/tag-design";
import { resolveTemplate, templateToInitialSpec } from "@/lib/platform/tag-templates-store";

const MAX_DESIGNS_PER_USER = 50;
const MAX_TITLE_LENGTH = 40;
const MAX_STUDIO_IMAGE_BYTES = 2 * 1024 * 1024;

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

/**
 * 템플릿으로 새 초안 생성 (권장 플로우).
 * form: serviceId, templateId
 */
export async function createTagDesignFromTemplateAction(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("serviceId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const userId = await getActorId();
  if (!userId) {
    const back = `/studio?service=${encodeURIComponent(serviceId)}&template=${encodeURIComponent(templateId)}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(back)}`);
  }

  const service = getPlatformService(serviceId);
  if (!service) throw new Error("서비스를 확인해 주세요.");

  const db = getDB();
  const template = await resolveTemplate(db, templateId);
  if (!template || template.serviceId !== service.id) {
    throw new Error("이 서비스에서 쓸 수 있는 템플릿이 아닙니다.");
  }
  const formFactor = getFormFactor(template.formFactorId);
  if (!formFactor || !formFactor.allowedServices.includes(service.id)) {
    throw new Error("서비스와 태그 모양 조합을 확인해 주세요.");
  }

  const count = await db
    .prepare("SELECT COUNT(*) AS n FROM tag_designs WHERE user_id = ?")
    .bind(userId)
    .first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_DESIGNS_PER_USER) {
    throw new Error(`디자인은 최대 ${MAX_DESIGNS_PER_USER}개까지 저장할 수 있습니다. 사용하지 않는 디자인을 삭제해 주세요.`);
  }

  const id = `td_${nanoid(16)}`;
  const spec = templateToInitialSpec(template);
  await db
    .prepare(
      `INSERT INTO tag_designs (id, user_id, service_id, form_factor_id, title, design_json, status)
       VALUES (?, ?, ?, ?, ?, ?, 'draft')`
    )
    .bind(id, userId, service.id, formFactor.id, template.name.slice(0, MAX_TITLE_LENGTH), JSON.stringify(spec))
    .run();

  redirect(`/studio/${id}`);
}

/** @deprecated 템플릿 플로우 권장. 폼팩터만으로 빈 초안 생성 (하위 호환) */
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
    if (input.markReady) {
      if (spec.lines.every((l) => !l.trim()) && !spec.image.src) {
        return { ok: false, error: "태그에 넣을 문구 또는 이미지를 추가해 주세요." };
      }
      const ff = getFormFactor(row.form_factor_id);
      const chipIssue = ff ? checkChipMargin(ff, spec) : null;
      if (chipIssue) return { ok: false, error: chipIssue.message };
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

/** 스튜디오 로고·사진 업로드 → R2 `/api/r2/studio/...` */
export async function uploadStudioImage(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const userId = await requireActorId();
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) {
      return { ok: false, error: "이미지 파일을 선택해 주세요." };
    }
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "이미지 파일만 업로드할 수 있습니다." };
    }
    if (file.size > MAX_STUDIO_IMAGE_BYTES) {
      return { ok: false, error: "이미지는 2MB 이하로 올려 주세요." };
    }

    const context = getCfRequestContext();
    const r2 = context.env.R2;
    const safeName = file.name.replace(/[^\w.\-]/g, "_").slice(0, 80) || "image";
    const key = `studio/${userId}/${nanoid(12)}-${safeName}`;
    await r2.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    const url = `/api/r2/${key}`;
    if (!isAllowedStudioImageSrc(url)) {
      return { ok: false, error: "업로드 경로가 올바르지 않습니다." };
    }
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "업로드에 실패했습니다." };
  }
}
