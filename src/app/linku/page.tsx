import { Suspense } from "react";
import MultiModeHomeClient from "@/components/landing/MultiModeHomeClient";
import { OAuthHomeErrorRedirect } from "@/components/auth/OAuthHomeErrorRedirect";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import { buildLinkuSectionJsonLd, buildPublicMetadata } from "@/lib/seo";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { listTenantsForUser } from "@/lib/tenant-membership";
import { companionWayfinderPath } from "@/lib/companion/dashboard-paths";

export const runtime = "edge";

async function resolveHomeCompanionHref(userId: string | undefined): Promise<string> {
  if (!userId) {
    return `/login?callbackUrl=${encodeURIComponent("/hub")}`;
  }
  const context = getCfRequestContext();
  const db = context.env.DB;
  const tenants = await listTenantsForUser(db, userId).catch(() => []);
  if (tenants.length > 0) {
    return companionWayfinderPath(tenants[0]!.id);
  }
  return companionWayfinderPath(null);
}

export const metadata = buildPublicMetadata({
  title: "Link-U 안심 | NFC 보호자 연결·위치 안심 서비스",
  description:
    "반려동물·어르신·아이·수하물·주얼리 NFC 태그와 동행 안내로, 발견자가 앱 없이 보호자에게 연락하고 위치를 전달할 수 있는 Link-U 안심 서비스입니다.",
  path: "/linku",
  keywords: [
    "NFC 보호자 연결",
    "반려동물 안전 서비스",
    "실종 예방 태그",
    "스마트 인식표 플랫폼",
    "NFC 안심 플랫폼",
    "Link-U 안심",
  ],
});

export default async function LinkuHome({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; ble?: string; mac?: string; device?: string; tag?: string; action?: string }>;
}) {
  const sp = await searchParams;
  const activateTagId = sp.action === "activate" && sp.tag ? sp.tag : null;
  const { session, isAdmin } = await getLandingSessionState();

  const orgManageHref = await getOrgManageHrefForUser(session?.user?.id).catch(() => null);
  const companionHref = await resolveHomeCompanionHref(session?.user?.id);
  /** 메인 랜딩 하단은 관리자 진입만 강조 (보호자는 상단 모드 타일 → 각 모드 페이지에서 로그인) */
  const adminEntryLink = isAdmin ? "/admin" : "/admin/login";
  const adminButtonLabel = isAdmin ? "관리자 센터" : "관리자 로그인";

  return (
    <>
      <JsonLd data={buildLinkuSectionJsonLd()} />
      <Suspense fallback={null}>
        <OAuthHomeErrorRedirect />
      </Suspense>
      <MultiModeHomeClient
        session={session}
        isAdmin={isAdmin}
        adminEntryLink={adminEntryLink}
        adminButtonLabel={adminButtonLabel}
        orgManageHref={orgManageHref}
        activateTagId={activateTagId}
        companionHref={companionHref}
      />
    </>
  );
}
