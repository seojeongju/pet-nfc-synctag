import Link from "next/link";
import { saveShopProduct } from "@/app/actions/admin-shop";
import type { AdminShopProductRow } from "@/app/actions/admin-shop";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

function kindsChecked(row: AdminShopProductRow | null): Set<SubjectKind> {
  const s = new Set<SubjectKind>();
  if (!row?.target_modes) return s;
  try {
    const v = JSON.parse(String(row.target_modes)) as unknown;
    if (!Array.isArray(v)) return s;
    for (const x of v) {
      if (typeof x === "string" && (SUBJECT_KINDS as readonly string[]).includes(x)) {
        s.add(x as SubjectKind);
      }
    }
  } catch {
    /* ignore */
  }
  return s;
}

export function AdminShopProductForm({ product }: { product: AdminShopProductRow | null }) {
  const checked = kindsChecked(product);
  const isEdit = Boolean(product);

  return (
    <form action={saveShopProduct} className="max-w-2xl space-y-5">
      {isEdit ? <input type="hidden" name="id" value={product!.id} /> : null}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">슬러그 (URL)</label>
        <input
          name="slug"
          required
          defaultValue={product?.slug ?? ""}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          className={cn("w-full", adminUi.input, "h-11")}
          placeholder="pet-nfc-starter"
        />
        <p className="mt-1 text-[10px] font-semibold text-slate-400">영문 소문자, 숫자, 하이픈만. 예: my-product-name</p>
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">상품명</label>
        <input
          name="name"
          required
          defaultValue={product?.name ?? ""}
          className={cn("w-full", adminUi.input, "h-11")}
        />
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">설명</label>
        <textarea
          name="description"
          required
          rows={5}
          defaultValue={product?.description ?? ""}
          className={cn("w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20")}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">가격 (원)</label>
          <input
            name="price_krw"
            type="number"
            min={0}
            required
            defaultValue={product?.price_krw ?? 0}
            className={cn("w-full", adminUi.input, "h-11")}
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">정렬 (작을수록 앞)</label>
          <input
            name="sort_order"
            type="number"
            required
            defaultValue={product?.sort_order ?? 0}
            className={cn("w-full", adminUi.input, "h-11")}
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">노출 모드</label>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_KINDS.map((k) => (
            <label
              key={k}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 has-[:checked]:border-teal-300 has-[:checked]:bg-teal-50"
            >
              <input type="checkbox" name={`kind_${k}`} defaultChecked={checked.has(k)} className="rounded border-slate-300" />
              {subjectKindMeta[k].label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">이미지 URL (선택)</label>
        <input
          name="image_url"
          type="url"
          defaultValue={product?.image_url ?? ""}
          className={cn("w-full", adminUi.input, "h-11")}
          placeholder="https://"
        />
      </div>
      <label className="inline-flex items-center gap-2 text-[12px] font-black text-slate-800">
        <input type="checkbox" name="active" defaultChecked={product == null || product.active === 1} />
        판매·노출 활성
      </label>
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          className={cn("min-h-11 rounded-2xl px-6 text-xs font-black text-white shadow-lg", "bg-slate-900 hover:bg-teal-600 transition-colors")}
        >
          {isEdit ? "저장" : "상품 등록"}
        </button>
        <Link
          href="/admin/shop/products"
          className={cn("inline-flex min-h-11 items-center rounded-2xl border px-5 text-xs font-black", adminUi.outlineButton)}
        >
          목록
        </Link>
      </div>
    </form>
  );
}
