import { AdminNfcWriteCard } from "@/components/admin/tags/AdminNfcWriteCard";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";

export const runtime = "edge";

export default function AdminNfcTagsWriteUrlPage() {
  return (
    <div className="relative pb-20">
      <div className={adminUi.pageContainer}>
        <div className="mb-8 space-y-6">
          <AdminPageIntro
            title="② 실물 태그 URL 기록 (Web NFC)"
            subtitle="등록된 태그 UID에 대해 NDEF URL(`앱주소/t/UID`)만 기록합니다. Android Chrome·HTTPS·사용자 제스처가 필요합니다. 기록 결과는 감사 로그에 남습니다."
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
              { label: "URL 기록" },
            ]}
          />
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-[11px] font-bold text-indigo-950 shadow-sm">
            이전 단계: UID가 인벤토리에 없으면 기록이 거절됩니다. 다음 단계: 인벤토리에서 상태를 확인하고 필요 시 재기록하세요.
          </div>
        </div>
        <AdminNfcWriteCard />
      </div>
    </div>
  );
}
