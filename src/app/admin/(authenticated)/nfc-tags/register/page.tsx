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
            subtitle="범용 제품 NFC는 UID만 등록하고, 링크유-동행은 별도 탭에서 스팟·URL 규칙에 맞게 등록하세요. 사용 모드는 보호자가 연결할 때 선택합니다."
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
