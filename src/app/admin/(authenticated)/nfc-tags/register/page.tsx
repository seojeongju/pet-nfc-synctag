import { TagBulkRegisterCard } from "@/components/admin/tags/TagBulkRegisterCard";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";

export const runtime = "edge";

export default function AdminNfcTagsRegisterPage() {
  return (
    <div className="relative pb-20">
      <div className={adminUi.nfcTagsPageBody}>
        <div className="mb-8 space-y-6">
          <AdminPageIntro
            title="① 태그 UID 등록"
            subtitle="모드 선택 후 UID 입력·등록. 상세·NFC 환경은 상단 도움말을 확인하세요."
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
              { label: "UID 등록" },
            ]}
          />
        </div>
        <TagBulkRegisterCard />
      </div>
    </div>
  );
}
