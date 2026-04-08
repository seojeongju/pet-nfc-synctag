import { getLandingSessionState } from "@/lib/landing-session";
import ModeGateLanding from "@/components/landing/ModeGateLanding";

export const runtime = "edge";

export default async function ChildModeLandingPage() {
  const { session, isAdmin } = await getLandingSessionState();
  return <ModeGateLanding kind="child" session={session} isAdmin={isAdmin} />;
}
