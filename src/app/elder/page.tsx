import { getLandingSessionState } from "@/lib/landing-session";
import ModeGateLanding from "@/components/landing/ModeGateLanding";

export const runtime = "edge";

export default async function ElderModeLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { session, isAdmin } = await getLandingSessionState();
  const sp = await searchParams;
  return <ModeGateLanding kind="elder" session={session} isAdmin={isAdmin} fromHome={sp.from === "home"} />;
}
