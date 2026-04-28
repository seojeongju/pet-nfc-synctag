import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { notFound, redirect } from "next/navigation";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { getUserConsentStatus } from "@/lib/privacy-consent";
import { getEffectiveAllowedSubjectKinds } from "@/lib/mode-visibility";
import { SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";
import { getShopProductBySlugForKind } from "@/lib/shop";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import ShopProductDetailClient from "./ShopProductDetailClient";

export const runtime = "edge";

function parseKindQuery(v: string | undefined | null): SubjectKind | null {
  if (v == null || !String(v).trim()) return null;
  const t = String(v).trim();
  if ((SUBJECT_KINDS as readonly string[]).includes(t)) {
    return t as SubjectKind;
  }
  return null;
}

export default async function ShopProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw || "").trim();
  if (!slug) notFound();

  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/shop/${encodeURIComponent(slug)}`)}`);
  }
  const consent = await getUserConsentStatus(session.user.id);
  if (!consent.hasRequired) {
    redirect(`/consent?next=${encodeURIComponent(`/shop/${encodeURIComponent(slug)}`)}`);
  }

  const sp = await searchParams;
  const db = context.env.DB;
  const roleRow = await db
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  const isPlatformAdmin = isPlatformAdminRole(roleRow?.role);
  const allowedSubjectKinds = await getEffectiveAllowedSubjectKinds(db, session.user.id, {
    isPlatformAdmin,
  });
  const allowedKinds: SubjectKind[] = isPlatformAdmin
    ? [...SUBJECT_KINDS]
    : allowedSubjectKinds;
  const fallbackKind = allowedKinds[0] ?? "pet";
  const requested = parseKindQuery(sp.kind);
  const kind =
    requested && allowedKinds.includes(requested) ? requested : fallbackKind;

  const product = await getShopProductBySlugForKind(db, slug, kind);
  if (!product) {
    notFound();
  }

  const orgManageHref = await getOrgManageHrefForUser(session.user.id).catch(() => null);

  return (
    <ShopProductDetailClient
      session={{ user: { name: session.user.name } }}
      isAdmin={isPlatformAdmin}
      orgManageHref={orgManageHref}
      product={product}
      kind={kind}
    />
  );
}
