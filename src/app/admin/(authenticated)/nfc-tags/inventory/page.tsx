import {
  getTagInventoryBatchOptions,
  getTagsInventoryPage,
  getTagBatchesPage,
  listWayfinderSpotsForAdminTagLink,
} from "@/app/actions/admin";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { TagInventorySection } from "@/components/admin/tags/TagInventorySection";
import { adminUi } from "@/styles/admin/ui";
import type {
  TagsInventoryBleFilter,
  TagsInventoryLinkFilter,
  TagsInventoryStatusFilter,
  TagsInventoryWayfinderFilter,
} from "@/types/admin-tags";
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
  /** 동행 스팟 연결: wf=linked|unlinked */
  wf?: string;
  /** BLE MAC: ble=set|unset */
  ble?: string;
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

function parseInventoryWayfinder(raw: string | undefined): TagsInventoryWayfinderFilter {
  if (raw === "linked" || raw === "unlinked") return raw;
  return "all";
}

function parseInventoryBle(raw: string | undefined): TagsInventoryBleFilter {
  if (raw === "set" || raw === "unset") return raw;
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
  const wf = parseInventoryWayfinder(sp.wf);
  const ble = parseInventoryBle(sp.ble);
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

  const [inventory, batchPage, batchOptions, wayfinderSpotOptions] = await Promise.all([
    getTagsInventoryPage({
      q,
      status,
      batch,
      tenantId,
      page,
      pageSize,
      kind: kind || undefined,
      link,
      wf,
      ble,
      regFrom: regFrom || undefined,
      regTo: regTo || undefined,
    }),
    getTagBatchesPage({ tenantId, page: bpage, pageSize: bpageSize }),
    getTagInventoryBatchOptions(tenantId),
    listWayfinderSpotsForAdminTagLink(),
  ]);

  return (
    <div className={cn("relative", adminUi.pageBottomSafe)}>
      <div className={adminUi.nfcTagsPageBody}>
        <div className="mb-8 space-y-6">
          <AdminPageIntro
            title="인벤토리"
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "태그", href: "/admin/nfc-tags" },
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
          initialWf={wf}
          initialBle={ble}
          initialRegFrom={regFrom}
          initialRegTo={regTo}
          tenantId={tenantId ?? null}
          batchOptions={batchOptions}
          batchPage={batchPage}
          wayfinderSpotOptions={wayfinderSpotOptions}
        />
      </div>
    </div>
  );
}
