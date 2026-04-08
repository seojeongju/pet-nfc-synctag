import { getLandingSessionState } from "@/lib/landing-session";
import ModeGateLanding from "@/components/landing/ModeGateLanding";

export const runtime = "edge";

export default async function GoldModeLandingPage() {
  const { session, isAdmin } = await getLandingSessionState();
  return <ModeGateLanding kind="gold" session={session} isAdmin={isAdmin} />;
}
