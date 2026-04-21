import { getAuth } from "@/lib/auth";
import { getPetsWithDb } from "@/lib/pets-db";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, PawPrint, ChevronRight, UserRound, Baby, Briefcase, Gem } from "lucide-react";
import { parseSubjectKind, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import type { LucideIcon } from "lucide-react";
import { requireTenantMember } from "@/lib/tenant-membership";
import { isTenantSuspendedSafe } from "@/lib/tenant-status";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import SafePetImage from "@/components/pet/SafePetImage";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type PetListItem = {
    id: string;
    name: string;
    breed?: string | null;
    photo_url?: string | null;
    is_lost?: number | null;
};

const listIcons: Record<SubjectKind, LucideIcon> = {
    pet: PawPrint,
    elder: UserRound,
    child: Baby,
    luggage: Briefcase,
    gold: Gem,
};

function petsLoadFailed(
    kindQs: string,
    dashboardLink: string,
    selfLink: string,
    ListIcon: LucideIcon
) {
    return (
        <div className="mx-auto max-w-lg space-y-6 px-2 py-16 text-center font-outfit">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-400">
                <ListIcon className="h-10 w-10" />
            </div>
            <div className="space-y-2">
                <h1 className="text-xl font-black text-slate-900">목록을 불러오지 못했어요</h1>
                <p className="text-sm leading-relaxed text-slate-600">
                    잠시 후 다시 시도해 주세요. 문제가 계속되면 Cloudflare Worker 로그나 D1 마이그레이션 적용 여부를 확인해 주세요.
                </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                    href={dashboardLink}
                    className={cn(
                        buttonVariants({}),
                        "rounded-full bg-teal-500 font-bold shadow-lg shadow-teal-100 hover:bg-teal-600"
                    )}
                >
                    대시보드로 돌아가기
                </a>
                <a
                    href={selfLink}
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "rounded-full border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
                    )}
                >
                    다시 시도
                </a>
            </div>
        </div>
    );
}

export default async function PetsPage({
    params,
    searchParams,
}: {
    params: Promise<{ kind: string }>;
    searchParams: Promise<{ tenant?: string }>;
}) {
    let kindQs = "?kind=pet";
    let dashboardLink = "/dashboard/pet";
    let selfLink = "/dashboard/pet/pets";
    let ListIcon: LucideIcon = PawPrint;

    try {
        const { kind: kindParam } = await params;
        const { tenant: tenantParam } = await searchParams;
        const subjectKind = parseSubjectKind(kindParam);
        const meta = subjectKindMeta[subjectKind];
        const tenantId =
            typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;
        
        const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
        kindQs = tenantQs; // 하위 링크용 (이미 경로에 kind가 있으므로)
        dashboardLink = `/dashboard/${subjectKind}${tenantQs}`;
        selfLink = `/dashboard/${subjectKind}/pets${tenantQs}`;

        ListIcon = listIcons[subjectKind];

        const context = getCfRequestContext();
        const auth = getAuth(context.env);
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            redirect("/login");
        }

        if (tenantId) {
            try {
                await requireTenantMember(context.env.DB, session.user.id, tenantId);
            } catch {
                return (
                    <div className="mx-auto max-w-lg space-y-6 px-2 py-16 text-center font-outfit">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                            <ListIcon className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-black text-slate-900">이 조직에 접근할 수 없어요</h1>
                            <p className="text-sm leading-relaxed text-slate-600">
                                초대·멤버십을 확인하거나 다른 모드로 이동해 주세요.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <a
                                href={dashboardLink}
                                className={cn(
                                    buttonVariants({}),
                                    "rounded-full bg-teal-500 font-bold shadow-lg shadow-teal-100 hover:bg-teal-600"
                                )}
                            >
                                대시보드로
                            </a>
                        </div>
                    </div>
                );
            }
        }

        const tenantSuspended = await isTenantSuspendedSafe(context.env.DB, tenantId);

        let pets: PetListItem[];
        try {
            pets = (await getPetsWithDb(
                context.env.DB,
                session.user.id,
                subjectKind,
                tenantId ?? undefined
            )) as PetListItem[];
        } catch (error: unknown) {
            console.error("Pets list data fetch error:", error);
            return petsLoadFailed(kindQs, dashboardLink, selfLink, ListIcon);
        }

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
                        href={tenantSuspended ? "#" : `/dashboard/${subjectKind}/pets/new${kindQs}`}
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
                            /* 보호자 전용 상세 페이지로 이동 */
                            <a href={`/dashboard/${subjectKind}/pets/${pet.id}${kindQs}`} key={pet.id} className="group">
                                <Card className="rounded-[32px] border-none shadow-xl shadow-slate-100/50 overflow-hidden hover:scale-[1.02] transition-all duration-300">
                                    <div className="h-40 bg-teal-50 relative">
                                        <div className="absolute inset-0">
                                            <SafePetImage
                                                src={pet.photo_url}
                                                alt={pet.name}
                                                className="h-full w-full object-cover"
                                                fallbackClassName="h-full w-full flex items-center justify-center bg-teal-50 text-teal-200"
                                                iconClassName="h-16 w-16 opacity-50"
                                            />
                                        </div>
                                        {/* 실종 뱃지 */}
                                        {pet.is_lost ? (
                                            <div className="absolute top-2 left-2 flex items-center gap-1 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg">
                                                <span className="animate-pulse">🚨</span> 실종
                                            </div>
                                        ) : null}
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
                                    href={tenantSuspended ? "#" : `/dashboard/${subjectKind}/pets/new${kindQs}`}
                                    aria-disabled={tenantSuspended}
                                    className={cn(
                                        buttonVariants({}),
                                        "rounded-full bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-100 font-black px-8 h-12",
                                        tenantSuspended ? "pointer-events-none opacity-50" : ""
                                    )}
                                >
                                    {meta.emptyPetsCta}
                                </a>
                            </div>
                            <a
                                href={dashboardLink}
                                className="text-xs font-bold text-teal-600 hover:text-teal-700 underline-offset-4 hover:underline"
                            >
                                대시보드에서 NFC 태그 ID 연결하기 →
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error: unknown) {
        rethrowNextControlFlowErrors(error);
        console.error("[dashboard/pets] unexpected:", error);
        return petsLoadFailed(kindQs, dashboardLink, selfLink, ListIcon);
    }
}
