import { getLandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import ModeGateLanding from "@/components/landing/ModeGateLanding";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildModeMetadata, buildModePageJsonLd } from "@/lib/seo";

export const runtime = "edge";
export const metadata = buildModeMetadata("pet");

export default async function PetModeLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { session, isAdmin } = await getLandingSessionState();
  const orgManageHref = await getOrgManageHrefForUser(session?.user?.id);
  const sp = await searchParams;
  return (
    <>
      <JsonLd data={buildModePageJsonLd("pet")} />
      <ModeGateLanding
        kind="pet"
        session={session}
        isAdmin={isAdmin}
        fromHome={sp.from === "home"}
        orgManageHref={orgManageHref}
      />
    </>
  );
}
