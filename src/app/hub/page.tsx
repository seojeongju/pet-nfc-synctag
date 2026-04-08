import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PawPrint, UserRound, Baby, Briefcase, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { resolveDeviceAssignedKind } from "@/lib/device-mode";

export const runtime = "edge";

const hubIcons: Record<SubjectKind, typeof PawPrint> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
};

export default async function HubPage({
  searchParams,
}: {
  searchParams: Promise<{ device?: string; uid?: string }>;
}) {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const sp = await searchParams;
  const deviceHint =
    (typeof sp.device === "string" && sp.device.trim()) ||
    (typeof sp.uid === "string" && sp.uid.trim()) ||
    "";
  if (deviceHint) {
    const kind = await resolveDeviceAssignedKind(context.env.DB, deviceHint);
    if (kind) {
      redirect(`/dashboard?kind=${encodeURIComponent(kind)}`);
    }
  }

  const roleRow = await context.env.DB
    .prepare("SELECT role FROM user WHERE id = ?")
    .bind(session.user.id)
    .first<{ role?: string | null }>();
  const isAdmin = roleRow?.role === "admin";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit px-5 py-10 pb-24">
      <div className="max-w-md mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">
            Pet-ID Connect
          </p>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            어떤 동행으로
            <br />
            <span className="text-teal-500">시작할까요?</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            돌봄과 연결을 위해 맞춤 화면이 달라요. 나중에 언제든 바꿀 수 있어요.
          </p>
        </header>

        <nav className="space-y-3">
          {SUBJECT_KINDS.map((kind) => {
            const meta = subjectKindMeta[kind];
            const Icon = hubIcons[kind];
            return (
              <Link
                key={kind}
                href={`/dashboard?kind=${kind}`}
                className={cn(
                  "flex items-center gap-4 rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm",
                  "transition-all hover:border-teal-200 hover:shadow-md active:scale-[0.99]"
                )}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-slate-900">{meta.label}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{meta.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <Link
            href="/admin"
            className="block rounded-2xl border border-slate-900 bg-slate-900 px-5 py-4 text-center text-sm font-black text-white"
          >
            관리자 콘솔
          </Link>
        )}

        <p className="text-center text-[10px] text-slate-400 font-bold">
          로그아웃은 각 모드 대시보드 하단에서 할 수 있어요.
        </p>
      </div>
    </div>
  );
}
