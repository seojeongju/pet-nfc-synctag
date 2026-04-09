import { redirect } from "next/navigation";
import { parseSubjectKind } from "@/lib/subject-kind";

export const runtime = "edge";

export default async function ScansRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; tenant?: string }>;
}) {
  const { kind: kindParam, tenant: tenantParam } = await searchParams;
  const subjectKind = parseSubjectKind(kindParam);
  
  const tenantQs = tenantParam ? `?tenant=${encodeURIComponent(tenantParam)}` : "";
  
  // 새로운 경로 구조로 리다이렉트 (/dashboard/[kind]/scans)
  redirect(`/dashboard/${subjectKind}/scans${tenantQs}`);
}
