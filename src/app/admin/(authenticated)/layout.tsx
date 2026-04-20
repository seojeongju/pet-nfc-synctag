import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { AdminSidebarNav, AdminHeaderUser } from "@/components/admin/layout/AdminSidebarNav";

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit text-slate-700 relative">
      <div className="absolute top-0 left-0 w-full h-[260px] bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none" />
      <div className="flex min-h-screen flex-col lg:grid lg:min-h-screen lg:grid-cols-[minmax(17rem,19rem)_minmax(0,1fr)]">
        <AdminSidebarNav />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col lg:z-10">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md lg:h-20 lg:px-10">
            <div className="flex items-center gap-3 lg:gap-4 min-w-0">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              <h2 className="text-slate-700 text-[11px] lg:text-sm font-black tracking-[0.02em] lg:tracking-[0.08em] italic truncate">
                시스템 상태: <span className="text-slate-400 font-bold ml-1 hidden sm:inline">실시간 운영 모니터링</span>
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
              <AdminHeaderUser user={user} />
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
