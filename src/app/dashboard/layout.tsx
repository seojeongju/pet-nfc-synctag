import { Suspense } from "react";
import { DashboardNavBar } from "@/components/dashboard/DashboardNavBar";
import { getLandingSessionState } from "@/lib/landing-session";

export const runtime = "edge";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isAdmin } = await getLandingSessionState();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Suspense fallback={<div className="min-h-[7rem] border-b bg-white/80" />}>
        <DashboardNavBar session={session} isAdmin={isAdmin} />
      </Suspense>
      <main className="flex-1 container py-8 px-4 mx-auto max-w-5xl">
        {children}
      </main>
      <footer className="border-t bg-white py-6">
        <div className="container px-4 text-center text-sm text-slate-500">
          © 2024 링크유 Link-U. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
