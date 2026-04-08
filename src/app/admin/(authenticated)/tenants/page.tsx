import {
  adminAddTenantMember,
  adminChangeTenantMemberRole,
  getTenantAdminAuditLogs,
  adminCreateTenantInvite,
  adminCreateTenantWithOwner,
  adminRenameTenant,
  adminRemoveTenantMember,
  adminUpdateTenantStatus,
  getTenantsAdminView,
} from "@/app/actions/admin-tenants";
import { Building2, Search, ShieldCheck, UserPlus2, UsersRound } from "lucide-react";

export const runtime = "edge";

type SearchParams = Promise<{
  err?: string;
  ok?: string;
  q?: string;
  email?: string;
  status?: "all" | "active" | "suspended";
  invite_token?: string;
  invite_exp?: string;
}>;

function roleLabel(role: "owner" | "admin" | "member") {
  if (role === "owner") return "소유자";
  if (role === "admin") return "관리자";
  return "멤버";
}

function buildBackQuery(qs: {
  q?: string;
  email?: string;
  status?: string;
}) {
  const p = new URLSearchParams();
  if (qs.q) p.set("q", qs.q);
  if (qs.email) p.set("email", qs.email);
  if (qs.status && qs.status !== "all") p.set("status", qs.status);
  return p.toString();
}

function withMessage(baseQs: string, key: "ok" | "err", value: string) {
  const p = new URLSearchParams(baseQs);
  p.set(key, value);
  return `/admin/tenants?${p.toString()}`;
}

