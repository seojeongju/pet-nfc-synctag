import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Tag, Users, Package, Home, LogOut } from "lucide-react";

export const runtime = "edge";

export default async function AdminAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 보안 체크: 관리자 권한(role === 'admin')이 없는 경우 전용 로그인 페이지로 안내
  if (!session || (session.user as any).role !== 'admin') {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-outfit">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="font-black tracking-tight text-lg uppercase">SELLER ADMIN</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors group">
            <LayoutDashboard className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm text-slate-300">Dashboard</span>
          </Link>
          <Link href="/admin/tags" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors group">
            <Tag className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm text-slate-300">Tag Inventory</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2 pb-8">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-teal-500/10 transition-colors text-slate-400 hover:text-teal-400">
            <Home className="w-5 h-5" />
            <span className="font-bold text-sm">User Mode Dashboard</span>
          </Link>
          <Link href="/logout" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/20 transition-colors text-rose-400">
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Seller Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50/50">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-white/80">
            <h2 className="text-slate-800 font-extrabold flex items-center gap-2">
               판매자 관리 센터
               <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
            </h2>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-xs font-black text-slate-900">{session.user.name}</p>
                    <p className="text-[10px] text-teal-500 font-black uppercase tracking-widest opacity-70">Authenticated Admin</p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-teal-50 shadow-sm overflow-hidden">
                    {session.user.image ? (
                        <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-100" />
                    )}
                </div>
            </div>
        </header>
        <div className="p-8">
            {children}
        </div>
      </main>
    </div>
  );
}
