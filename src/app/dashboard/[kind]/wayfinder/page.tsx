import { redirect } from "next/navigation";
import { legacyKindWayfinderRedirectPath } from "@/lib/companion/dashboard-paths";

export const runtime = "edge";

/** @deprecated `/dashboard/companion/wayfinder` 로 이동 */
export default async function LegacyKindWayfinderPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ tenant?: string; err?: string; register?: string }>;
}) {
  const { kind } = await params;
  const sp = await searchParams;
  redirect(
    legacyKindWayfinderRedirectPath(kind, {
      tenant: sp.tenant,
      err: sp.err,
      register: sp.register,
    })
  );
}
