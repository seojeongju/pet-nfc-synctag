import { redirect } from "next/navigation";
import { companionWayfinderPath } from "@/lib/companion/dashboard-paths";

export const runtime = "edge";

/** 링크유-동행 대시보드 루트 → 스팟·설정 관리 화면 */
export default async function CompanionDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { tenant } = await searchParams;
  const tenantId = typeof tenant === "string" && tenant.trim() ? tenant.trim() : null;
  redirect(companionWayfinderPath(tenantId));
}
