import { getAuth } from "@/lib/auth";
import { getPets } from "@/app/actions/pet";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, PawPrint, ChevronRight, UserRound, Baby, Briefcase, Gem } from "lucide-react";
import { parseSubjectKind, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import type { LucideIcon } from "lucide-react";
import { requireTenantMember } from "@/lib/tenant-membership";
import { getTenantStatus } from "@/lib/tenant-status";

export const runtime = "edge";
type PetListItem = {
    id: string;
    name: string;
    breed?: string | null;
    photo_url?: string | null;
};

const listIcons: Record<SubjectKind, LucideIcon> = {
    pet: PawPrint,
    elder: UserRound,
    child: Baby,
    luggage: Briefcase,
    gold: Gem,
};

export default async function PetsPage({
    searchParams,
}: {
    searchParams: Promise<{ kind?: string; tenant?: string }>;
}) {
    const { kind: kindParam, tenant: tenantParam } = await searchParams;
    const subjectKind = parseSubjectKind(kindParam);
    const meta = subjectKindMeta[subjectKind];
    const tenantId =
        typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;
    const qs = new URLSearchParams({ kind: subjectKind });
    if (tenantId) qs.set("tenant", tenantId);
    const kindQs = `?${qs.toString()}`;
    const ListIcon = listIcons[subjectKind];

    const context = getRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    if (tenantId) {
        await requireTenantMember(context.env.DB, session.user.id, tenantId);
    }
    const tenantSuspended = tenantId
        ? (await getTenantStatus(context.env.DB, tenantId)) === "suspended"
        : false;

    const pets = (await getPets(session.user.id, subjectKind, tenantId ?? undefined)) as PetListItem[];
    const subLabel =
        subjectKind === "pet" ? `${pets.length}마리의 반려동물` : `${pets.length}건의 등록`;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-outfit pb-20">
            <div className="flex items-center justify-between px-2">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900">{meta.listHeading}</h1>
                    <p className="text-sm text-slate-500">등록된 {subLabel}</p>
                    {tenantSuspended ? (
                        <p className="text-xs font-bold text-amber-700">
                            조직이 중지 상태라 신규 등록이 잠겨 있습니다.
                        </p>
                    ) : null}
                </div>
                <a
                    href={tenantSuspended ? "#" : `/dashboard/pets/new${kindQs}`}
                    aria-disabled={tenantSuspended}
                    className={cn(
                        buttonVariants({}),
                        "rounded-full bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-100 gap-2 h-11 px-5",
                        tenantSuspended ? "pointer-events-none opacity-50" : ""
                    )}
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-bold">추가하기</span>
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                {pets.length > 0 ? (
                    pets.map((pet: PetListItem) => (
                        <a href={`/profile/${pet.id}${kindQs}`} key={pet.id} className="group">
                            <Card className="rounded-[32px] border-none shadow-xl shadow-slate-100/50 overflow-hidden hover:scale-[1.02] transition-all duration-300">
                                <div className="h-40 bg-teal-50 relative">
                                    {pet.photo_url ? (
                                        <Image
                                            src={pet.photo_url}
                                            alt={pet.name}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-teal-200">
                                            <ListIcon className="w-16 h-16 opacity-50" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-slate-800">{pet.name}</h3>
                                            <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">
                                                {pet.breed ||
                                                    (subjectKind === "pet" ? "품종 미지정" : "비고 없음")}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </a>
                    ))
                ) : (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto px-2">
                        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <ListIcon className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-slate-800">{meta.emptyPetsTitle}</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{meta.emptyPetsBody}</p>
                            <p className="text-xs text-slate-400 leading-relaxed">{meta.nfcHelper}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                            <a
                                href={tenantSuspended ? "#" : `/dashboard/pets/new${kindQs}`}
                                aria-disabled={tenantSuspended}
                                className={cn(
                                    buttonVariants({}),
                                    "rounded-full bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-100 font-black px-8 h-12",
                                    tenantSuspended ? "pointer-events-none opacity-50" : ""
                                )}
                            >
                                {meta.emptyPetsCta}
                            </a>
                            <a
                                href="/hub"
                                className={cn(
                                    buttonVariants({ variant: "outline" }),
                                    "rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-8 h-12"
                                )}
                            >
                                모드·용량 허브
                            </a>
                        </div>
                        <a
                            href={`/dashboard${kindQs}`}
                            className="text-xs font-bold text-teal-600 hover:text-teal-700 underline-offset-4 hover:underline"
                        >
                            대시보드에서 NFC 태그 ID 연결하기 →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
