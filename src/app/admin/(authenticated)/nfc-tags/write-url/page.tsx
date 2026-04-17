import { AdminNfcWriteCard } from "@/components/admin/tags/AdminNfcWriteCard";
import { adminUi } from "@/styles/admin/ui";

export const runtime = "edge";

export default function AdminNfcTagsWriteUrlPage() {
  return (
    <div className="relative pb-20">
      <div className={adminUi.pageContainer}>
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">실물 태그에 URL 기록 (Web NFC)</h1>
          <p className="text-sm font-bold text-slate-500">
            등록된 태그 UID에 대해 NDEF URL(`앱주소/t/UID`)을 기록합니다. Android Chrome·HTTPS·사용자 제스처가 필요합니다.
          </p>
        </div>
        <AdminNfcWriteCard />
      </div>
    </div>
  );
}
