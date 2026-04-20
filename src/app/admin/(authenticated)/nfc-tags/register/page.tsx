import { TagBulkRegisterCard } from "@/components/admin/tags/TagBulkRegisterCard";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";

export const runtime = "edge";

export default function AdminNfcTagsRegisterPage() {
  return (
    <div className="relative pb-20">
      <div className={adminUi.pageContainer}>
        <div className="mb-8 space-y-6">
          <AdminPageIntro
            title="① 태그 UID 등록"
            subtitle="모드별로 UID를 줄 단위로 입력해 인벤토리에 등록합니다. 이미 DB에 있는 UID는 건너뜁니다. 다음 단계는 실물 태그에 URL을 기록하는 화면입니다."
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
              { label: "UID 등록" },
            ]}
          />
          <div className="rounded-2xl border border-teal-100 bg-teal-50/50 px-4 py-3 text-[11px] font-bold text-teal-900 shadow-sm">
            팁: UID 자동 입력은 연속 스캔 도구를 사용할 수 있습니다. 등록 후{" "}
            <span className="font-black">URL 기록</span> 화면에서 Web NFC를 진행하세요.
          </div>
        </div>
        <TagBulkRegisterCard />
      </div>
    </div>
  );
}
