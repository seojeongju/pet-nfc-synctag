import { getTagOpsStats } from "@/app/actions/admin";
import { TagOpsKpiCards } from "@/components/admin/tags/TagOpsKpiCards";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import {
  AdminNfcHelpCallout,
  AdminNfcWorkflowColumn,
  AdminNfcQuickLinkGrid,
} from "@/components/admin/nfc-tags/AdminNfcHubPanels";

export const runtime = "edge";

export default async function AdminNfcTagsOverviewPage() {
  const opsStats = await getTagOpsStats();

  return (
    <div className="relative overflow-hidden pb-24">
      <div className="pointer-events-none absolute right-1/4 top-0 h-[420px] w-[420px] rounded-full bg-teal-500/10 blur-[110px]" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-[320px] w-[320px] rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className={adminUi.nfcTagsPageBody}>
        <AdminPageIntro
          title="Pet-ID NFC 허브"
          subtitle="요약 지표와 빠른 이동, 표준 순서 체크리스트가 한 화면에 모입니다."
          crumbs={[{ label: "관리자", href: "/admin" }, { label: "Pet-ID NFC" }]}
        />

        <TagOpsKpiCards opsStats={opsStats} />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,22rem)] xl:items-start">
          <div className="space-y-6">
            <AdminNfcQuickLinkGrid />
            <AdminNfcHelpCallout />
          </div>
          <AdminNfcWorkflowColumn />
        </div>
      </div>
    </div>
  );
}
