import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Tag,
  Package,
  Home,
  LogOut,
  ChevronRight,
  Radio,
  Megaphone,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { isPlatformAdminRole } from "@/lib/platform-admin";

export const runtime = "edge";

export default async function AdminAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  type SessionUser = { id: string; image?: string | null; name?: string | null };
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user as SessionUser | undefined;
  const roleRow = user
    ? await context.env.DB
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(user.id)
        .first<{ role?: string | null }>()
    : null;

  if (!session || !isPlatformAdminRole(roleRow?.role)) {
    redirect("/admin/login");
  }

  const navItems = [
    { href: "/admin", label: "운영 대시보드", icon: LayoutDashboard, color: "text-teal-500" },
    { href: "/admin/announcements", label: "모드·배치 공지", icon: Megaphone, color: "text-indigo-500" },
    { href: "/admin/monitoring", label: "NFC/BLE 모니터링", icon: Radio, color: "text-sky-500" },
    { href: "/admin/tags", label: "태그 재고 관리", icon: Tag, color: "text-amber-500" },
    { href: "/admin/tenants", label: "조직·멤버 관리", icon: Building2, color: "text-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit text-slate-700 relative">
      <div className="absolute top-0 left-0 w-full h-[260px] bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none" />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full lg:w-72 bg-white/90 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-slate-100 z-20 shadow-lg shadow-slate-100/50">
          <div className="p-5 lg:p-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black tracking-tighter text-slate-900 text-lg leading-none italic uppercase">Link-U</span>
              <span className="text-[10px] font-black text-teal-500 tracking-[0.3em] uppercase mt-1">관리자 콘솔</span>
            </div>
          </div>

          <nav className="px-4 pb-4 lg:pb-0 lg:space-y-2 lg:mt-4">
            <p className="hidden lg:block px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">메인 메뉴</p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-2">
              {navItems.map((item) => {
                const NavIcon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      "flex items-center justify-between px-3 lg:px-4 py-3 lg:py-4 hover:bg-teal-50 transition-all group",
                      adminUi.subtleCard
                    )}
                  >
                    <div className="flex items-center gap-3 lg:gap-4 relative z-10 min-w-0">
                      <NavIcon className={`w-4 h-4 lg:w-5 lg:h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                      <span className="font-black text-[10px] lg:text-xs text-slate-800 uppercase tracking-wide truncate">{item.label}</span>
                    </div>
                    <ChevronRight className="hidden lg:block w-3 h-3 text-slate-300 group-hover:text-teal-500 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-4 lg:p-6 space-y-3 lg:space-y-4 border-t border-slate-100 mb-4 lg:mb-6 mt-2 lg:mt-4">
            <Link
              href="/"
              prefetch={false}
              className={cn("flex items-center gap-4 px-4 py-4 bg-slate-50 text-slate-500 hover:text-slate-900 transition-all group", adminUi.subtleCard)}
            >
              <Home className="w-5 h-5" />
              <span className="font-black text-[10px] uppercase tracking-widest">사용자 화면</span>
            </Link>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-rose-500/10 transition-all text-rose-500 border border-rose-100/0 hover:border-rose-500/20 bg-white shadow-md"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-black text-[10px] uppercase tracking-widest">안전 로그아웃</span>
              </button>
            </form>
          </div>
        </aside>

        <div className="flex-1 flex flex-col relative min-w-0 z-10">
          <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 lg:px-10 z-10 sticky top-0">
            <div className="flex items-center gap-3 lg:gap-4 min-w-0">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              <h2 className="text-slate-700 text-[11px] lg:text-sm font-black uppercase tracking-[0.08em] italic truncate">
                시스템 상태: <span className="text-slate-400 font-bold ml-1">실시간 운영 모니터링</span>
              </h2>
            </div>

            <div className="flex items-center gap-2 lg:gap-8">
              <form action="/logout" method="post" className="flex items-center">
                <button
                  type="submit"
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-2 lg:px-3 lg:py-2.5 rounded-2xl transition-all text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20",
                    adminUi.subtleCard
                  )}
                  title="로그아웃"
                  aria-label="관리자 로그아웃"
                >
                  <LogOut className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                  <span className="font-black text-[10px] lg:text-xs uppercase tracking-wide hidden sm:inline">
                    로그아웃
                  </span>
                </button>
              </form>
              <div className="flex items-center gap-2 lg:gap-4 group cursor-pointer p-1 lg:pr-4 rounded-full hover:bg-slate-50 transition-all">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-teal-500/20 overflow-hidden shadow-lg group-hover:border-teal-500 transition-colors">
                  {user?.image ? (
                    <Image src={user.image} alt={user.name || ""} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center uppercase font-black text-teal-400 text-xs">
                      {(user?.name || "A").charAt(0)}
                    </div>
                  )}
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-800 leading-none uppercase tracking-tighter">{user?.name}</p>
                  <p className="text-[9px] text-teal-500 font-black uppercase tracking-[0.2em] mt-1.5 opacity-80 italic">관리자 인증</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="min-h-full px-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
