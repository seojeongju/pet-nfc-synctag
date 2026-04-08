import HomeClient from "@/components/landing/HomeClient";
import { getLandingSessionState } from "@/lib/landing-session";

export const runtime = "edge";

export default async function PetModeLandingPage() {
  const { session, isAdmin } = await getLandingSessionState();
  const dashboardUrl = "/dashboard?kind=pet";
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(dashboardUrl)}`;
  const guardianEntryLink = session ? (isAdmin ? "/admin" : dashboardUrl) : loginUrl;
  const guardianButtonLabel = session
    ? isAdmin
      ? "관리자 센터 바로가기"
      : "반려동물 모드 대시보드"
    : "보호자로 시작하기";

  return (
    <HomeClient
      session={session}
      isAdmin={isAdmin}
      guardianEntryLink={guardianEntryLink}
      guardianButtonLabel={guardianButtonLabel}
    />
  );
}
