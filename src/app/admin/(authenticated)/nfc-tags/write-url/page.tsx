import { AdminNfcWriteCard } from "@/components/admin/tags/AdminNfcWriteCard";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { cn } from "@/lib/utils";

export const runtime = "edge";

export default function AdminNfcTagsWriteUrlPage() {
  return (
    <div className={cn("relative", adminUi.pageBottomSafe)}>
      <div className={adminUi.nfcTagsPageBody}>
        <div className="mb-6 space-y-4">
          <AdminPageIntro
            title="② URL 기록 (Web NFC)"
            subtitle="표준 경로: Android Chrome + Web NFC. 등록된 UID만 기록되며, 브라우저 요건은 도움말을 확인하세요."
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
              { label: "URL 기록" },
            ]}
          />
        </div>
        <AdminNfcWriteCard />
      </div>
    </div>
  );
}
