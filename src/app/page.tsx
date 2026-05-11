import MultiModeHomeClient from "@/components/landing/MultiModeHomeClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import { SITE_DESCRIPTION, SITE_TITLE_DEFAULT, buildHomePageJsonLd, buildPublicMetadata } from "@/lib/seo";

export const runtime = "edge";

export const metadata = buildPublicMetadata({
  title: SITE_TITLE_DEFAULT,
  description: SITE_DESCRIPTION,
  path: "/",
  keywords: [
    "NFC 보호자 연결",
    "반려동물 안전 서비스",
    "실종 예방 태그",
    "스마트 인식표 플랫폼",
    "NFC 안심 플랫폼",
  ],
});

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; ble?: string; mac?: string; device?: string; tag?: string; action?: string }>;
}) {
  const sp = await searchParams;
  const activateTagId = sp.action === "activate" && sp.tag ? sp.tag : null;
  const { session, isAdmin } = await getLandingSessionState();

  const orgManageHref = await getOrgManageHrefForUser(session?.user?.id).catch(() => null);
  /** 메인 랜딩 하단은 관리자 진입만 강조 (보호자는 상단 모드 타일 → 각 모드 페이지에서 로그인) */
  const adminEntryLink = isAdmin ? "/admin" : "/admin/login";
  const adminButtonLabel = isAdmin ? "관리자 센터" : "관리자 로그인";

  return (
    <>
      <JsonLd data={buildHomePageJsonLd()} />
      <MultiModeHomeClient
        session={session}
        isAdmin={isAdmin}
        adminEntryLink={adminEntryLink}
        adminButtonLabel={adminButtonLabel}
        orgManageHref={orgManageHref}
        activateTagId={activateTagId}
      />
    </>
  );
}
