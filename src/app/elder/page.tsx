import { getLandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import ModeGateLanding from "@/components/landing/ModeGateLanding";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildModeMetadata, buildModePageJsonLd } from "@/lib/seo";

export const runtime = "edge";
export const metadata = buildModeMetadata("elder");

export default async function ElderModeLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { session, isAdmin } = await getLandingSessionState();
  const orgManageHref = await getOrgManageHrefForUser(session?.user?.id);
  const sp = await searchParams;
  return (
    <>
      <JsonLd data={buildModePageJsonLd("elder")} />
      <ModeGateLanding
        kind="elder"
        session={session}
        isAdmin={isAdmin}
        fromHome={sp.from === "home"}
        orgManageHref={orgManageHref}
      />
    </>
  );
}
