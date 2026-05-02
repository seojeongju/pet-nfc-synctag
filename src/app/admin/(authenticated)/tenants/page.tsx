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
  adminResetTenantManagerPasswordFormAction,
} from "@/app/actions/admin-tenants";
import { formatAllowedSubjectKindsSummaryKo, parseAllowedModesForForm } from "@/lib/mode-visibility";
import { SUBJECT_KINDS, subjectKindMeta } from "@/lib/subject-kind";
import { Building2, ChevronDown, Search, ShieldCheck, UserPlus2, UsersRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";
import OwnerPasswordField from "@/components/admin/tenants/OwnerPasswordField";
import AdminTenantPasswordFlash from "@/components/admin/tenants/AdminTenantPasswordFlash";
import { cookies } from "next/headers";
import { resolveAdminScope } from "@/lib/admin-authz";

export const runtime = "edge";

import { auditActionLabelKo } from "@/lib/tenant-audit-format";

const PAYLOAD_FIELD_LABELS: Record<string, string> = {
  tenantId: "조직 ID",
  name: "조직명",
  slug: "고유 슬러그",
  ownerEmail: "소유자 이메일",
  ownerUserCreated: "계정 생성 여부",
  ownerCredentialCreated: "비밀번호 생성 여부",
  allowed_subject_kinds: "허용 모드",
  email: "이메일",
  role: "역할",
  userId: "사용자 ID",
  status: "상태",
  confirm_name: "확인용 조직명"
};

function formatPayloadValue(val: unknown): string {
  if (val === true) return "예";
  if (val === false) return "아니오";
  if (val === null || val === undefined) return "없음";
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).join(", ");
      }
    } catch {
      // ignore
    }
  }
  return String(val);
}

