import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { notFound, redirect } from "next/navigation";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { getUserConsentStatus } from "@/lib/privacy-consent";
import { getShopOrderByIdForUser } from "@/lib/shop";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import { FlowTopNav } from "@/components/layout/FlowTopNav";
import { ShopOrderClient } from "./ShopOrderClient";

export const runtime = "edge";

export default async function ShopOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId: rawId } = await params;
  const orderId = decodeURIComponent(rawId || "").trim();
  if (!orderId) notFound();

  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/shop/orders/${encodeURIComponent(orderId)}`)}`);
  }
  const consent = await getUserConsentStatus(session.user.id);
  if (!consent.hasRequired) {
    redirect(
      `/consent?next=${encodeURIComponent(`/shop/orders/${encodeURIComponent(orderId)}`)}`
    );
  }

  const db = context.env.DB;
  const roleRow = await db
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  const isPlatformAdmin = isPlatformAdminRole(roleRow?.role);

  const order = await getShopOrderByIdForUser(db, orderId, session.user.id);
  if (!order) {
    notFound();
  }

  const orgManageHref = await getOrgManageHrefForUser(session.user.id).catch(() => null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      <FlowTopNav
        variant="landing"
        session={{ user: { name: session.user.name || "" } }}
        isAdmin={isPlatformAdmin}
        orgManageHref={orgManageHref}
        dashboardHref={`/dashboard/${encodeURIComponent(order.subjectKind)}`}
      />
      <div className="px-4 min-[430px]:px-5 py-6 min-[430px]:py-8 pb-20">
        <ShopOrderClient 
          order={order} 
          session={{ user: { name: session.user.name || "" } }} 
        />
      </div>
    </div>
  );
}
