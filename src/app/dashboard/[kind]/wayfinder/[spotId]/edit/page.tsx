import { redirect } from "next/navigation";
import { legacyKindWayfinderSpotEditRedirectPath } from "@/lib/companion/dashboard-paths";

export const runtime = "edge";

/** @deprecated `/dashboard/companion/wayfinder/[spotId]/edit` 로 이동 */
export default async function LegacyKindWayfinderSpotEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; spotId: string }>;
  searchParams: Promise<{ tenant?: string; err?: string }>;
}) {
  const { spotId } = await params;
  const sp = await searchParams;
  redirect(
    legacyKindWayfinderSpotEditRedirectPath(spotId, {
      tenant: sp.tenant,
      err: sp.err,
    })
  );
}
