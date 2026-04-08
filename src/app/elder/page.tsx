import { getLandingSessionState } from "@/lib/landing-session";
import ModeGateLanding from "@/components/landing/ModeGateLanding";

export const runtime = "edge";

export default async function ElderModeLandingPage() {
  const { session, isAdmin } = await getLandingSessionState();
  return <ModeGateLanding kind="elder" session={session} isAdmin={isAdmin} />;
}