function parseAndRenderPayload(payload: string | null) {
  if (!payload) return null;
  try {
    const obj = JSON.parse(payload);
    if (typeof obj !== "object" || obj === null) {
      return (
        <pre className="mt-1 text-[10px] font-semibold text-slate-500 whitespace-pre-wrap break-all">
          {payload}
        </pre>
      );
    }
    return (
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {Object.entries(obj).map(([key, val]) => (
          <div
            key={key}
            className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[11px] font-bold"
          >
            <span className="text-slate-400 font-black">
              {PAYLOAD_FIELD_LABELS[key] || key}
            </span>
            <span className="text-slate-700 font-black truncate max-w-[200px]">
              {formatPayloadValue(val)}
            </span>
          </div>
        ))}
      </div>
    );
  } catch {
    return (
      <pre className="mt-1 text-[10px] font-semibold text-slate-500 whitespace-pre-wrap break-all">
        {payload}
      </pre>
    );
  }
}

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
  if (role === "owner") return "소유자- 조직관리자";
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
  const scope = await resolveAdminScope("admin");
  if (!scope.actor.isPlatformAdmin) {
    redirect("/hub/org/manage");
  }
  const cookieStore = await cookies();
  const flashRaw = cookieStore.get("admin_tenant_pw_flash")?.value ?? "";
  let passwordFlash: { tenantId: string; email: string; temporaryPassword: string } | null = null;
  if (flashRaw) {
    try {
      const parsed = JSON.parse(flashRaw) as {
        tenantId?: string;
        email?: string;
        temporaryPassword?: string;
        createdAt?: number;
      };
      if (
        typeof parsed.tenantId === "string" &&
        typeof parsed.email === "string" &&
        typeof parsed.temporaryPassword === "string"
      ) {
        passwordFlash = {
          tenantId: parsed.tenantId,
          email: parsed.email,
          temporaryPassword: parsed.temporaryPassword,
        };
      }
    } catch {
      passwordFlash = null;
    }
    // 쿠키 삭제는 Server Component에서 불가(런타임 예외). 플래시 UI 마운트 후 Server Action으로 처리한다.
  }

  const qs = await searchParams;
  const q = String(qs.q ?? "").trim();
  const email = String(qs.email ?? "").trim();
  const status = qs.status === "active" || qs.status === "suspended" ? qs.status : "all";
  const tenants = await getTenantsAdminView({ q, email, status });
  const auditLogs = await getTenantAdminAuditLogs(60);
  const backQs = buildBackQuery({ q, email, status });
  const newOrgModeForm = parseAllowedModesForForm(null);
  const passwordFlashInTenantList =
    !!passwordFlash && tenants.some((t) => t.id === passwordFlash.tenantId);

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
          조직 생성 · 멤버/역할 · 계약/통계용 모드 태그. 보호자 앱의 모드 사용은 정책상 제한하지 않으며, 아래 &quot;보호자
          모드&quot; 필드는 참고·기록용입니다.
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
      {passwordFlash && !passwordFlashInTenantList ? (
        <AdminTenantPasswordFlash
          variant="page"
          email={passwordFlash.email}
          temporaryPassword={passwordFlash.temporaryPassword}
        />
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
              placeholder="조직관리자 이메일"
              className="min-h-[48px] touch-manipulation rounded-2xl border border-slate-200 px-4 text-base font-semibold sm:h-11 sm:text-sm"
            />
            <OwnerPasswordField />
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 space-y-3">
            <div>
              <p className="text-[11px] font-black uppercase text-amber-800">계약·통계용 모드 태그 (앱 접근 비연동)</p>
              <p className="text-[11px] font-semibold text-amber-900/80 mt-1">
                앱에서는 모든 보호자가 5가지 모드를 사용할 수 있어요. 여기서는 제품·계약 정리를 위해 &quot;주로 쓰는
                모드&quot;만 기록할 수 있습니다(앱 접근을 막지 않음). 생성 직후에도 조직 카드에서 변경 가능합니다.
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
              <p className="text-[10px] font-black text-slate-500 uppercase">또는 기록할 모드만 선택</p>
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
                (qs.created_tenant === tenant.id || passwordFlash?.tenantId === tenant.id) && "ring-2 ring-teal-300/70"
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
                <p className="text-[11px] font-black uppercase text-amber-800">
                  계약·통계용 모드 태그 (인라인 · 앱 접근 비연동)
                </p>
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
                  <p className="text-[10px] font-black text-slate-500 uppercase">또는 기록할 모드만 선택</p>
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
                  모드 태그 저장
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

              <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 space-y-3">
                <p className="text-[11px] font-black uppercase text-violet-700">조직관리자 이메일/비밀번호 찾기</p>
                <p className="text-[12px] font-semibold text-violet-900/80">
                  owner/admin 계정의 이메일을 확인하고, 필요 시 임시 비밀번호를 재생성할 수 있습니다.
                </p>
                {tenant.members.filter((m) => m.role === "owner" || m.role === "admin").length === 0 ? (
                  <p className="text-xs font-semibold text-slate-500">등록된 조직관리자 계정이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {tenant.members
                      .filter((m) => m.role === "owner" || m.role === "admin")
                      .map((m) => (
                        <div
                          key={`manager-${tenant.id}-${m.user_id}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-100 bg-white px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-800 break-all">{m.email}</p>
                            <p className="text-[11px] font-semibold text-slate-500">{roleLabel(m.role)}</p>
                          </div>
                          <form action={adminResetTenantManagerPasswordFormAction}>
                            <input type="hidden" name="tenant_id" value={tenant.id} />
                            <input type="hidden" name="user_id" value={m.user_id} />
                            <input type="hidden" name="return_qs" value={backQs} />
                            <button
                              type="submit"
                              className="h-9 rounded-xl border border-amber-200 bg-amber-50 px-3 text-[11px] font-black text-amber-700 hover:bg-amber-100"
                            >
                              임시 비밀번호 재생성
                            </button>
                          </form>
                        </div>
                      ))}
                  </div>
                )}
                {passwordFlash && passwordFlash.tenantId === tenant.id ? (
                  <AdminTenantPasswordFlash
                    variant="inline"
                    email={passwordFlash.email}
                    temporaryPassword={passwordFlash.temporaryPassword}
                  />
                ) : null}
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
          <div className="space-y-2 max-h-[400px] overflow-auto pr-1">
            {auditLogs.map((row) => (
              <details
                key={row.id}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 open:border-slate-200/90"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-100/80 [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <ChevronDown
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ease-out group-open:rotate-180"
                    />
                    <span className="text-xs font-black text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded-lg border border-slate-200/80">
                      {auditActionLabelKo(row.action)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-[10px] font-bold text-slate-400 max-w-[min(100%,14rem)] sm:max-w-none">
                    {row.actor_email ?? "system"} · {new Date(row.created_at).toLocaleString("ko-KR")}
                  </span>
                </summary>
                <div className="border-t border-slate-100/80 bg-white/50 px-4 py-3">
                  {parseAndRenderPayload(row.payload) ?? (
                    <p className="text-xs font-semibold text-slate-400">상세 본문이 없습니다.</p>
                  )}
                </div>
              </details>
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
