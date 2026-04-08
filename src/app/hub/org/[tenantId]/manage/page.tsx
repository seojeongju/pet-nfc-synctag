import {
  adminAddTenantMember,
  adminChangeTenantMemberRole,
  adminCreateTenantInvite,
  adminRemoveTenantMember,
  adminRenameTenant,
  getTenantOrgManageContext,
} from "@/app/actions/admin-tenants";
import { Building2, ChevronLeft, ShieldCheck, UserPlus2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const runtime = "edge";

type SearchParams = Promise<{ err?: string; ok?: string; invite_token?: string; invite_exp?: string }>;

function roleLabel(role: "owner" | "admin" | "member") {
  if (role === "owner") return "소유자";
  if (role === "admin") return "관리자";
  return "멤버";
}

function withMessage(tenantId: string, key: "ok" | "err", value: string) {
  return `/hub/org/${tenantId}/manage?${key}=${encodeURIComponent(value)}`;
}

export default async function TenantOrgManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: SearchParams;
}) {
  const { tenantId } = await params;
  const qs = await searchParams;
  let data: Awaited<ReturnType<typeof getTenantOrgManageContext>>;
  try {
    data = await getTenantOrgManageContext(tenantId);
  } catch {
    redirect("/hub");
  }
  if (!data) notFound();

  const { view: tenant, isPlatformAdmin } = data;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit p-5 lg:p-8 space-y-6">
      <header className="space-y-3">
        <Link
          href="/hub"
          className="inline-flex items-center gap-1 text-xs font-black text-teal-600 hover:text-teal-700"
        >
          <ChevronLeft className="h-4 w-4" />
          허브로
        </Link>
        <div className="flex items-center gap-2 text-slate-900">
          <Building2 className="w-6 h-6 text-teal-500" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">조직 관리</p>
            <h1 className="text-xl lg:text-2xl font-black">{tenant.name}</h1>
            <p className="text-xs font-bold text-slate-400 mt-1">
              slug: {tenant.slug} · members: {tenant.member_count}
              {!isPlatformAdmin ? (
                <span className="ml-2 text-amber-600">· 본인 조직·멤버만 관리됩니다</span>
              ) : null}
            </p>
          </div>
        </div>
      </header>

      {qs.err ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
          {decodeURIComponent(qs.err)}
        </div>
      ) : null}
      {qs.ok ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-700">
          {decodeURIComponent(qs.ok)}
        </div>
      ) : null}
      {qs.invite_token ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 break-all">
          초대 토큰: <span className="font-black">{decodeURIComponent(qs.invite_token)}</span>
          {qs.invite_exp ? ` (만료: ${decodeURIComponent(qs.invite_exp)})` : ""}
        </div>
      ) : null}

      <article className="rounded-3xl border border-slate-100 bg-white p-5 lg:p-6 shadow-sm space-y-4">
        <form
          action={async (formData) => {
            "use server";
            const { redirect } = await import("next/navigation");
            try {
              await adminRenameTenant(formData);
            } catch (e) {
              const msg = e instanceof Error ? e.message : "조직명 변경 실패";
              redirect(withMessage(tenantId, "err", msg));
            }
            redirect(withMessage(tenantId, "ok", "조직명 변경 완료"));
          }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-2"
        >
          <input type="hidden" name="tenant_id" value={tenant.id} />
          <input
            name="name"
            required
            defaultValue={tenant.name}
            placeholder="조직명"
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold lg:col-span-3"
          />
          <button
            type="submit"
            className="h-10 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-teal-600"
          >
            조직명 저장
          </button>
        </form>

        <form
          action={async (formData) => {
            "use server";
            const { redirect } = await import("next/navigation");
            try {
              await adminAddTenantMember(formData);
            } catch (e) {
              const msg = e instanceof Error ? e.message : "멤버 추가 실패";
              redirect(withMessage(tenantId, "err", msg));
            }
            redirect(withMessage(tenantId, "ok", "멤버 저장 완료"));
          }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-2"
        >
          <input type="hidden" name="tenant_id" value={tenant.id} />
          <input
            name="email"
            required
            type="email"
            placeholder="멤버 이메일"
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold lg:col-span-2"
          />
          <select name="role" defaultValue="member" className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold">
            <option value="member">멤버</option>
            <option value="admin">관리자</option>
            <option value="owner">소유자</option>
          </select>
          <button
            type="submit"
            className="h-10 rounded-xl bg-teal-600 text-white text-sm font-black hover:bg-teal-700 inline-flex items-center justify-center gap-1"
          >
            <UserPlus2 className="w-4 h-4" />
            멤버 추가/갱신
          </button>
        </form>

        <form
          action={async (formData) => {
            "use server";
            const { redirect } = await import("next/navigation");
            try {
              const result = await adminCreateTenantInvite(formData);
              const p = new URLSearchParams();
              p.set("ok", encodeURIComponent("초대 토큰 발급 완료"));
              p.set("invite_token", encodeURIComponent(result.token));
              p.set("invite_exp", encodeURIComponent(result.expiresAt));
              redirect(`/hub/org/${tenantId}/manage?${p.toString()}`);
            } catch (e) {
              const msg = e instanceof Error ? e.message : "초대 발급 실패";
              redirect(withMessage(tenantId, "err", msg));
            }
          }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-2"
        >
          <input type="hidden" name="tenant_id" value={tenant.id} />
          <input
            name="email"
            required
            type="email"
            placeholder="미가입 사용자 이메일"
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold lg:col-span-2"
          />
          <select name="role" defaultValue="member" className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold">
            <option value="member">멤버</option>
            <option value="admin">관리자</option>
            <option value="owner">소유자</option>
          </select>
          <button
            type="submit"
            className="h-10 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700"
          >
            초대 토큰 발급
          </button>
        </form>

        {tenant.invites.length > 0 ? (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2">
            <p className="text-[11px] font-black uppercase text-indigo-600">대기 중인 초대</p>
            {tenant.invites.map((iv) => (
              <div key={iv.id} className="rounded-xl bg-white border border-indigo-100 px-3 py-2">
                <p className="text-xs font-black text-slate-700">
                  {iv.email} · {roleLabel(iv.role)}
                </p>
                <p className="text-[11px] font-semibold text-indigo-700 break-all">token: {iv.token}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left text-[11px] font-black text-slate-500 px-3 py-2 uppercase">사용자</th>
                <th className="text-left text-[11px] font-black text-slate-500 px-3 py-2 uppercase">역할</th>
                <th className="text-left text-[11px] font-black text-slate-500 px-3 py-2 uppercase">가입일</th>
                <th className="text-right text-[11px] font-black text-slate-500 px-3 py-2 uppercase">작업</th>
              </tr>
            </thead>
            <tbody>
              {tenant.members.map((m) => (
                <tr key={m.user_id} className="border-t border-slate-100">
                  <td className="px-3 py-3">
                    <p className="text-sm font-black text-slate-800">{m.email}</p>
                    <p className="text-xs font-semibold text-slate-400">{m.name ?? "-"}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {roleLabel(m.role)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs font-semibold text-slate-400">
                    {new Date(m.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <form
                        action={async (formData) => {
                          "use server";
                          const { redirect } = await import("next/navigation");
                          try {
                            await adminChangeTenantMemberRole(formData);
                          } catch (e) {
                            const msg = e instanceof Error ? e.message : "권한 변경 실패";
                            redirect(withMessage(tenantId, "err", msg));
                          }
                          redirect(withMessage(tenantId, "ok", "권한 변경 완료"));
                        }}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="tenant_id" value={tenant.id} />
                        <input type="hidden" name="user_id" value={m.user_id} />
                        <select
                          name="role"
                          defaultValue={m.role}
                          className="h-8 rounded-lg border border-slate-200 px-2 text-xs font-bold"
                        >
                          <option value="member">멤버</option>
                          <option value="admin">관리자</option>
                          <option value="owner">소유자</option>
                        </select>
                        <button
                          type="submit"
                          className="h-8 rounded-lg bg-slate-800 px-2.5 text-[11px] font-black text-white hover:bg-slate-900"
                        >
                          저장
                        </button>
                      </form>

                      <form
                        action={async (formData) => {
                          "use server";
                          const { redirect } = await import("next/navigation");
                          try {
                            await adminRemoveTenantMember(formData);
                          } catch (e) {
                            const msg = e instanceof Error ? e.message : "멤버 제거 실패";
                            redirect(withMessage(tenantId, "err", msg));
                          }
                          redirect(withMessage(tenantId, "ok", "멤버 제거 완료"));
                        }}
                      >
                        <input type="hidden" name="tenant_id" value={tenant.id} />
                        <input type="hidden" name="user_id" value={m.user_id} />
                        <button
                          type="submit"
                          className="h-8 rounded-lg border border-rose-200 px-2.5 text-[11px] font-black text-rose-600 hover:bg-rose-50"
                        >
                          제거
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <p className="text-xs text-slate-400 font-bold">마지막 소유자는 강등·삭제할 수 없습니다. 조직 상태(active/suspended) 변경은 플랫폼 관리자만 할 수 있습니다.</p>
    </div>
  );
}
