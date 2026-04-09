import MultiModeHomeClient from "@/components/landing/MultiModeHomeClient";
import { getLandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { resolveDeviceAssignedKind } from "@/lib/device-mode";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const runtime = "edge";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; ble?: string; mac?: string; device?: string }>;
}) {
  const sp = await searchParams;
  const deviceHintSource =
    typeof sp.uid === "string" && sp.uid.trim()
      ? "uid"
      : typeof sp.ble === "string" && sp.ble.trim()
        ? "ble"
        : typeof sp.mac === "string" && sp.mac.trim()
          ? "mac"
          : typeof sp.device === "string" && sp.device.trim()
            ? "device"
            : null;
  const deviceHint =
    (typeof sp.uid === "string" && sp.uid.trim()) ||
    (typeof sp.ble === "string" && sp.ble.trim()) ||
    (typeof sp.mac === "string" && sp.mac.trim()) ||
    (typeof sp.device === "string" && sp.device.trim()) ||
    "";
  const { session, isAdmin } = await getLandingSessionState();

  if (deviceHint) {
    const context = getCfRequestContext();
    const kind = await resolveDeviceAssignedKind(context.env.DB, deviceHint);
    if (kind) {
      const reqHeaders = await headers();
      const ipAddress =
        reqHeaders.get("cf-connecting-ip") ||
        reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        null;
      const userAgent = reqHeaders.get("user-agent");
      await context.env.DB
        .prepare(
          "INSERT INTO landing_auto_route_events (source, resolved_kind, authenticated, ip_address, user_agent) " +
            "VALUES (?, ?, ?, ?, ?)"
        )
        .bind(
          deviceHintSource ?? "device",
          kind,
          session ? 1 : 0,
          ipAddress,
          userAgent
        )
        .run()
        .catch(() => null);
      console.info("[landing:auto-route]", {
        source: deviceHintSource,
        resolvedKind: kind,
        authenticated: Boolean(session),
      });
      redirect(session ? `/dashboard/${encodeURIComponent(kind)}` : `/${encodeURIComponent(kind)}`);
    }
  }

  const orgManageHref = await getOrgManageHrefForUser(session?.user?.id).catch(() => null);
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
