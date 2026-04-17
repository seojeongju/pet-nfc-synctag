import { TagBulkRegisterCard } from "@/components/admin/tags/TagBulkRegisterCard";
import { adminUi } from "@/styles/admin/ui";

export const runtime = "edge";

export default function AdminNfcTagsRegisterPage() {
  return (
    <div className="relative pb-20">
      <div className={adminUi.pageContainer}>
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">태그 UID 등록</h1>
          <p className="text-sm font-bold text-slate-500">
            모드별로 UID를 줄 단위로 입력해 인벤토리에 등록합니다. 이미 DB에 있는 UID는 건너뜁니다.
          </p>
        </div>
        <TagBulkRegisterCard />
      </div>
    </div>
  );
}
