import MultiModeHomeClient from "@/components/landing/MultiModeHomeClient";
import { getLandingSessionState } from "@/lib/landing-session";

export const runtime = "edge";

export default async function Home() {
  const { session, isAdmin } = await getLandingSessionState();
  const hubPath = "/hub";
  const guardianEntryLink = session
    ? isAdmin
      ? "/admin"
      : hubPath
    : `/login?callbackUrl=${encodeURIComponent(hubPath)}`;
  const guardianButtonLabel = session
    ? isAdmin
      ? "관리자 센터 바로가기"
      : "모드 선택 · 대시보드"
    : "로그인하고 시작하기";

  return (
    <MultiModeHomeClient
      session={session}
      isAdmin={isAdmin}
      guardianEntryLink={guardianEntryLink}
      guardianButtonLabel={guardianButtonLabel}
    />
  );
}
