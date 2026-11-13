/**
 * 템플릿 조회·관리자 CRUD (D1). 테이블 미적용 시 builtin만 반환한다.
 */
import type { D1Database } from "@cloudflare/workers-types";
import { getFormFactor, type FormFactorId } from "@/lib/platform/form-factors";
import { getPlatformService, type PlatformServiceId } from "@/lib/platform/services";
import { buildSpecFromTemplatePartial, type TagDesignSpec } from "@/lib/platform/tag-design";
import {
  dbRowToTemplate,
  getBuiltinTemplate,
  listBuiltinTemplates,
  mergeTemplates,
  type DbTemplateRow,
  type TagDesignTemplate,
} from "@/lib/platform/tag-templates";

async function tableReady(db: D1Database): Promise<boolean> {
  try {
    await db.prepare("SELECT 1 FROM tag_design_templates LIMIT 1").first();
    return true;
  } catch {
    return false;
  }
}

export async function listTemplatesForService(
  db: D1Database | null | undefined,
  serviceId: PlatformServiceId
): Promise<TagDesignTemplate[]> {
  const builtin = listBuiltinTemplates(serviceId);
  if (!db || !(await tableReady(db))) return builtin;

  try {
    const { results } = await db
      .prepare(
        `SELECT id, service_id, form_factor_id, name, description, preview_hint, default_spec_json, sort_order, active
         FROM tag_design_templates WHERE service_id = ? AND active = 1 ORDER BY sort_order ASC, name ASC`
      )
      .bind(serviceId)
      .all<DbTemplateRow>();
    const custom = (results ?? []).map(dbRowToTemplate).filter((t): t is TagDesignTemplate => Boolean(t));
    return mergeTemplates(builtin, custom);
  } catch {
    return builtin;
  }
}

export async function resolveTemplate(
  db: D1Database | null | undefined,
  templateId: string
): Promise<TagDesignTemplate | null> {
  const builtin = getBuiltinTemplate(templateId);
  if (!db || !(await tableReady(db))) return builtin;

  try {
    const row = await db
      .prepare(
        `SELECT id, service_id, form_factor_id, name, description, preview_hint, default_spec_json, sort_order, active
         FROM tag_design_templates WHERE id = ?`
      )
      .bind(templateId)
      .first<DbTemplateRow>();
    if (row) {
      const t = dbRowToTemplate(row);
      if (t?.active) return t;
      return null;
    }
  } catch {
    /* fall through */
  }
  return builtin;
}

export function templateToInitialSpec(template: TagDesignTemplate): TagDesignSpec {
  return buildSpecFromTemplatePartial(template.defaultSpec, template.formFactorId, template.serviceId, template.id);
}

export async function listAllTemplatesForAdmin(db: D1Database): Promise<TagDesignTemplate[]> {
  const builtin = listBuiltinTemplates();
  if (!(await tableReady(db))) return builtin.map((t) => ({ ...t }));

  try {
    const { results } = await db
      .prepare(
        `SELECT id, service_id, form_factor_id, name, description, preview_hint, default_spec_json, sort_order, active
         FROM tag_design_templates ORDER BY service_id ASC, sort_order ASC, name ASC`
      )
      .all<DbTemplateRow>();
    const custom = (results ?? []).map(dbRowToTemplate).filter((t): t is TagDesignTemplate => Boolean(t));
    return mergeTemplates(builtin, custom, { includeInactive: true });
  } catch {
    return builtin;
  }
}

export type CreateTemplateInput = {
  id?: string;
  serviceId: string;
  formFactorId: string;
  name: string;
  description?: string;
  previewHint?: string;
  defaultSpec: Partial<TagDesignSpec>;
  sortOrder?: number;
  active?: boolean;
  createdBy?: string | null;
};

export async function createCustomTemplate(
  db: D1Database,
  input: CreateTemplateInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!(await tableReady(db))) {
    return { ok: false, error: "템플릿 테이블이 없습니다. 마이그레이션 0043을 적용해 주세요." };
  }
  const service = getPlatformService(input.serviceId);
  const formFactor = getFormFactor(input.formFactorId);
  if (!service || !formFactor) return { ok: false, error: "서비스 또는 태그 모양이 올바르지 않습니다." };
  if (!formFactor.allowedServices.includes(service.id)) {
    return { ok: false, error: "이 서비스에서 쓸 수 없는 태그 모양입니다." };
  }
  const name = input.name.trim().slice(0, 40);
  if (!name) return { ok: false, error: "템플릿 이름을 입력해 주세요." };

  const id = (input.id?.trim() || `tpl_c_${Date.now().toString(36)}`).slice(0, 64);
  if (getBuiltinTemplate(id)) {
    return { ok: false, error: "기본 템플릿 id와 겹칩니다. 다른 id를 사용해 주세요." };
  }

  const spec = buildSpecFromTemplatePartial(
    input.defaultSpec,
    formFactor.id as FormFactorId,
    service.id as PlatformServiceId,
    id
  );

  try {
    await db
      .prepare(
        `INSERT INTO tag_design_templates
         (id, service_id, form_factor_id, name, description, preview_hint, default_spec_json, sort_order, active, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        service.id,
        formFactor.id,
        name,
        (input.description ?? "").trim().slice(0, 200),
        (input.previewHint ?? "커스텀").trim().slice(0, 40),
        JSON.stringify(spec),
        input.sortOrder ?? 100,
        input.active === false ? 0 : 1,
        input.createdBy ?? null
      )
      .run();
    return { ok: true, id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/UNIQUE|unique|PRIMARY/i.test(msg)) return { ok: false, error: "이미 같은 id의 템플릿이 있습니다." };
    return { ok: false, error: msg };
  }
}

export async function setTemplateActive(
  db: D1Database,
  id: string,
  active: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getBuiltinTemplate(id)) {
    return { ok: false, error: "기본 템플릿은 비활성화할 수 없습니다." };
  }
  if (!(await tableReady(db))) {
    return { ok: false, error: "템플릿 테이블이 없습니다." };
  }
  const res = await db
    .prepare(`UPDATE tag_design_templates SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(active ? 1 : 0, id)
    .run();
  if (!res.meta.changes) return { ok: false, error: "템플릿을 찾을 수 없습니다." };
  return { ok: true };
}

export async function deleteCustomTemplate(
  db: D1Database,
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (getBuiltinTemplate(id)) {
    return { ok: false, error: "기본 템플릿은 삭제할 수 없습니다." };
  }
  if (!(await tableReady(db))) {
    return { ok: false, error: "템플릿 테이블이 없습니다." };
  }
  const res = await db.prepare(`DELETE FROM tag_design_templates WHERE id = ?`).bind(id).run();
  if (!res.meta.changes) return { ok: false, error: "템플릿을 찾을 수 없습니다." };
  return { ok: true };
}
