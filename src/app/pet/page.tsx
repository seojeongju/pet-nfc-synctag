import { getLandingSessionState } from "@/lib/landing-session";
import ModeGateLanding from "@/components/landing/ModeGateLanding";

export const runtime = "edge";

export default async function PetModeLandingPage() {
  const { session, isAdmin } = await getLandingSessionState();
  return <ModeGateLanding kind="pet" session={session} isAdmin={isAdmin} />;
}
