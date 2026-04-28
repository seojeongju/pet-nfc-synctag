import { listAdminShopProducts } from "@/app/actions/admin-shop";
import CatalogEditor from "@/components/admin/shop/CatalogEditor";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";

export default async function NewCatalogPage() {
  const products = await listAdminShopProducts();

  return (
    <div className={adminUi.pageContainer}>
      <AdminPageIntro 
        title="새 카달로그 생성" 
        subtitle="특정 테넌트나 모드에 최적화된 상품 목록을 구성합니다."
      />
      <CatalogEditor catalog={null} products={products} />
    </div>
  );
}
