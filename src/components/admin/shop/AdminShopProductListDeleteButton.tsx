"use client";

import { deleteShopProduct } from "@/app/actions/admin-shop";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  productName: string;
};

export function AdminShopProductListDeleteButton({ productId, productName }: Props) {
  return (
    <form action={deleteShopProduct} className="w-full">
      <input type="hidden" name="product_id" value={productId} />
      <button
        type="submit"
        title="상품 삭제"
        aria-label={`${productName} 삭제`}
        onClick={(e) => {
          if (
            !confirm(
              `「${productName}」을(를) 삭제할까요?\n삭제 후에는 복구할 수 없으며, 주문 이력이 있는 상품은 삭제되지 않습니다.`
            )
          ) {
            e.preventDefault();
          }
        }}
        className={cn(
          "w-full flex items-center justify-center gap-2 h-11 rounded-[16px] border border-rose-100 bg-white text-[13px] font-black text-rose-600 transition-all hover:bg-rose-50 hover:border-rose-200 outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60 focus-visible:ring-offset-2"
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
        삭제
      </button>
    </form>
  );
}
