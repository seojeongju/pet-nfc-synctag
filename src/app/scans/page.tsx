import { permanentRedirectToDashboardSubpath } from "@/lib/legacy-dashboard-redirect";

export const runtime = "edge";

export default async function LegacyScansPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await permanentRedirectToDashboardSubpath(searchParams, "scans");
}
