import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Tag, Package, Home, LogOut, ChevronRight, Bell } from "lucide-react";
import Image from "next/image";

export const runtime = "edge";

export default async function AdminAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  type SessionUser = { id: string; image?: string | null; name?: string | null };
  const context = getRequestContext();
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

  // 보안 체크: 관리자 권한(role === 'admin')이 없는 경우 전용 로그인 페이지로 안내
  if (!session || roleRow?.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-outfit text-slate-700 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[260px] bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none" />
      <aside className="w-72 bg-white/90 backdrop-blur-md border-r border-slate-100 flex flex-col sticky top-0 h-screen z-20 transition-all duration-500 shadow-xl shadow-slate-100/60">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-slate-900 text-lg leading-none italic uppercase">Pet-ID</span>
            <span className="text-[10px] font-black text-teal-500 tracking-[0.3em] uppercase mt-1">관리자 콘솔</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">메인 메뉴</p>
          
          <Link href="/admin" className="flex items-center justify-between px-4 py-4 rounded-2xl bg-teal-50/80 hover:bg-teal-50 transition-all group relative overflow-hidden border border-teal-100">
             <div className="flex items-center gap-4 relative z-10">
                <LayoutDashboard className="w-5 h-5 text-teal-500 group-hover:scale-110 transition-transform" />
                <span className="font-black text-xs text-slate-800 uppercase tracking-wider">운영 대시보드</span>
             </div>
             <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-teal-500 transition-colors" />
          </Link>

          <Link href="/admin/tags" className="flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-slate-50 transition-all group relative overflow-hidden">
             <div className="flex items-center gap-4 relative z-10">
                <Tag className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="font-black text-xs text-slate-700 uppercase tracking-wider">태그 재고 관리</span>
             </div>
             <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </Link>
        </nav>

        {/* Sidebar Footer Services */}
        <div className="p-6 space-y-4 border-t border-slate-100 mb-6">
          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-slate-50 hover:bg-white text-slate-500 hover:text-slate-900 transition-all group border border-slate-100">
            <Home className="w-5 h-5" />
            <span className="font-black text-[10px] uppercase tracking-widest">사용자 화면</span>
          </Link>
          <Link href="/logout" className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-rose-500/10 transition-all text-rose-500 border border-transparent hover:border-rose-500/20 bg-white">
            <LogOut className="w-5 h-5" />
            <span className="font-black text-[10px] uppercase tracking-widest">안전 로그아웃</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative h-screen overflow-hidden z-10">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 z-10 sticky top-0">
            <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                <h2 className="text-slate-700 text-sm font-black uppercase tracking-[0.1em] italic">
                   시스템 상태: <span className="text-slate-400 font-bold ml-1">실시간 운영 모니터링</span>
                </h2>
            </div>
            
            <div className="flex items-center gap-8">
                <button className="relative p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all">
                   <Bell className="w-5 h-5 text-slate-500" />
                   <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                </button>
                <div className="flex items-center gap-4 group cursor-pointer p-1 pr-4 rounded-full hover:bg-slate-50 transition-all">
                    <div className="w-10 h-10 rounded-full border-2 border-teal-500/20 overflow-hidden shadow-lg group-hover:border-teal-500 transition-colors">
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
            <div className="min-h-full">
               {children}
            </div>
        </main>
      </div>
    </div>
  );
}
