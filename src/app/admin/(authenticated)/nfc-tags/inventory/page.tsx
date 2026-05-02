import {
  getTagInventoryBatchOptions,
  getTagsInventoryPage,
  getTagBatchesPage,
} from "@/app/actions/admin";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { TagInventorySection } from "@/components/admin/tags/TagInventorySection";
import { adminUi } from "@/styles/admin/ui";
import type { TagsInventoryLinkFilter, TagsInventoryStatusFilter } from "@/types/admin-tags";
import { cn } from "@/lib/utils";

export const runtime = "edge";

type Search = {
  q?: string;
  status?: string;
  batch?: string;
  tenant?: string;
  page?: string;
  pageSize?: string;
  /** 배치 집계 페이징(자산 `page`와 별도) */
  bpage?: string;
  bpageSize?: string;
  /** 할당 모드 (assigned_subject_kind), `__unset__` = 미지정 */
  kind?: string;
  link?: string;
  reg_from?: string;
  reg_to?: string;
};

function parseStatus(raw: string | undefined): TagsInventoryStatusFilter {
  if (raw === "active" || raw === "unsold" || raw === "inactive") return raw;
  return "all";
}

function parseInventoryLink(raw: string | undefined): TagsInventoryLinkFilter {
  if (raw === "linked" || raw === "unlinked") return raw;
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
  const kind = (sp.kind ?? "").trim().slice(0, 40);
  const link = parseInventoryLink(sp.link);
  const regFrom = (sp.reg_from ?? "").trim();
  const regTo = (sp.reg_to ?? "").trim();
  const tenantId = (sp.tenant ?? "").trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  let pageSize = Number(sp.pageSize) || 20;
  if (!Number.isFinite(pageSize)) pageSize = 20;
  pageSize = Math.min(100, Math.max(10, Math.floor(pageSize)));

  const bpage = Math.max(1, Number(sp.bpage) || 1);
  let bpageSize = Number(sp.bpageSize) || 5;
  if (!Number.isFinite(bpageSize)) bpageSize = 5;
  bpageSize = Math.min(30, Math.max(3, Math.floor(bpageSize)));

  const [inventory, batchPage, batchOptions] = await Promise.all([
    getTagsInventoryPage({
      q,
      status,
      batch,
      tenantId,
      page,
      pageSize,
      kind: kind || undefined,
      link,
      regFrom: regFrom || undefined,
      regTo: regTo || undefined,
    }),
    getTagBatchesPage({ tenantId, page: bpage, pageSize: bpageSize }),
    getTagInventoryBatchOptions(tenantId),
  ]);

  return (
    <div className={cn("relative", adminUi.pageBottomSafe)}>
      <div className={adminUi.nfcTagsPageBody}>
        <div className="mb-8 space-y-6">
          <AdminPageIntro
            title="③ 태그 인벤토리"
            subtitle="UID·할당 모드·연결·등록일·재고·배치로 필터 가능. 쿼리: kind(모드), link(linked|unlinked), reg_from, reg_to. 자산=page·pageSize, 배치 통계=bpage·bpageSize."
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
          initialKind={kind}
          initialLink={link}
          initialRegFrom={regFrom}
          initialRegTo={regTo}
          tenantId={tenantId ?? null}
          batchOptions={batchOptions}
          batchPage={batchPage}
        />
      </div>
    </div>
  );
}
