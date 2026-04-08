import { PetForm } from "@/components/PetForm";
import { getPet } from "@/app/actions/pet";
import { ArrowLeft, PawPrint, UserRound, Baby, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { notFound, redirect } from "next/navigation";
import { parseSubjectKind, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";

export const runtime = "edge";

const headerIcons: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
};

type PetRow = {
  id: string;
  owner_id: string;
  name: string;
  breed?: string | null;
  medical_info?: string | null;
  emergency_contact?: string | null;
  photo_url?: string | null;
  subject_kind?: string | null;
};

export default async function EditPetPage({
  params,
  searchParams,
}: {
  params: Promise<{ pet_id: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { pet_id } = await params;
  const { kind: kindParam } = await searchParams;

  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const pet = (await getPet(pet_id)) as PetRow | null;
  if (!pet) {
    notFound();
  }

  if (pet.owner_id !== session.user.id) {
    redirect("/dashboard");
  }

  const subjectKind = parseSubjectKind(pet.subject_kind);
  const urlKind = parseSubjectKind(kindParam);
  const kindQs = `?kind=${encodeURIComponent(subjectKind)}`;

  if (kindParam !== undefined && urlKind !== subjectKind) {
    redirect(`/dashboard/pets/${pet_id}/edit${kindQs}`);
  }

  const meta = subjectKindMeta[subjectKind];
  const HeaderIcon = headerIcons[subjectKind];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit pb-12">
      <div className="bg-white px-6 pt-10 pb-12 rounded-b-[48px] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between mb-8">
          <Link href={`/dashboard/pets${kindQs}`}>
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-800 hover:bg-teal-50 hover:text-teal-600 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </div>
          </Link>
          <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-200">
            <HeaderIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">{meta.registerTitle} 수정</h1>
          <p className="text-slate-400 font-medium">{meta.registerSubtitle}</p>
        </div>
      </div>

      <div className="flex-1 container max-w-sm mx-auto mt-8 px-4">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200/50">
          <PetForm
            ownerId={session.user.id}
            subjectKind={subjectKind}
            initialData={{
              id: pet.id,
              name: pet.name,
              breed: pet.breed ?? undefined,
              medical_info: pet.medical_info ?? undefined,
              emergency_contact: pet.emergency_contact ?? undefined,
              photo_url: pet.photo_url ?? undefined,
            }}
          />
        </div>
      </div>
    </div>
  );
}
