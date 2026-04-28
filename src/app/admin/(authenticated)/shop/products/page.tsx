import Link from "next/link";
import { listAdminShopProducts } from "@/app/actions/admin-shop";
import { subjectKindMeta, SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function parseModes(json: string): SubjectKind[] {
  try {
    const v = JSON.parse(json) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x): x is SubjectKind => typeof x === "string" && (SUBJECT_KINDS as readonly string[]).includes(x)
    );
  } catch {
    return [];
  }
}

export default async function AdminShopProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  const sp = await searchParams;
  const products = await listAdminShopProducts();
  const ok = sp.ok === "1";
  const err = typeof sp.e === "string" ? decodeURIComponent(sp.e) : null;

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe)}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">Store · Products</p>
          <h1 className="text-2xl font-black text-slate-900">스토어 상품</h1>
          <p className="text-sm font-semibold text-slate-500">노출 모드·가격·활성을 설정합니다.</p>
        </div>
        <Link
          href="/admin/shop/products/new"
          className={cn(
            "inline-flex min-h-11 items-center justify-center rounded-2xl px-5 text-xs font-black text-white shadow-md",
            "bg-slate-900 hover:bg-teal-600 transition-colors"
          )}
        >
          새 상품
        </Link>
      </header>

      {ok ? (
        <p className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2 text-[12px] font-bold text-teal-800">
          저장되었습니다.
        </p>
      ) : null}
      {err ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-[12px] font-bold text-rose-800" role="alert">
          {err}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-md">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className={adminUi.tableHeadRow}>
              <th className={adminUi.tableHeadCell}>상품</th>
              <th className={adminUi.tableHeadCell}>슬러그</th>
              <th className={adminUi.tableHeadCell}>가격</th>
              <th className={adminUi.tableHeadCell}>모드</th>
              <th className={adminUi.tableHeadCell}>활성</th>
              <th className={adminUi.tableHeadCell} />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                  등록된 상품이 없습니다. &quot;새 상품&quot;으로 추가하세요.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const modes = parseModes(p.target_modes);
                const modeLabels = modes.map((m) => subjectKindMeta[m]?.label ?? m).join(", ");
                return (
                  <tr key={p.id} className={adminUi.tableRowHover}>
                    <td className={adminUi.tableBodyCellStrong}>
                      <span className="line-clamp-2">{p.name}</span>
                    </td>
                    <td className={adminUi.tableBodyCellMono}>{p.slug}</td>
                    <td className={adminUi.tableBodyCell}>
                      {new Intl.NumberFormat("ko-KR").format(p.price_krw)}원
                    </td>
                    <td className={adminUi.tableBodyCell}>
                      <span className="line-clamp-2 text-[10px] leading-snug">{modeLabels || "—"}</span>
                    </td>
                    <td className={adminUi.tableBodyCell}>
                      <span
                        className={cn(
                          "inline-block rounded-full border px-2 py-0.5 text-[10px] font-black",
                          p.active ? adminUi.successBadge : adminUi.neutralBadge
                        )}
                      >
                        {p.active ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td className={adminUi.tableBodyCell}>
                      <Link
                        href={`/admin/shop/products/${encodeURIComponent(p.id)}`}
                        className="text-[11px] font-black text-teal-700 underline-offset-2 hover:underline"
                      >
                        편집
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-center">
        <Link href="/admin/shop" className="text-[11px] font-black text-slate-500 hover:text-teal-700">
          ← 스토어 관리 홈
        </Link>
      </p>
    </div>
  );
}
