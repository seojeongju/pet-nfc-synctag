import { Suspense } from "react";
import { DashboardNavBar } from "@/components/dashboard/DashboardNavBar";
import { DashboardBottomNav } from "@/components/dashboard/DashboardBottomNav";
import { getLandingSessionState, type LandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import { getUserConsentStatus } from "@/lib/privacy-consent";
import { redirect } from "next/navigation";

export const runtime = "edge";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let landing: LandingSessionState = { session: null, isAdmin: false };
  try {
    landing = await getLandingSessionState();
  } catch (e) {
    console.error("[dashboard/layout] getLandingSessionState", e);
  }
  if (landing.session?.user?.id) {
    const consent = await getUserConsentStatus(landing.session.user.id);
    if (!consent.hasRequired) {
      redirect(`/consent?next=${encodeURIComponent("/dashboard")}`);
    }
  }

  const orgManageHref = await getOrgManageHrefForUser(landing.session?.user?.id).catch(() => null);

  return (
    <div className="flex min-h-dvh min-h-[100svh] w-full min-w-0 flex-col bg-slate-50">
      <Suspense fallback={<div className="min-h-[7rem] border-b bg-white/80" />}>
        <DashboardNavBar session={landing.session} isAdmin={landing.isAdmin} orgManageHref={orgManageHref} />
      </Suspense>
      <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-3 py-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:px-4 sm:py-8">
        {children}
      </main>
      <Suspense fallback={null}>
        <DashboardBottomNav />
      </Suspense>
      <footer className="border-t bg-white py-6">
        <div className="container px-4 text-center text-sm text-slate-500">
          <p>© 2026 WOW3D PRO. (주)와우쓰리디. All rights reserved.</p>
          <p className="mt-1">대표 전화: 02-3144-3137 / 054-464-3144</p>
          <p>이메일 문의: wow3d16@naver.com</p>
          <p>사업자등록번호: 849-88-01659</p>
        </div>
      </footer>
    </div>
  );
}
