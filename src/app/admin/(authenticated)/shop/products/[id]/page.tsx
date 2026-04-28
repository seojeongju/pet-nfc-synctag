import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminShopProduct } from "@/app/actions/admin-shop";
import { AdminShopProductForm } from "@/components/admin/shop/AdminShopProductForm";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AdminEditShopProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId || "").trim();
  if (!id) notFound();
  const product = await getAdminShopProduct(id);
  if (!product) notFound();

  const sp = await searchParams;
  const err = typeof sp.e === "string" ? decodeURIComponent(sp.e) : null;

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe)}>
      <header className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">Edit product</p>
        <h1 className="text-2xl font-black text-slate-900">상품 편집</h1>
        <p className="text-[11px] font-mono font-bold text-slate-400">ID: {product.id}</p>
      </header>

      {err ? (
        <p className="max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-[12px] font-bold text-rose-800" role="alert">
          {err}
        </p>
      ) : null}

      <AdminShopProductForm product={product} />

      <p>
        <Link href="/admin/shop/products" className="text-[11px] font-black text-slate-500 hover:text-teal-700">
          ← 상품 목록
        </Link>
      </p>
    </div>
  );
}
