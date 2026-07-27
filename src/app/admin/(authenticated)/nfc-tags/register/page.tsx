import { TagBulkRegisterCard } from "@/components/admin/tags/TagBulkRegisterCard";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { cn } from "@/lib/utils";

export const runtime = "edge";

export default function AdminNfcTagsRegisterPage() {
  return (
    <div className={cn("relative", adminUi.pageBottomSafe)}>
      <div className={adminUi.nfcTagsPageBody}>
        <div className="mb-5">
          <AdminPageIntro
            title="태그 등록"
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "태그", href: "/admin/nfc-tags" },
              { label: "등록" },
            ]}
          />
        </div>
        <TagBulkRegisterCard />
      </div>
    </div>
  );
}
