import { AdminNfcWriteCard } from "@/components/admin/tags/AdminNfcWriteCard";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const runtime = "edge";

export default function AdminNfcTagsWriteUrlPage() {
  return (
    <div className={cn("relative", adminUi.pageBottomSafe)}>
      <div className={adminUi.nfcTagsPageBody}>
        <div className="mb-6 space-y-4">
          <AdminPageIntro
            title="② URL 기록"
            subtitle="인벤토리에 있는 UID에만 공개 프로필 URL이 써집니다. Web NFC(Chrome)로 바로 쓰거나, 전용 앱(딥링크)로 같은 URL을 쓰면 감사 로그에도 남습니다. 아래 ‘가능’ 배지로 지금 기기·설정이 무엇을 지원하는지 먼저 확인하세요."
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "Pet-ID NFC", href: "/admin/nfc-tags" },
              { label: "URL 기록" },
            ]}
            aside={
              <Link
                href="/admin/nfc-tags/history?action=nfc_web_write&days=7&success=all"
                prefetch={false}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-center text-xs font-black text-slate-700 shadow-sm touch-manipulation hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
              >
                쓰기·앱 감사 로그
              </Link>
            }
          />
        </div>
        <AdminNfcWriteCard />
      </div>
    </div>
  );
}
