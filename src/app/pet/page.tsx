import { getLandingSessionState } from "@/lib/landing-session";
import ModeGateLanding from "@/components/landing/ModeGateLanding";

export const runtime = "edge";

export default async function PetModeLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { session, isAdmin } = await getLandingSessionState();
  const sp = await searchParams;
  return <ModeGateLanding kind="pet" session={session} isAdmin={isAdmin} fromHome={sp.from === "home"} />;
}
