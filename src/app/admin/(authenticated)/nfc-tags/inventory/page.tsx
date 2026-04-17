import { getAllTags, getTagOpsStats } from "@/app/actions/admin";
import type { AdminTag } from "@/types/admin-tags";
import { TagInventorySection } from "@/components/admin/tags/TagInventorySection";
import { adminUi } from "@/styles/admin/ui";

export const runtime = "edge";

export default async function AdminNfcTagsInventoryPage() {
  const [tags, opsStats] = await Promise.all([getAllTags(), getTagOpsStats()]);

  return (
    <div className="relative pb-20">
      <div className={adminUi.pageContainer}>
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">태그 인벤토리</h1>
          <p className="text-sm font-bold text-slate-500">마스터 데이터 목록에서 UID·제품·할당 모드·BLE MAC을 관리합니다.</p>
        </div>
        <TagInventorySection tags={tags as AdminTag[]} opsStats={opsStats} />
      </div>
    </div>
  );
}
