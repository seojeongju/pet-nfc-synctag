import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { redirect } from "next/navigation";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { getUserConsentStatus } from "@/lib/privacy-consent";
import { SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";
import { listShopProductsForKind } from "@/lib/shop";
import {
  getShopGoldPriceTabPayload,
  userHasPaidGoldOrder,
} from "@/lib/shop-gold-price-tab";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import ShopHomeClient from "./ShopHomeClient";

export const runtime = "edge";

function parseKindQuery(v: string | undefined): SubjectKind | null {
  if (v == null || !String(v).trim()) return null;
  const t = String(v).trim();
  if ((SUBJECT_KINDS as readonly string[]).includes(t)) {
    return t as SubjectKind;
  }
  return null;
}

function parseStoreTab(v: string | undefined): "products" | "gold-price" | null {
  if (v == null || !String(v).trim()) return null;
  const t = String(v).trim();
  if (t === "gold-price") return "gold-price";
  if (t === "products") return "products";
  return null;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; tab?: string }>;
}) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/shop")}`);
  }
  const consent = await getUserConsentStatus(session.user.id);
  if (!consent.hasRequired) {
    redirect(`/consent?next=${encodeURIComponent("/shop")}`);
  }

  const sp = await searchParams;
  const db = context.env.DB;
  const hasGoldPurchase = await userHasPaidGoldOrder(db, session.user.id);
  const roleRow = await db
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  const isPlatformAdmin = isPlatformAdminRole(roleRow?.role);
  // 스토어는 모든 모드 진입/구매를 허용하고, 모드별 상품만 필터링해서 보여준다.
  const allowedKinds: SubjectKind[] = [...SUBJECT_KINDS];

  const fallbackKind = allowedKinds[0] ?? "pet";
  const requested = parseKindQuery(sp.kind);
  const initialKind =
    requested && allowedKinds.includes(requested) ? requested : fallbackKind;

  const requestedTab = parseStoreTab(sp.tab);
  if (requestedTab === "gold-price" && initialKind !== "gold") {
    redirect(`/shop?kind=${encodeURIComponent(initialKind)}`);
  }
  if (requestedTab === "gold-price" && initialKind === "gold" && !hasGoldPurchase) {
    redirect(`/shop?kind=gold`);
  }

  let storeTab: "products" | "gold-price" = "products";
  if (initialKind === "gold" && hasGoldPurchase && requestedTab === "gold-price") {
    storeTab = "gold-price";
  }

  const products = await listAllActiveShopProducts(db);
  const goldPricePayload =
    initialKind === "gold" && hasGoldPurchase && storeTab === "gold-price"
      ? await getShopGoldPriceTabPayload(db, session.user.id)
      : null;
  const orgManageHref = await getOrgManageHrefForUser(session.user.id).catch(() => null);

  return (
    <ShopHomeClient
      session={{ user: { name: session.user.name } }}
      isAdmin={isPlatformAdmin}
      orgManageHref={orgManageHref}
      allowedKinds={allowedKinds}
      initialKind={initialKind}
      products={products}
      hasGoldPurchase={hasGoldPurchase}
      storeTab={storeTab}
      goldPricePayload={goldPricePayload}
    />
  );
}
