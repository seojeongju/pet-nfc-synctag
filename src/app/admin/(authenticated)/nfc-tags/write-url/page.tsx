import { AdminNfcWriteCard } from "@/components/admin/tags/AdminNfcWriteCard";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";

export const runtime = "edge";

export default function AdminNfcTagsWriteUrlPage() {
  return (
    <div className="relative pb-20">
      <div className={adminUi.nfcTagsPageBody}>
        <div className="mb-6 space-y-4">
          <AdminPageIntro
            title="② URL 기록 (Web NFC)"
            subtitle="등록된 UID만 URL 기록 가능. 브라우저·NDEF 요건은 상단 도움말을 확인하세요."
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
