import { getLandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import ModeGateLanding from "@/components/landing/ModeGateLanding";

export const runtime = "edge";

export default async function LuggageModeLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { session, isAdmin } = await getLandingSessionState();
  const orgManageHref = await getOrgManageHrefForUser(session?.user?.id);
  const sp = await searchParams;
  return (
    <ModeGateLanding
      kind="luggage"
      session={session}
      isAdmin={isAdmin}
      fromHome={sp.from === "home"}
      orgManageHref={orgManageHref}
    />
  );
}
