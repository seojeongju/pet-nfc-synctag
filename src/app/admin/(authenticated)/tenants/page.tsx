import {
  getTenantAdminAuditLogs,
  getTenantsAdminView,
  adminCreateTenantFormAction,
  adminUpdateTenantStatusFormAction,
  adminUpdateTenantAllowedModesFormAction,
  adminRenameTenantFormAction,
  adminDeleteTenantFormAction,
  adminAddTenantMemberFormAction,
  adminCreateTenantInviteFormAction,
  adminChangeTenantMemberRoleFormAction,
  adminRemoveTenantMemberFormAction,
} from "@/app/actions/admin-tenants";
import { formatAllowedSubjectKindsSummaryKo, parseAllowedModesForForm } from "@/lib/mode-visibility";
import { SUBJECT_KINDS, subjectKindMeta } from "@/lib/subject-kind";
import { Building2, Search, ShieldCheck, UserPlus2, UsersRound } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";

export const runtime = "edge";

type SearchParams = Promise<{
  err?: string;
  ok?: string;
  q?: string;
  email?: string;
  status?: "all" | "active" | "suspended";
  created_tenant?: string;
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

function safeDecode(v: string | undefined): string {
  if (!v) return "";
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export default async function AdminTenantsPage({ searchParams }: { searchParams: SearchParams }) {
  const qs = await searchParams;
  const q = String(qs.q ?? "").trim();
  const email = String(qs.email ?? "").trim();
  const status = qs.status === "active" || qs.status === "suspended" ? qs.status : "all";
  const tenants = await getTenantsAdminView({ q, email, status });
  const auditLogs = await getTenantAdminAuditLogs(60);
  const backQs = buildBackQuery({ q, email, status });
  const newOrgModeForm = parseAllowedModesForForm(null);

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe, "space-y-6 pb-12 font-outfit")}>
      <header className="space-y-3">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600 sm:text-[10px]">
          MULTI TENANCY
        </p>
        <h1 className="text-[1.35rem] font-black leading-snug tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
          조직 · 멤버 관리
        </h1>
        <p className="text-[15px] font-semibold leading-relaxed text-slate-600 sm:text-sm sm:font-medium sm:text-slate-500">
          조직 생성(허용 모드 지정) · 멤버/역할 · 보호자에게 열릴 Link-U 모드까지 이 화면에서 처리할 수 있어요.
        </p>
      </header>

      {qs.err ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
          {safeDecode(qs.err)}
        </div>
      ) : null}
      {qs.ok ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-700">
          {safeDecode(qs.ok)}
        </div>
      ) : null}
      {qs.invite_token ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 break-all">
          초대 토큰 발급 완료: <span className="font-black">{safeDecode(qs.invite_token)}</span>
          {qs.invite_exp ? ` (만료: ${safeDecode(qs.invite_exp)})` : ""}
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
            className="min-h-[48px] touch-manipulation rounded-2xl border border-slate-200 px-4 text-base font-semibold sm:h-11 sm:text-sm"
          />
          <input
            name="email"
            defaultValue={email}
            placeholder="멤버 이메일"
            className="min-h-[48px] touch-manipulation rounded-2xl border border-slate-200 px-4 text-base font-semibold sm:h-11 sm:text-sm"
          />
          <select
            name="status"
            defaultValue={status}
            className="min-h-[48px] touch-manipulation rounded-2xl border border-slate-200 px-4 text-base font-semibold sm:h-11 sm:text-sm"
          >
            <option value="all">전체 상태</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
          </select>
          <button
            type="submit"
            className="min-h-[48px] touch-manipulation rounded-2xl bg-slate-900 text-[15px] font-black text-white hover:bg-teal-600 sm:h-11 sm:text-sm"
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
        <form action={adminCreateTenantFormAction} className="space-y-4">
          <input type="hidden" name="return_qs" value={backQs} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder="조직명"
              className="min-h-[48px] touch-manipulation rounded-2xl border border-slate-200 px-4 text-base font-semibold sm:h-11 sm:text-sm"
            />
            <input
              name="owner_email"
              required
              type="email"
              placeholder="소유자 이메일(가입된 계정)"
              className="min-h-[48px] touch-manipulation rounded-2xl border border-slate-200 px-4 text-base font-semibold sm:h-11 sm:text-sm"
            />
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 space-y-3">
            <div>
              <p className="text-[11px] font-black uppercase text-amber-800">보호자에게 보이는 Link-U 모드</p>
              <p className="text-[11px] font-semibold text-amber-900/80 mt-1">
                전체 허용이면 소속 보호자는 허브에서 5가지 모드를 볼 수 있어요. 특정 제품만 쓰면 제한하세요. (생성 직후에도
                아래 조직 카드에서 변경 가능)
              </p>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="unrestricted"
                value="1"
                defaultChecked={newOrgModeForm.unrestricted}
                className="mt-1 h-4 w-4 rounded border-amber-300"
              />
              <span className="text-sm font-bold text-slate-800">전체 모드 허용 (제한 없음)</span>
            </label>
            <div className="pl-6 space-y-2 border-t border-amber-100/80 pt-3">
              <p className="text-[10px] font-black text-slate-500 uppercase">또는 허용할 모드만 선택</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {SUBJECT_KINDS.map((k) => (
                  <label key={k} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      name="mode"
                      value={k}
                      defaultChecked={!newOrgModeForm.unrestricted && newOrgModeForm.selected.includes(k)}
                      className="h-3.5 w-3.5 rounded border-slate-300"
                    />
                    {subjectKindMeta[k].label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="min-h-[48px] w-full touch-manipulation rounded-2xl bg-slate-900 text-[15px] font-black text-white hover:bg-teal-600 sm:h-11"
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
          tenants.map((tenant) => {
            const modeForm = parseAllowedModesForForm(tenant.allowed_subject_kinds);
            return (
            <article
              key={tenant.id}
              className={cn(
                "rounded-3xl border border-slate-100 bg-white p-5 lg:p-6 shadow-sm space-y-4",
                qs.created_tenant === tenant.id && "ring-2 ring-teal-300/70"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-900">{tenant.name}</p>
                  <p className="text-xs font-bold text-slate-400">slug: {tenant.slug} · members: {tenant.member_count}</p>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    현재 요약: {formatAllowedSubjectKindsSummaryKo(tenant.allowed_subject_kinds)}
                  </p>
                  <Link
                    href={`/hub/org/${encodeURIComponent(tenant.id)}/manage`}
                    className="inline-block mt-1 text-[11px] font-black text-teal-600 hover:underline"
                  >
                    허브에서 멤버·초대·감사 로그
                  </Link>
                </div>
                <form action={adminUpdateTenantStatusFormAction} className="flex items-center gap-2">
                  <input type="hidden" name="tenant_id" value={tenant.id} />
                  <input type="hidden" name="return_qs" value={backQs} />
                  <select name="status" defaultValue={tenant.status} className="min-h-11 touch-manipulation rounded-xl border border-slate-200 px-3 text-sm font-bold sm:h-9 sm:text-xs">
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                  </select>
                  <button type="submit" className="min-h-11 touch-manipulation rounded-xl bg-slate-900 px-4 text-[12px] font-black text-white sm:h-9 sm:px-3 sm:text-[11px]">
                    상태 저장
                  </button>
                </form>
              </div>

              <form action={adminUpdateTenantAllowedModesFormAction} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 space-y-3">
                <input type="hidden" name="tenant_id" value={tenant.id} />
                <input type="hidden" name="return_qs" value={backQs} />
                <p className="text-[11px] font-black uppercase text-amber-800">보호자 허용 모드 (인라인 편집)</p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="unrestricted"
                    value="1"
                    defaultChecked={modeForm.unrestricted}
                    className="mt-1 h-4 w-4 rounded border-amber-300"
                  />
                  <span className="text-sm font-bold text-slate-800">전체 모드 허용 (제한 없음)</span>
                </label>
                <div className="pl-6 space-y-2 border-t border-amber-100/80 pt-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase">또는 허용할 모드만 선택</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {SUBJECT_KINDS.map((k) => (
                      <label key={k} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          name="mode"
                          value={k}
                          defaultChecked={!modeForm.unrestricted && modeForm.selected.includes(k)}
                          className="h-3.5 w-3.5 rounded border-slate-300"
                        />
                        {subjectKindMeta[k].label}
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="h-9 rounded-xl bg-amber-700 text-white text-xs font-black px-4 hover:bg-amber-800"
                >
                  허용 모드 저장
                </button>
              </form>

              <form action={adminRenameTenantFormAction} className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                <input type="hidden" name="tenant_id" value={tenant.id} />
                <input type="hidden" name="return_qs" value={backQs} />
                <input
                  name="name"
                  required
                  defaultValue={tenant.name}
                  placeholder="조직명"
                  className="min-h-12 touch-manipulation rounded-xl border border-slate-200 px-3 text-base font-semibold sm:h-10 sm:text-sm lg:col-span-3"
                />
                <button type="submit" className="min-h-12 touch-manipulation rounded-xl bg-slate-900 text-[15px] font-black text-white hover:bg-teal-600 sm:h-10 sm:text-sm">
                  조직명 저장
                </button>
              </form>

              <form action={adminDeleteTenantFormAction} className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4 space-y-2">
                <input type="hidden" name="tenant_id" value={tenant.id} />
                <input type="hidden" name="return_qs" value={backQs} />
                <p className="text-[11px] font-black uppercase text-rose-700">위험 작업 · 조직 삭제</p>
                <p className="text-[12px] font-semibold text-rose-800/80">
                  삭제하려면 조직명 <span className="font-black">{tenant.name}</span> 을(를) 정확히 입력하세요.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    name="confirm_name"
                    required
                    placeholder={tenant.name}
                    className="min-h-12 touch-manipulation rounded-xl border border-rose-200 px-3 text-base font-semibold sm:h-10 sm:text-sm sm:col-span-2"
                  />
                  <button
                    type="submit"
                    className="min-h-12 touch-manipulation rounded-xl bg-rose-600 text-[15px] font-black text-white hover:bg-rose-700 sm:h-10 sm:text-sm"
                  >
                    조직 삭제
                  </button>
                </div>
              </form>

              <form action={adminAddTenantMemberFormAction} className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                <input type="hidden" name="tenant_id" value={tenant.id} />
                <input type="hidden" name="return_qs" value={backQs} />
                <input
                  name="email"
                  required
                  type="email"
                  placeholder="멤버 이메일"
                  className="min-h-12 touch-manipulation rounded-xl border border-slate-200 px-3 text-base font-semibold sm:h-10 sm:text-sm lg:col-span-2"
                />
                <select name="role" defaultValue="member" className="min-h-12 touch-manipulation rounded-xl border border-slate-200 px-3 text-base font-bold sm:h-10 sm:text-sm">
                  <option value="member">멤버</option>
                  <option value="admin">관리자</option>
                  <option value="owner">소유자</option>
                </select>
                <button type="submit" className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-1 rounded-xl bg-teal-600 px-2 text-[15px] font-black text-white hover:bg-teal-700 sm:h-10 sm:text-sm">
                  <UserPlus2 className="w-4 h-4" />
                  멤버 추가/갱신
                </button>
              </form>

              <form action={adminCreateTenantInviteFormAction} className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                <input type="hidden" name="tenant_id" value={tenant.id} />
                <input type="hidden" name="return_qs" value={backQs} />
                <input
                  name="email"
                  required
                  type="email"
                  placeholder="미가입 사용자 이메일"
                  className="min-h-12 touch-manipulation rounded-xl border border-slate-200 px-3 text-base font-semibold sm:h-10 sm:text-sm lg:col-span-2"
                />
                <select name="role" defaultValue="member" className="min-h-12 touch-manipulation rounded-xl border border-slate-200 px-3 text-base font-bold sm:h-10 sm:text-sm">
                  <option value="member">멤버</option>
                  <option value="admin">관리자</option>
                  <option value="owner">소유자</option>
                </select>
                <button type="submit" className="min-h-12 touch-manipulation rounded-xl bg-indigo-600 px-2 text-[15px] font-black text-white hover:bg-indigo-700 sm:h-10 sm:text-sm">
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
                            <form action={adminChangeTenantMemberRoleFormAction} className="flex items-center gap-2">
                              <input type="hidden" name="tenant_id" value={tenant.id} />
                              <input type="hidden" name="user_id" value={m.user_id} />
                              <input type="hidden" name="return_qs" value={backQs} />
                              <select name="role" defaultValue={m.role} className="min-h-10 touch-manipulation rounded-lg border border-slate-200 px-2 text-[13px] font-bold sm:h-8 sm:text-xs">
                                <option value="member">멤버</option>
                                <option value="admin">관리자</option>
                                <option value="owner">소유자</option>
                              </select>
                              <button type="submit" className="min-h-10 touch-manipulation rounded-lg bg-slate-800 px-3 text-[12px] font-black text-white hover:bg-slate-900 sm:h-8 sm:px-2.5 sm:text-[11px]">
                                저장
                              </button>
                            </form>

                            <form action={adminRemoveTenantMemberFormAction}>
                              <input type="hidden" name="tenant_id" value={tenant.id} />
                              <input type="hidden" name="user_id" value={m.user_id} />
                              <input type="hidden" name="return_qs" value={backQs} />
                              <button type="submit" className="min-h-10 touch-manipulation rounded-lg border border-rose-200 px-3 text-[12px] font-black text-rose-600 hover:bg-rose-50 sm:h-8 sm:px-2.5 sm:text-[11px]">
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
            );
          })
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
