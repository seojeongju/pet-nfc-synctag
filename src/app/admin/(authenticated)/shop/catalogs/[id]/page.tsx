import { notFound } from "next/navigation";
import { getAdminCatalog } from "@/app/actions/admin-catalog";
import { listAdminShopProducts } from "@/app/actions/admin-shop";
import CatalogEditor from "@/components/admin/shop/CatalogEditor";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";

export default async function EditCatalogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [catalog, products] = await Promise.all([
    getAdminCatalog(id),
    listAdminShopProducts(),
  ]);

  if (!catalog) notFound();

  return (
    <div className={adminUi.pageContainer}>
      <AdminPageIntro 
        title="카달로그 편집" 
        subtitle={`'${catalog.title}' 카달로그의 구성 및 설정을 변경합니다.`}
      />
      <CatalogEditor catalog={catalog} products={products} />
    </div>
  );
}
