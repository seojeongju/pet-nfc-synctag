import { TagBulkRegisterCard } from "@/components/admin/tags/TagBulkRegisterCard";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { cn } from "@/lib/utils";

export const runtime = "edge";

export default function AdminNfcTagsRegisterPage() {
  return (
    <div className={cn("relative", adminUi.pageBottomSafe)}>
      <div className={adminUi.nfcTagsPageBody}>
        <div className="mb-8 space-y-6">
          <AdminPageIntro
            title="① 태그 UID 등록"
            subtitle="모드 선택 후 UID를 붙여넣거나 NFC 스캔으로 추가하세요."
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
