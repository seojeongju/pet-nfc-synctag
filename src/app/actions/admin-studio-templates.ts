"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdminActor } from "@/lib/admin-authz";
import { getDB } from "@/lib/db";
import type { TagDesignSpec, TagMaterialId } from "@/lib/platform/tag-design";
import {
  createCustomTemplate,
  deleteCustomTemplate,
  setTemplateActive,
} from "@/lib/platform/tag-templates-store";

function revalidateStudioAdmin() {
  revalidatePath("/admin/platform/studio/templates");
  revalidatePath("/studio");
}

export async function createStudioTemplateAction(formData: FormData): Promise<void> {
  const actor = await requirePlatformAdminActor();
  const serviceId = String(formData.get("serviceId") ?? "");
  const formFactorId = String(formData.get("formFactorId") ?? "");
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  const previewHint = String(formData.get("previewHint") ?? "");
  const line1 = String(formData.get("line1") ?? "");
  const line2 = String(formData.get("line2") ?? "");
  const line3 = String(formData.get("line3") ?? "");
  const bodyColor = String(formData.get("bodyColor") ?? "#00A896");
  const textColor = String(formData.get("textColor") ?? "#FFFFFF");
  const materialId = String(formData.get("materialId") ?? "pla_matte") as TagMaterialId;
  const textStyle = String(formData.get("textStyle") ?? "raised") === "engraved" ? "engraved" : "raised";
  const sortOrder = Number(formData.get("sortOrder") ?? 100);

  const defaultSpec: Partial<TagDesignSpec> = {
    lines: [line1, line2, line3].filter((_, i) => i < 3),
    bodyColor,
    textColor,
    materialId,
    textStyle,
  };

  const res = await createCustomTemplate(getDB(), {
    serviceId,
    formFactorId,
    name,
    description,
    previewHint: previewHint || "커스텀",
    defaultSpec,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 100,
    createdBy: actor.userId,
  });
  if (!res.ok) throw new Error(res.error);
  revalidateStudioAdmin();
}

export async function toggleStudioTemplateActiveAction(formData: FormData): Promise<void> {
  await requirePlatformAdminActor();
  const id = String(formData.get("templateId") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  const res = await setTemplateActive(getDB(), id, active);
  if (!res.ok) throw new Error(res.error);
  revalidateStudioAdmin();
}

export async function deleteStudioTemplateAction(formData: FormData): Promise<void> {
  await requirePlatformAdminActor();
  const id = String(formData.get("templateId") ?? "");
  const res = await deleteCustomTemplate(getDB(), id);
  if (!res.ok) throw new Error(res.error);
  revalidateStudioAdmin();
}
