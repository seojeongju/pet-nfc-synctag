import { getLandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import ModeGateLanding from "@/components/landing/ModeGateLanding";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildModeMetadata, buildModePageJsonLd } from "@/lib/seo";

export const runtime = "edge";
export const metadata = buildModeMetadata("child");

export default async function ChildModeLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { session, isAdmin } = await getLandingSessionState();
  const orgManageHref = await getOrgManageHrefForUser(session?.user?.id);
  const sp = await searchParams;
  return (
    <>
      <JsonLd data={buildModePageJsonLd("child")} />
      <ModeGateLanding
        kind="child"
        session={session}
        isAdmin={isAdmin}
        fromHome={sp.from === "home"}
        orgManageHref={orgManageHref}
      />
    </>
  );
}
