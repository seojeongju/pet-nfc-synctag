import type { Metadata } from "next";
import { getPetById } from "@/lib/pet-read";
import { getPetTags } from "@/app/actions/tag";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { getCfRequestContext } from "@/lib/cf-request-context";
import PetProfileClient from "@/components/profile/PetProfileClient";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { isTenantSuspendedSafe } from "@/lib/tenant-status";
import NotFoundView from "./NotFoundView";
import { buildNoIndexMetadata } from "@/lib/seo";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pet_id: string }>;
}): Promise<Metadata> {
  const { pet_id } = await params;
  const row = (await getPetById(pet_id)) as { name?: string; subject_kind?: string | null } | null;
  if (!row?.name) {
    return buildNoIndexMetadata("프로필 · 링크유 Link-U");
  }
  const kind = parseSubjectKind(row.subject_kind);
  const label = subjectKindMeta[kind].label;
  return buildNoIndexMetadata(
    `${row.name} · ${label} · 링크유`,
    `${label} 연락 안내 페이지입니다. NFC 스캔 시 발견 위치를 남길 수 있습니다.`
  );
}
type PetDetail = {
  id: string;
  owner_id: string;
  tenant_id?: string | null;
  subject_kind?: string | null;
  name: string;
  breed?: string | null;
  photo_url?: string | null;
  emergency_contact?: string | null;
  medical_info?: string | null;
  /** 0 = 안전, 1 = 실종 신고 중 */
  is_lost?: number | null;
};

export default async function PublicProfilePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ pet_id: string }>,
  searchParams: Promise<{ tag?: string; from?: string; kind?: string }>
}) {
  const { pet_id } = await params;
  const { tag, from, kind: kindFromQuery } = await searchParams;

  const context = getCfRequestContext();
  let session: { user?: { id?: string | null } | null } | null = null;
  try {
    const auth = getAuth(context.env);
    session = await auth.api.getSession({ headers: await headers() });
  } catch (e) {
    console.error("[profile] getSession (non-fatal, public view continues):", e);
  }

  const pet = (await getPetById(pet_id)) as PetDetail | null;
  const tagId = tag || null;

  if (!pet) {
    return <NotFoundView />;
  }

  const isOwner = Boolean(session?.user?.id && session.user.id === pet.owner_id);
  /** NFC(?tag=)로 들어온 보호자는 클라이언트에서 확인 전까지 태그 목록을 내려주지 않음 */
  const nfcOwnerGate = Boolean(tagId && isOwner);
  const tenantId =
    typeof pet.tenant_id === "string" && pet.tenant_id.trim() ? pet.tenant_id.trim() : null;
  const petTags = isOwner && !nfcOwnerGate ? await getPetTags(pet.id, tenantId) : [];
  const kindFromScan =
    typeof kindFromQuery === "string" && kindFromQuery.trim() ? kindFromQuery.trim() : null;
  /** /t/… 스캔 시 ?kind=와 DB subject_kind 정합. 쿼리가 없거나 잘못되면 DB(→ parseSubjectKind) */
  const subjectKind = parseSubjectKind(kindFromScan ?? pet.subject_kind);
  const tenantSuspended = await isTenantSuspendedSafe(context.env.DB, tenantId);

  return (
    <PetProfileClient 
      pet={pet}
      tenantId={tenantId}
      tenantSuspended={tenantSuspended}
      isOwner={isOwner}
      petTags={petTags || []}
      tagId={tagId}
      subjectKind={subjectKind}
      isPublicViewer={!isOwner}
      nfcEntry={!!tagId}
      scanEntrySource={from === "scan" ? "scan" : null}
      nfcOwnerGate={nfcOwnerGate}
    />
  );
}
