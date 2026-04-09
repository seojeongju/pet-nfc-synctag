import {
  adminAddTenantMember,
  adminChangeTenantMemberRole,
  adminCreateTenantInvite,
  adminRemoveTenantMember,
  adminRenameTenant,
  getTenantOrgAuditLogs,
  getTenantOrgManageContext,
  type TenantAuditLogRow,
} from "@/app/actions/admin-tenants";
import { TENANT_AUDIT_ACTIONS } from "@/lib/tenant-audit-constants";
import { auditActionLabelKo, formatTenantAuditRow } from "@/lib/tenant-audit-format";
import { Building2, ChevronLeft, FileDown, ScrollText, ShieldCheck, UserPlus2 } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const runtime = "edge";

type SearchParams = Promise<{
  err?: string;
  ok?: string;
  invite_token?: string;
  invite_exp?: string;
  audit_action?: string;
  audit_q?: string;
}>;

function roleLabel(role: "owner" | "admin" | "member") {
  if (role === "owner") return "소유자";
  if (role === "admin") return "관리자";
  return "멤버";
}

function withMessage(tenantId: string, key: "ok" | "err", value: string) {
  return `/hub/org/${tenantId}/manage?${key}=${encodeURIComponent(value)}`;
}

async function getPublicOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim();
  if (fromEnv) return fromEnv;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
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

  const auditActionRaw = typeof qs.audit_action === "string" ? qs.audit_action.trim() : "";
  const auditQRaw = typeof qs.audit_q === "string" ? qs.audit_q.trim() : "";

  const auditLogs = await getTenantOrgAuditLogs(tenantId, {
    action: auditActionRaw || undefined,
    actorContains: auditQRaw || undefined,
    limit: 200,
  }).catch(() => [] as TenantAuditLogRow[]);

  const publicOrigin = await getPublicOrigin();

  const exportParams = new URLSearchParams();
  if (auditActionRaw) exportParams.set("audit_action", auditActionRaw);
  if (auditQRaw) exportParams.set("audit_q", auditQRaw);
  const auditExportHref = `/hub/org/${tenantId}/manage/audit-export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit p-5 lg:p-8 space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/hub"
            className="inline-flex items-center gap-1 text-xs font-black text-teal-600 hover:text-teal-700"
          >
            <ChevronLeft className="h-4 w-4" />
            허브로
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-teal-600">
            모드 선택(랜딩)
          </Link>
        </div>
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
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800 space-y-2">
          <p>
            초대 링크는 발급 시점부터 <span className="text-indigo-900">7일간</span> 유효합니다. 받는 분께 아래 주소를 전달하세요.
          </p>
          {(() => {
            const tok = decodeURIComponent(qs.invite_token);
            const href = `/invite/${encodeURIComponent(tok)}`;
            const absolute = publicOrigin ? `${publicOrigin}${href}` : href;
            return (
              <p className="break-all">
                <Link href={href} className="underline font-black text-indigo-700 hover:text-indigo-900">
                  {absolute}
                </Link>
              </p>
            );
          })()}
          <p className="text-xs font-semibold text-indigo-600">
            토큰: <span className="font-mono font-black">{decodeURIComponent(qs.invite_token)}</span>
            {qs.invite_exp ? ` · 만료(UTC 기준): ${decodeURIComponent(qs.invite_exp)}` : ""}
          </p>
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
        <p className="text-[11px] font-semibold text-slate-500 -mt-2">
          미가입 사용자에게만 사용하세요. 초대 링크는 <span className="text-slate-700 font-bold">7일간</span> 유효하며, 형식은{" "}
          <code className="rounded bg-slate-100 px-1 text-[10px]">/invite/토큰</code> 입니다.
        </p>

        {tenant.invites.length > 0 ? (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2">
            <p className="text-[11px] font-black uppercase text-indigo-600">대기 중인 초대</p>
            {tenant.invites.map((iv) => {
              const invitePath = `/invite/${encodeURIComponent(iv.token)}`;
              const inviteUrl = publicOrigin ? `${publicOrigin}${invitePath}` : invitePath;
              const exp = new Date(iv.expires_at);
              const expStr = Number.isNaN(exp.getTime()) ? iv.expires_at : exp.toLocaleString("ko-KR");
              return (
                <div key={iv.id} className="rounded-xl bg-white border border-indigo-100 px-3 py-2 space-y-1.5">
                  <p className="text-xs font-black text-slate-700">
                    {iv.email} · {roleLabel(iv.role)}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    만료: <span className="text-slate-700">{expStr}</span>
                  </p>
                  <p className="text-[11px] font-semibold break-all">
                    <Link href={invitePath} className="text-indigo-700 font-bold hover:underline">
                      {inviteUrl}
                    </Link>
                  </p>
                </div>
              );
            })}
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

      <article className="rounded-3xl border border-slate-100 bg-white p-5 lg:p-6 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-900">
            <ScrollText className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">조직 활동 기록</p>
              <p className="text-sm font-bold text-slate-500">이 조직에 대한 최근 관리 작업(감사 로그)</p>
            </div>
          </div>
          <a
            href={auditExportHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50 hover:border-teal-200"
          >
            <FileDown className="w-4 h-4 text-teal-600" />
            CSV 내보내기
          </a>
        </div>

        <form method="get" className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-end">
          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500 min-w-[140px] flex-1">
            유형
            <select
              name="audit_action"
              defaultValue={auditActionRaw}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold bg-white"
            >
              <option value="">전체</option>
              {TENANT_AUDIT_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {auditActionLabelKo(a)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500 min-w-[160px] flex-[1.2]">
            실행자 이메일
            <input
              name="audit_q"
              type="search"
              defaultValue={auditQRaw}
              placeholder="부분 검색"
              autoComplete="off"
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
            />
          </label>
          <button
            type="submit"
            className="h-10 rounded-xl bg-slate-800 px-4 text-sm font-black text-white hover:bg-teal-600 sm:self-end"
          >
            필터 적용
          </button>
        </form>

        {auditLogs.length === 0 ? (
          <p className="text-sm font-semibold text-slate-400">조건에 맞는 기록이 없습니다.</p>
        ) : (
          <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50">
            {auditLogs.map((row) => {
              const { label, summary, when, who } = formatTenantAuditRow(row);
              return (
                <li key={row.id} className="px-3 py-2.5 text-sm">
                  <p className="font-black text-slate-800">{label}</p>
                  {summary ? <p className="text-xs font-semibold text-slate-600 mt-0.5">{summary}</p> : null}
                  <p className="text-[11px] font-semibold text-slate-400 mt-1">
                    {when} · {who}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </article>

      <p className="text-xs text-slate-400 font-bold">마지막 소유자는 강등·삭제할 수 없습니다. 조직 상태(active/suspended) 변경은 플랫폼 관리자만 할 수 있습니다.</p>
    </div>
  );
}
