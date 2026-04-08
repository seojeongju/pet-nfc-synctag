"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PawPrint, UserCircle, Bell, LayoutGrid, MapPin } from "lucide-react";
import { parseSubjectKind } from "@/lib/subject-kind";

export function DashboardNavBar() {
  const searchParams = useSearchParams();
  const kind = parseSubjectKind(searchParams.get("kind"));
  const q = `?kind=${encodeURIComponent(kind)}`;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <PawPrint className="w-6 h-6" />
          <span>링크유 Link-U</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href={`/hub`} className="text-sm font-medium text-slate-500 hover:text-primary inline-flex items-center gap-1">
            <LayoutGrid className="w-4 h-4" />
            모드
          </Link>
          <Link href={`/dashboard${q}`} className="text-sm font-medium hover:text-primary">
            대시보드
          </Link>
          <Link href={`/dashboard/pets${q}`} className="text-sm font-medium hover:text-primary">
            관리 대상
          </Link>
          <Link href={`/dashboard/scans${q}`} className="text-sm font-medium hover:text-primary">
            스캔 기록
          </Link>
          <Link href={`/dashboard/geofences${q}`} className="text-sm font-medium hover:text-primary inline-flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            안심 구역
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <button type="button" className="p-2 rounded-full hover:bg-slate-100 relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <UserCircle className="w-8 h-8 text-slate-400 cursor-pointer hover:text-primary transition-colors" />
        </div>
      </div>
    </header>
  );
}
