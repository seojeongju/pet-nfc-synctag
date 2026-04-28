"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB } from "@/lib/db";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { createCatalog, updateCatalog, deleteCatalog, getCatalog, listCatalogs } from "@/lib/catalog";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

async function assertAdminRole(): Promise<void> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");

  const row = await getDB()
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();

  if (!isPlatformAdminRole(row?.role)) {
    throw new Error("플랫폼 관리자 권한이 없습니다.");
  }
}

export async function saveCatalogAction(formData: FormData) {
  await assertAdminRole();
  const db = getDB();

  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const mode = formData.get("mode") as string;
  const description = formData.get("description") as string;
  const productIds = JSON.parse(formData.get("productIds") as string || "[]");
  const config = JSON.parse(formData.get("config") as string || "{}");
  const isActive = formData.get("isActive") === "on";

  if (id) {
    await updateCatalog(db, id, { title, mode, description, productIds, config, isActive });
  } else {
    // 신규 생성 시에는 현재 운영자 계정이나 테넌트 정보를 넣을 수도 있음 (필요시 확장)
    await createCatalog(db, { title, mode, description, productIds, config });
  }

  revalidatePath("/admin/shop/catalogs");
  redirect("/admin/shop/catalogs");
}

export async function deleteCatalogAction(id: string) {
  await assertAdminRole();
  await deleteCatalog(getDB(), id);
  revalidatePath("/admin/shop/catalogs");
}

export async function getAdminCatalogs(filter: { tenantId?: string; userId?: string; mode?: string } = {}) {
  await assertAdminRole();
  return await listCatalogs(getDB(), filter);
}

export async function getAdminCatalog(id: string) {
  await assertAdminRole();
  return await getCatalog(getDB(), id);
}
