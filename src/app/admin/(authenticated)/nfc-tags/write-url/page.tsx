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
        <div className="mb-5">
          <AdminPageIntro
            title="URL 기록"
            crumbs={[
              { label: "관리자", href: "/admin" },
              { label: "태그", href: "/admin/nfc-tags" },
              { label: "기록" },
            ]}
            aside={
              <Link
                href="/admin/nfc-tags/history?action=nfc_web_write&days=7&success=all"
                prefetch={false}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-center text-xs font-black text-slate-700 shadow-sm touch-manipulation hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
              >
                감사 로그
              </Link>
            }
          />
        </div>
        <AdminNfcWriteCard />
      </div>
    </div>
  );
}
