import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { AdminSidebarNav } from "@/components/admin/layout/AdminSidebarNav";
import { AdminHeaderBar } from "@/components/admin/layout/AdminHeaderBar";
import { getUserConsentStatus } from "@/lib/privacy-consent";
import { isPasswordChangeRequired } from "@/lib/password-change";
import { resolveAdminScope } from "@/lib/admin-authz";

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
  const userId = session?.user?.id ?? null;
  const user = session?.user as SessionUser | undefined;
  const roleRow = userId
    ? await context.env.DB
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(userId)
        .first<{ role?: string | null }>()
    : null;

  if (!session) {
    redirect("/admin/login");
  }
  if (await isPasswordChangeRequired(context.env.DB, session.user.id)) {
    redirect("/force-password");
  }
  if (!isPlatformAdminRole(roleRow?.role)) {
    try {
      await resolveAdminScope("admin");
    } catch {
      redirect("/admin/login");
    }
  }
  const consent = await getUserConsentStatus(session.user.id);
  if (!consent.hasRequired) {
    redirect(`/consent?next=${encodeURIComponent("/admin")}`);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit text-slate-700 relative">
      <div className="absolute top-0 left-0 w-full h-[260px] bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none" />
      <div className="flex min-h-screen flex-col lg:grid lg:min-h-screen lg:grid-cols-[minmax(17rem,19rem)_minmax(0,1fr)]">
        <AdminSidebarNav isPlatformAdmin={isPlatformAdminRole(roleRow?.role)} />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col lg:z-10">
          <AdminHeaderBar user={user} isPlatformAdmin={isPlatformAdminRole(roleRow?.role)} />

          <main className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="min-h-full px-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
