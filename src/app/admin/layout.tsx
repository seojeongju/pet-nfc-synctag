import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Tag, Users, Package, Settings, Home, LogOut } from "lucide-react";

export const runtime = "edge";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 보안 체크: 관리자 권한(role === 'admin')이 없는 경우 접속 차단
  if (!session || (session.user as any).role !== 'admin') {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-outfit">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="font-black tracking-tight text-lg">SELLER ADMIN</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
            <LayoutDashboard className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm text-slate-300">Dashboard</span>
          </Link>
          <Link href="/admin/tags" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
            <Tag className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm text-slate-300">Tag Inventory</span>
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
            <Users className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-sm text-slate-300">Users</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2 pb-8">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
            <Home className="w-5 h-5 text-slate-400" />
            <span className="font-bold text-sm text-slate-400">User Mode</span>
          </Link>
          <Link href="/logout" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/20 transition-colors text-rose-400">
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-slate-800 font-bold">판매자 관리 도구</h2>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{session.user.name}</p>
                    <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest">Administrator</p>
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
