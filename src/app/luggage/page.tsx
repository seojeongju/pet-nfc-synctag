import { getLandingSessionState } from "@/lib/landing-session";
import ModeGateLanding from "@/components/landing/ModeGateLanding";

export const runtime = "edge";

export default async function LuggageModeLandingPage() {
  const { session, isAdmin } = await getLandingSessionState();
  return <ModeGateLanding kind="luggage" session={session} isAdmin={isAdmin} />;
}
