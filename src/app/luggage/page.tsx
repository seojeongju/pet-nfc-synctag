import { getLandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import { SELECTED_MODE_COOKIE_MAX_AGE_SECONDS, SELECTED_MODE_COOKIE_NAME } from "@/lib/selected-mode";
import ModeGateLanding from "@/components/landing/ModeGateLanding";
import { cookies } from "next/headers";

export const runtime = "edge";

export default async function LuggageModeLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const cookieStore = await cookies();
  cookieStore.set(SELECTED_MODE_COOKIE_NAME, "luggage", {
    path: "/",
    maxAge: SELECTED_MODE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
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
