import { notFound, redirect } from "next/navigation";
import { PlatformTopNav } from "@/components/platform/PlatformTopNav";
import StudioEditorClient from "@/components/studio/StudioEditorClient";
import { getMyTagDesign } from "@/app/actions/studio";
import { getLandingSessionState } from "@/lib/landing-session";
import { getFormFactor } from "@/lib/platform/form-factors";
import { getPlatformService } from "@/lib/platform/services";
import { buildNoIndexMetadata } from "@/lib/seo";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const metadata = buildNoIndexMetadata("태그 디자인 | 링크유 Link-U");

export default async function StudioDesignPage({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;
  const { session } = await getLandingSessionState();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/studio/${designId}`)}`);
  }

  const design = await getMyTagDesign(designId);
  if (!design) notFound();
  const formFactor = getFormFactor(design.formFactorId);
  const service = getPlatformService(design.serviceId);
  if (!formFactor || !service) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/45 via-amber-50/35 to-slate-50 font-outfit">
      <PlatformTopNav isLoggedIn />
      <StudioEditorClient design={design} formFactor={formFactor} serviceName={service.name} />
    </div>
  );
}
