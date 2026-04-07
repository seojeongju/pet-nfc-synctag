import { getPet } from "@/app/actions/pet";
import { getPetTags } from "@/app/actions/tag";
import { notFound } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import PetProfileClient from "@/components/profile/PetProfileClient";

export const runtime = "edge";

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

  const pet = await getPet(pet_id) as any;
  const tagId = tag || null;

  if (!pet) {
    notFound();
  }

  const isOwner = session?.user.id === pet.owner_id;
  const petTags = isOwner ? await getPetTags(pet.id) : [];

  return (
    <PetProfileClient 
      pet={pet}
      isOwner={isOwner}
      petTags={petTags || []}
      tagId={tagId}
    />
  );
}
