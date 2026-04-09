import { redirect } from "next/navigation";
import { parseSubjectKind } from "@/lib/subject-kind";

export const runtime = "edge";

export default async function GeofencesRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; tenant?: string }>;
}) {
  const { kind: kindParam, tenant: tenantParam } = await searchParams;
  const subjectKind = parseSubjectKind(kindParam);
  
  const tenantQs = tenantParam ? `?tenant=${encodeURIComponent(tenantParam)}` : "";
  
  // 안심 구역 페이지로 리다이렉트
  redirect(`/dashboard/${subjectKind}/geofences${tenantQs}`);
}
