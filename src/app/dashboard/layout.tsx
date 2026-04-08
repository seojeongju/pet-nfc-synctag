import { Suspense } from "react";
import { DashboardNavBar } from "@/components/dashboard/DashboardNavBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Suspense fallback={<div className="h-16 border-b bg-white/80" />}>
        <DashboardNavBar />
      </Suspense>
      <main className="flex-1 container py-8 px-4 mx-auto max-w-5xl">
        {children}
      </main>
      <footer className="border-t bg-white py-6">
        <div className="container px-4 text-center text-sm text-slate-500">
          © 2024 Pet-ID Connect. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
