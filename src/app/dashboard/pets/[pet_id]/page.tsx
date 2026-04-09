import { redirect } from "next/navigation";
import { parseSubjectKind } from "@/lib/subject-kind";
import { getPet } from "@/app/actions/pet";

export const runtime = "edge";

export default async function PetDetailRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ pet_id: string }>;
  searchParams: Promise<{ kind?: string; tenant?: string }>;
}) {
  const { pet_id } = await params;
  const { kind: kindParam, tenant: tenantParam } = await searchParams;
  
  // 펫 정보를 통해 정확한 subject_kind 확인 (없으면 파라미터 활용)
  const pet = await getPet(pet_id);
  const subjectKind = parseSubjectKind(pet?.subject_kind ?? kindParam);
  
  const tenantQs = tenantParam ? `?tenant=${encodeURIComponent(tenantParam)}` : "";
  
  // 상세 페이지로 리다이렉트
  redirect(`/dashboard/${subjectKind}/pets/${pet_id}${tenantQs}`);
}
