import Link from "next/link";
import { UserCircle, PawPrint, Bell, Settings } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <PawPrint className="w-6 h-6" />
            <span>Pet-ID Connect</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary">Dashboard</Link>
            <Link href="/dashboard/pets" className="text-sm font-medium hover:text-primary">My Pets</Link>
            <Link href="/dashboard/scans" className="text-sm font-medium hover:text-primary">Scan History</Link>
          </nav>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-slate-100 relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <UserCircle className="w-8 h-8 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
          </div>
        </div>
      </header>
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
