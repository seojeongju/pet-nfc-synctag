import { getTagOpsStats } from "@/app/actions/admin";
import { TagOpsKpiCards } from "@/components/admin/tags/TagOpsKpiCards";
import { adminUi } from "@/styles/admin/ui";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { cn } from "@/lib/utils";
import {
  AdminNfcQuickLinkGrid,
  AdminNfcStepBar,
} from "@/components/admin/nfc-tags/AdminNfcHubPanels";

export const runtime = "edge";

export default async function AdminNfcTagsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const sp = await searchParams;
  const tenantId = (sp.tenant ?? "").trim() || undefined;
  const opsStats = await getTagOpsStats(tenantId);

  return (
    <div className={cn("relative overflow-hidden", adminUi.pageBottomSafe)}>
      <div className="pointer-events-none absolute right-1/4 top-0 h-[320px] w-[320px] rounded-full bg-teal-500/8 blur-[100px]" />

      <div className={cn(adminUi.nfcTagsPageBody, "space-y-6")}>
        <AdminPageIntro
          title="태그"
          crumbs={[{ label: "관리자", href: "/admin" }, { label: "태그" }]}
        />

        <AdminNfcStepBar />
        <AdminNfcQuickLinkGrid />
        <TagOpsKpiCards opsStats={opsStats} />
      </div>
    </div>
  );
}
