import { getAllTags, getTagOpsStats } from "@/app/actions/admin";
import type { AdminTag } from "@/types/admin-tags";
import { TagInventorySection } from "@/components/admin/tags/TagInventorySection";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { cn } from "@/lib/utils";

export const runtime = "edge";

export default async function AdminNfcTagsInventoryPage() {
  const [tags, opsStats] = await Promise.all([getAllTags(), getTagOpsStats()]);

  return (
    <div className={cn("relative", adminUi.pageBottomSafe)}>
      <div className={adminUi.nfcTagsPageBody}>
        <div className="mb-8 space-y-6">
          <AdminPageIntro
            title="③ 태그 인벤토리"
            subtitle="UID·모드·MAC·재고 등 마스터 데이터 관리. 상세는 도움말을 확인하세요."
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
              { label: "인벤토리" },
            ]}
          />
        </div>
        <TagInventorySection tags={tags as AdminTag[]} opsStats={opsStats} />
      </div>
    </div>
  );
}
