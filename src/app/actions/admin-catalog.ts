"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDB } from "@/lib/db";
import { createCatalog, updateCatalog, deleteCatalog, getCatalog, listCatalogs } from "@/lib/catalog";
import { resolveAdminScope } from "@/lib/admin-authz";

async function getCatalogScope(): Promise<{
  actorId: string;
  isPlatformAdmin: boolean;
  tenantId: string | null;
}> {
  const scope = await resolveAdminScope("admin");
  if (scope.actor.isPlatformAdmin) {
    return { actorId: scope.actor.userId, isPlatformAdmin: true, tenantId: null };
  }
  const tenantId = scope.tenantIds?.[0] ?? null;
  if (!tenantId) throw new Error("조직 관리자 권한이 없습니다.");
  return { actorId: scope.actor.userId, isPlatformAdmin: false, tenantId };
}

export async function saveCatalogAction(formData: FormData) {
  const scope = await getCatalogScope();
  const db = getDB();

  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const mode = formData.get("mode") as string;
  const description = formData.get("description") as string;
  const productIds = JSON.parse(formData.get("productIds") as string || "[]");
  const config = JSON.parse(formData.get("config") as string || "{}");
  const isActive = formData.get("isActive") === "on";

  if (id) {
    if (!scope.isPlatformAdmin) {
      const own = await db
        .prepare("SELECT id FROM shop_catalogs WHERE id = ? AND tenant_id = ? LIMIT 1")
        .bind(id, scope.tenantId)
        .first<{ id: string }>();
      if (!own?.id) throw new Error("해당 카탈로그를 수정할 권한이 없습니다.");
    }
    await updateCatalog(db, id, { title, mode, description, productIds, config, isActive });
  } else {
    await createCatalog(db, {
      title,
      mode,
      description,
      productIds,
      config,
      tenantId: scope.tenantId,
      userId: scope.actorId,
    });
  }

  revalidatePath("/admin/shop/catalogs");
  redirect("/admin/shop/catalogs");
}

export async function deleteCatalogAction(id: string) {
  const scope = await getCatalogScope();
  const db = getDB();
  if (!scope.isPlatformAdmin) {
    const own = await db
      .prepare("SELECT id FROM shop_catalogs WHERE id = ? AND tenant_id = ? LIMIT 1")
      .bind(id, scope.tenantId)
      .first<{ id: string }>();
    if (!own?.id) throw new Error("해당 카탈로그를 삭제할 권한이 없습니다.");
  }
  await deleteCatalog(getDB(), id);
  revalidatePath("/admin/shop/catalogs");
}

export async function getAdminCatalogs(filter: { tenantId?: string; userId?: string; mode?: string } = {}) {
  const scope = await getCatalogScope();
  if (scope.isPlatformAdmin) {
    return await listCatalogs(getDB(), filter);
  }
  return await listCatalogs(getDB(), { ...filter, tenantId: scope.tenantId ?? undefined });
}

export async function getAdminCatalog(id: string) {
  const scope = await getCatalogScope();
  const catalog = await getCatalog(getDB(), id);
  if (!catalog) return null;
  if (scope.isPlatformAdmin) return catalog;
  if (catalog.tenantId && catalog.tenantId === scope.tenantId) return catalog;
  throw new Error("해당 카탈로그를 조회할 권한이 없습니다.");
}
