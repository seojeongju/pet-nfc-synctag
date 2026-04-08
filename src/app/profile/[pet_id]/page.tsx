import type { Metadata } from "next";
import { getPet } from "@/app/actions/pet";
import { getPetTags } from "@/app/actions/tag";
import { notFound } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import PetProfileClient from "@/components/profile/PetProfileClient";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pet_id: string }>;
}): Promise<Metadata> {
  const { pet_id } = await params;
  const row = (await getPet(pet_id)) as { name?: string; subject_kind?: string | null } | null;
  if (!row?.name) {
    return { title: "프로필 · 링크유 Link-U" };
  }
  const kind = parseSubjectKind(row.subject_kind);
  const label = subjectKindMeta[kind].label;
  return {
    title: `${row.name} · ${label} · 링크유`,
    description: `${label} 연락 안내 페이지입니다. NFC 스캔 시 발견 위치를 남길 수 있습니다.`,
  };
}
type PetDetail = { id: string; owner_id: string; tenant_id?: string | null; subject_kind?: string | null };

export default async function PublicProfilePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ pet_id: string }>,
  searchParams: Promise<{ tag?: string }>
}) {
  const { pet_id } = await params;
  const { tag } = await searchParams;

  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const pet = await getPet(pet_id) as PetDetail | null;
  const tagId = tag || null;

  if (!pet) {
    notFound();
  }

  const isOwner = session?.user.id === pet.owner_id;
  /** NFC(?tag=)로 들어온 보호자는 클라이언트에서 확인 전까지 태그 목록을 내려주지 않음 */
  const nfcOwnerGate = Boolean(tagId && isOwner);
  const petTags = isOwner && !nfcOwnerGate ? await getPetTags(pet.id) : [];
  const subjectKind = parseSubjectKind(pet.subject_kind);
  const tenantId =
    typeof pet.tenant_id === "string" && pet.tenant_id.trim() ? pet.tenant_id.trim() : null;

  return (
    <PetProfileClient 
      pet={pet}
      tenantId={tenantId}
      isOwner={isOwner}
      petTags={petTags || []}
      tagId={tagId}
      subjectKind={subjectKind}
      isPublicViewer={!isOwner}
      nfcEntry={!!tagId}
      nfcOwnerGate={nfcOwnerGate}
    />
  );
}
