import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, LogIn, Mail, ShieldAlert, UserCheck } from "lucide-react";
import { acceptTenantInviteByToken, getInviteViewByToken } from "@/app/actions/tenant-invite";
import { getLandingSessionState } from "@/lib/landing-session";

export const runtime = "edge";

type SearchParams = Promise<{ err?: string; ok?: string }>;

function roleLabel(role: "owner" | "admin" | "member") {
  if (role === "owner") return "������";
  if (role === "admin") return "������";
  return "���";
}

export default async function InviteAcceptPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: SearchParams;
}) {
  const { token } = await params;
  const qs = await searchParams;
  const { session } = await getLandingSessionState();
  const invite = await getInviteViewByToken(token);

  if (!invite) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
          <h1 className="text-xl font-black text-slate-900">��ȿ���� ���� �ʴ� ��ũ</h1>
          <p className="text-sm font-semibold text-slate-500">��ũ�� ����Ǿ��ų� �������� �ʽ��ϴ�.</p>
          <Link href="/" className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-black text-white">
            Ȩ���� �̵�
          </Link>
        </div>
      </div>
    );
  }

  const callbackUrl = encodeURIComponent(`/invite/${encodeURIComponent(token)}`);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
        <header className="space-y-2 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-teal-600">TENANT INVITE</p>
          <h1 className="text-2xl font-black text-slate-900">���� �ʴ� ����</h1>
          <p className="text-sm text-slate-500 font-semibold">�ʴ� ������ Ȯ���ϰ� ������ �����ϼ���.</p>
        </header>

        {qs.err ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
            {decodeURIComponent(qs.err)}
          </div>
        ) : null}
        {qs.ok ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700">
            {decodeURIComponent(qs.ok)}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <p className="text-sm font-black text-slate-900">{invite.tenant_name}</p>
          <p className="text-xs font-semibold text-slate-500">role: {roleLabel(invite.role)}</p>
          <p className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            {invite.email}
          </p>
          <p className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1">
            <Clock3 className="w-3.5 h-3.5" />
            ����: {new Date(invite.expires_at).toLocaleString("ko-KR")}
          </p>
        </section>

        {invite.status === "accepted" ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-center space-y-2">
            <CheckCircle2 className="w-6 h-6 text-teal-600 mx-auto" />
            <p className="text-sm font-black text-teal-800">�̹� ������ �ʴ��Դϴ�.</p>
            <Link href="/hub" className="inline-flex h-10 items-center rounded-full bg-teal-600 px-5 text-sm font-black text-white">
              ���� �̵�
            </Link>
          </div>
        ) : invite.status === "cancelled" || invite.status === "expired" ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-center space-y-1">
            <ShieldAlert className="w-6 h-6 text-slate-500 mx-auto" />
            <p className="text-sm font-black text-slate-700">����Ǿ��ų� ��ҵ� �ʴ��Դϴ�.</p>
          </div>
        ) : !session ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center space-y-3">
            <p className="text-sm font-black text-amber-800">���� �ʴ���� �������� �α����� �ּ���.</p>
            <Link
              href={`/login?callbackUrl=${callbackUrl}`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-black text-white"
            >
              <LogIn className="w-4 h-4" />
              �α��� �� ���
            </Link>
          </div>
        ) : (
          <form
            action={async () => {
              "use server";
              try {
                await acceptTenantInviteByToken(token);
              } catch (e) {
                const msg = e instanceof Error ? e.message : "�ʴ� ������ �����߽��ϴ�.";
                redirect(`/invite/${encodeURIComponent(token)}?err=${encodeURIComponent(msg)}`);
              }
              redirect(`/invite/${encodeURIComponent(token)}?ok=${encodeURIComponent("�ʴ� ������ �Ϸ�Ǿ����ϴ�.")}`);
            }}
            className="space-y-3"
          >
            <button
              type="submit"
              className="w-full h-11 rounded-full bg-teal-600 text-white text-sm font-black hover:bg-teal-700 inline-flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              �ʴ� �����ϰ� ���� ����
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
