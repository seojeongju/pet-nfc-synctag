import { AdminShopProductForm } from "@/components/admin/shop/AdminShopProductForm";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const runtime = "edge";

export default async function AdminNewShopProductPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const sp = await searchParams;
  const err = typeof sp.e === "string" ? decodeURIComponent(sp.e) : null;

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe)}>
      <header className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">New product</p>
        <h1 className="text-2xl font-black text-slate-900">새 상품</h1>
        <p className="text-sm font-semibold text-slate-500">슬러그는 이후 URL에 쓰이므로 바꾸기 어렵게 정하세요.</p>
      </header>

      {err ? (
        <p className="max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-[12px] font-bold text-rose-800" role="alert">
          {err}
        </p>
      ) : null}

      <AdminShopProductForm product={null} />

      <p>
        <Link href="/admin/shop/products" className="text-[11px] font-black text-slate-500 hover:text-teal-700">
          ← 상품 목록
        </Link>
      </p>
    </div>
  );
}
