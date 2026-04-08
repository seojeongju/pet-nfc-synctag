import { getLandingSessionState } from "@/lib/landing-session";
import ModeGateLanding from "@/components/landing/ModeGateLanding";

export const runtime = "edge";

export default async function GoldModeLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { session, isAdmin } = await getLandingSessionState();
  const sp = await searchParams;
  return <ModeGateLanding kind="gold" session={session} isAdmin={isAdmin} fromHome={sp.from === "home"} />;
}
