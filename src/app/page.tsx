import MultiModeHomeClient from "@/components/landing/MultiModeHomeClient";
import { getLandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";

export const runtime = "edge";

export default async function Home() {
  const { session, isAdmin } = await getLandingSessionState();
  const orgManageHref = await getOrgManageHrefForUser(session?.user?.id);
  /** 메인 랜딩 하단은 관리자 진입만 강조 (보호자는 상단 모드 타일 → 각 모드 페이지에서 로그인) */
  const adminEntryLink = isAdmin ? "/admin" : "/admin/login";
  const adminButtonLabel = isAdmin ? "관리자 센터" : "관리자 로그인";

  return (
    <MultiModeHomeClient
      session={session}
      isAdmin={isAdmin}
      adminEntryLink={adminEntryLink}
      adminButtonLabel={adminButtonLabel}
      orgManageHref={orgManageHref}
    />
  );
}
