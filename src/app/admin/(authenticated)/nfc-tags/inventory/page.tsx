import { getAllTags, getTagOpsStats } from "@/app/actions/admin";
import type { AdminTag } from "@/types/admin-tags";
import { TagInventorySection } from "@/components/admin/tags/TagInventorySection";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";

export const runtime = "edge";

export default async function AdminNfcTagsInventoryPage() {
  const [tags, opsStats] = await Promise.all([getAllTags(), getTagOpsStats()]);

  return (
    <div className="relative pb-20">
      <div className={adminUi.pageContainer}>
        <div className="mb-8 space-y-6">
          <AdminPageIntro
            title="③ 태그 인벤토리"
            subtitle="마스터 데이터 목록에서 UID·제품·할당 모드·BLE MAC을 관리합니다. 재고와 활성 연결 상태를 여기서 점검한 뒤 필요하면 URL 기록 단계로 돌아가 재기록할 수 있습니다."
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