export default async function AdminTenantsPage({ searchParams }: { searchParams: SearchParams }) {
  const qs = await searchParams;
  const q = String(qs.q ?? "").trim();
  const email = String(qs.email ?? "").trim();
  const status = qs.status === "active" || qs.status === "suspended" ? qs.status : "all";
  const tenants = await getTenantsAdminView({ q, email, status });
  const auditLogs = await getTenantAdminAuditLogs(60);
  const backQs = buildBackQuery({ q, email, status });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit p-5 lg:p-8 space-y-6">
      <header className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">MULTI TENANCY</p>
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900">조직 · 멤버 관리</h1>
        <p className="text-sm text-slate-500 font-medium">
          조직 생성, 멤버 추가, role(owner/admin/member) 변경/삭제를 관리합니다.
        </p>
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
          초대 토큰 발급 완료: <span className="font-black">{decodeURIComponent(qs.invite_token)}</span>
          {qs.invite_exp ? ` (만료: ${decodeURIComponent(qs.invite_exp)})` : ""}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-100 bg-white p-5 lg:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Search className="w-5 h-5 text-teal-500" />
          <h2 className="text-lg font-black">조직 검색 / 필터</h2>
        </div>
        <form method="GET" className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="tenant명 또는 slug"
            className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold"
          />
          <input
            name="email"
            defaultValue={email}
            placeholder="멤버 이메일"
            className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold"
          />
          <select
            name="status"
            defaultValue={status}
            className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold"
          >
            <option value="all">전체 상태</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
          </select>
          <button
            type="submit"
            className="h-11 rounded-2xl bg-slate-900 text-white text-sm font-black hover:bg-teal-600"
          >
            필터 적용
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 lg:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Building2 className="w-5 h-5 text-teal-500" />
          <h2 className="text-lg font-black">새 조직 생성</h2>
        </div>
        <form
          action={async (formData) => {
            "use server";
            const { redirect } = await import("next/navigation");
            try {
              await adminCreateTenantWithOwner(formData);
            } catch (e) {
              const msg = e instanceof Error ? e.message : "조직 생성 실패";
              redirect(withMessage(String(formData.get("return_qs") ?? ""), "err", encodeURIComponent(msg)));
            }
            redirect(withMessage(String(formData.get("return_qs") ?? ""), "ok", encodeURIComponent("조직 생성 완료")));
          }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-3"
        >
          <input type="hidden" name="return_qs" value={backQs} />
          <input
            name="name"
            required
            placeholder="조직명"
            className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold"
          />
          <input
            name="owner_email"
            required
            type="email"
            placeholder="소유자 이메일"
            className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold"
          />
          <button
            type="submit"
            className="h-11 rounded-2xl bg-slate-900 text-white text-sm font-black hover:bg-teal-600"
          >
            조직 생성
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {tenants.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400 font-semibold">
            등록된 조직이 없습니다.
          </div>
        ) : (
          tenants.map((tenant) => (
            <article key={tenant.id} className="rounded-3xl border border-slate-100 bg-white p-5 lg:p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-900">{tenant.name}</p>
                  <p className="text-xs font-bold text-slate-400">slug: {tenant.slug} · members: {tenant.member_count}</p>
                </div>
                <form
                  action={async (formData) => {
                    "use server";
                    const { redirect } = await import("next/navigation");
                    try {
                      await adminUpdateTenantStatus(formData);
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : "상태 변경 실패";
                      redirect(withMessage(String(formData.get("return_qs") ?? ""), "err", encodeURIComponent(msg)));
                    }
                    redirect(withMessage(String(formData.get("return_qs") ?? ""), "ok", encodeURIComponent("조직 상태 변경 완료")));
                  }}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="tenant_id" value={tenant.id} />
                  <input type="hidden" name="return_qs" value={backQs} />
                  <select name="status" defaultValue={tenant.status} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold">
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                  </select>
                  <button type="submit" className="h-9 rounded-xl bg-slate-900 px-3 text-[11px] font-black text-white">
                    상태 저장
                  </button>
                </form>
              </div>

              <form
                action={async (formData) => {
                  "use server";
                  const { redirect } = await import("next/navigation");
                  try {
                    await adminRenameTenant(formData);
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "조직명 변경 실패";
                    redirect(withMessage(String(formData.get("return_qs") ?? ""), "err", encodeURIComponent(msg)));
                  }
                  redirect(withMessage(String(formData.get("return_qs") ?? ""), "ok", encodeURIComponent("조직명 변경 완료")));
                }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-2"
              >
                <input type="hidden" name="tenant_id" value={tenant.id} />
                <input type="hidden" name="return_qs" value={backQs} />
                <input
                  name="name"
                  required
                  defaultValue={tenant.name}
                  placeholder="조직명"
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold lg:col-span-3"
                />
                <button type="submit" className="h-10 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-teal-600">
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
                    redirect(withMessage(String(formData.get("return_qs") ?? ""), "err", encodeURIComponent(msg)));
                  }
                  redirect(withMessage(String(formData.get("return_qs") ?? ""), "ok", encodeURIComponent("멤버 저장 완료")));
                }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-2"
              >
                <input type="hidden" name="tenant_id" value={tenant.id} />
                <input type="hidden" name="return_qs" value={backQs} />
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
                <button type="submit" className="h-10 rounded-xl bg-teal-600 text-white text-sm font-black hover:bg-teal-700 inline-flex items-center justify-center gap-1">
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
                    const p = new URLSearchParams(String(formData.get("return_qs") ?? ""));
                    p.set("ok", encodeURIComponent("초대 토큰 발급 완료"));
                    p.set("invite_token", encodeURIComponent(result.token));
                    p.set("invite_exp", encodeURIComponent(result.expiresAt));
                    redirect(`/admin/tenants?${p.toString()}`);
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "초대 발급 실패";
                    redirect(withMessage(String(formData.get("return_qs") ?? ""), "err", encodeURIComponent(msg)));
                  }
                }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-2"
              >
                <input type="hidden" name="tenant_id" value={tenant.id} />
                <input type="hidden" name="return_qs" value={backQs} />
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
                <button type="submit" className="h-10 rounded-xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700">
                  초대 토큰 발급
                </button>
              </form>

              {tenant.invites.length > 0 ? (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2">
                  <p className="text-[11px] font-black uppercase text-indigo-600">Pending Invites</p>
                  {tenant.invites.map((iv) => (
                    <div key={iv.id} className="rounded-xl bg-white border border-indigo-100 px-3 py-2">
                      <p className="text-xs font-black text-slate-700">{iv.email} · {roleLabel(iv.role)}</p>
                      <p className="text-[11px] font-semibold text-indigo-700 break-all">token: {iv.token}</p>
                      <p className="text-[11px] font-semibold text-slate-500">expires: {new Date(iv.expires_at).toLocaleString("ko-KR")}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-[11px] font-black text-slate-500 px-3 py-2 uppercase">사용자</th>
                      <th className="text-left text-[11px] font-black text-slate-500 px-3 py-2 uppercase">Role</th>
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
                        <td className="px-3 py-3 text-xs font-semibold text-slate-400">{new Date(m.created_at).toLocaleString("ko-KR")}</td>
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
                                  redirect(withMessage(String(formData.get("return_qs") ?? ""), "err", encodeURIComponent(msg)));
                                }
                                redirect(withMessage(String(formData.get("return_qs") ?? ""), "ok", encodeURIComponent("권한 변경 완료")));
                              }}
                              className="flex items-center gap-2"
                            >
                              <input type="hidden" name="tenant_id" value={tenant.id} />
                              <input type="hidden" name="user_id" value={m.user_id} />
                              <input type="hidden" name="return_qs" value={backQs} />
                              <select name="role" defaultValue={m.role} className="h-8 rounded-lg border border-slate-200 px-2 text-xs font-bold">
                                <option value="member">멤버</option>
                                <option value="admin">관리자</option>
                                <option value="owner">소유자</option>
                              </select>
                              <button type="submit" className="h-8 rounded-lg bg-slate-800 px-2.5 text-[11px] font-black text-white hover:bg-slate-900">
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
                                  redirect(withMessage(String(formData.get("return_qs") ?? ""), "err", encodeURIComponent(msg)));
                                }
                                redirect(withMessage(String(formData.get("return_qs") ?? ""), "ok", encodeURIComponent("멤버 제거 완료")));
                              }}
                            >
                              <input type="hidden" name="tenant_id" value={tenant.id} />
                              <input type="hidden" name="user_id" value={m.user_id} />
                              <input type="hidden" name="return_qs" value={backQs} />
                              <button type="submit" className="h-8 rounded-lg border border-rose-200 px-2.5 text-[11px] font-black text-rose-600 hover:bg-rose-50">
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
          ))
        )}
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 lg:p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-black text-slate-900">조직 관리 감사 로그</h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400">아직 기록이 없습니다.</p>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-auto pr-1">
            {auditLogs.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-black text-slate-800">{row.action}</p>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {row.actor_email ?? "system"} · {new Date(row.created_at).toLocaleString("ko-KR")}
                </p>
                {row.payload ? (
                  <pre className="mt-1 text-[10px] font-semibold text-slate-500 whitespace-pre-wrap break-all">{row.payload}</pre>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="text-xs text-slate-400 font-bold inline-flex items-center gap-2">
        <UsersRound className="w-4 h-4" />
        마지막 owner는 강등/삭제할 수 없도록 보호됩니다.
      </div>
    </div>
  );
}
