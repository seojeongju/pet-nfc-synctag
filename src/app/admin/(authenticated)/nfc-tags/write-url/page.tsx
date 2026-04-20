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
            subtitle="인벤토리에 등록된 UID만 NDEF URL(`앱주소/t/UID`)로 기록됩니다. Android Chrome·HTTPS·화면 탭(제스처)이 필요하고, 성공·실패는 감사 로그에 남습니다."
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
              { label: "URL 기록" },
            ]}
          />
          <p className="text-[11px] font-bold leading-relaxed text-slate-500 border-l-2 border-teal-400 pl-3">
            미등록 UID는 기록이 거절됩니다. 완료 후에는 인벤토리·연결·감사에서 상태를 확인하세요.
          </p>
        </div>
        <AdminNfcWriteCard />
      </div>
    </div>
  );
}
