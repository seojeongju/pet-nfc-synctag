import {
  getTagInventoryBatchOptions,
  getTagsInventoryPage,
  getTagOpsStats,
} from "@/app/actions/admin";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { TagInventorySection } from "@/components/admin/tags/TagInventorySection";
import { adminUi } from "@/styles/admin/ui";
import type { TagsInventoryStatusFilter } from "@/types/admin-tags";
import { cn } from "@/lib/utils";

export const runtime = "edge";

type Search = {
  q?: string;
  status?: string;
  batch?: string;
  page?: string;
  pageSize?: string;
};

function parseStatus(raw: string | undefined): TagsInventoryStatusFilter {
  if (raw === "active" || raw === "unsold" || raw === "inactive") return raw;
  return "all";
}

export default async function AdminNfcTagsInventoryPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = parseStatus(sp.status);
  const batch = (sp.batch ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  let pageSize = Number(sp.pageSize) || 20;
  if (!Number.isFinite(pageSize)) pageSize = 20;
  pageSize = Math.min(100, Math.max(10, Math.floor(pageSize)));

  const [inventory, opsStats, batchOptions] = await Promise.all([
    getTagsInventoryPage({ q, status, batch, page, pageSize }),
    getTagOpsStats(),
    getTagInventoryBatchOptions(),
  ]);

  return (
    <div className={cn("relative", adminUi.pageBottomSafe)}>
      <div className={adminUi.nfcTagsPageBody}>
        <div className="mb-8 space-y-6">
          <AdminPageIntro
            title="③ 태그 인벤토리"
            subtitle="UID·모드·MAC·재고 등 마스터 데이터 관리. 검색·필터·페이지로 대량 목록을 다룹니다."
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
              { label: "인벤토리" },
            ]}
          />
        </div>
        <TagInventorySection
          tags={inventory.rows}
          total={inventory.total}
          page={inventory.page}
          pageSize={inventory.pageSize}
          initialQ={q}
          initialStatus={status}
          initialBatch={batch}
          batchOptions={batchOptions}
          opsStats={opsStats}
        />
      </div>
    </div>
  );
}
