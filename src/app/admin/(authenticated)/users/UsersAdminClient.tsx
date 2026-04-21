"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { AdminUserListRow, PlanCodeOption, PlatformUserRole } from "@/app/actions/admin-users";
import {
  adminSetUserPassword,
  deleteUserAdmin,
  updateUserEmailAdmin,
  updateUserPlatformRole,
  updateUserSubscriptionStatusAdmin,
} from "@/app/actions/admin-users";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLATFORM_ADMIN_ROLE } from "@/lib/platform-admin";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Mail,
  Search,
  Shield,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

function isPlatformAdminStored(role: string | null): boolean {
  return role === PLATFORM_ADMIN_ROLE || role === "admin";
}

function roleLabel(role: string | null): string {
  return isPlatformAdminStored(role) ? "플랫폼 관리자" : "일반 사용자";
}

function mergePlanOpts(planOptions: PlanCodeOption[], subscriptionStatus: string | null): PlanCodeOption[] {
  const raw = (subscriptionStatus ?? "free").trim() || "free";
  const map = new Map<string, PlanCodeOption>();
  for (const p of planOptions) {
    map.set(p.code.toLowerCase(), p);
  }
  if (!map.has(raw.toLowerCase())) {
    map.set(raw.toLowerCase(), { code: raw, name: `${raw} (목록 외)` });
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

function buildHref(q: string, role: string, page: number) {
  const p = new URLSearchParams();
  if (q.trim()) p.set("q", q.trim());
  if (role !== "all") p.set("role", role);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

type ModalState =
  | null
  | {
      kind: "email" | "password";
      user: AdminUserListRow;
    };

export default function UsersAdminClient({
  initialRows,
  total,
  page,
  pageSize,
  initialQ,
  initialRole,
  planOptions,
}: {
  initialRows: AdminUserListRow[];
  total: number;
  page: number;
  pageSize: number;
  initialQ: string;
  initialRole: string;
  planOptions: PlanCodeOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<ModalState>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [passwordDraft, setPasswordDraft] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const planOptsByUser = useMemo(() => {
    const m = new Map<string, PlanCodeOption[]>();
    for (const u of initialRows) {
      m.set(u.id, mergePlanOpts(planOptions, u.subscriptionStatus));
    }
    return m;
  }, [initialRows, planOptions]);

  const handleRoleSave = (userId: string, next: PlatformUserRole) => {
    const row = initialRows.find((r) => r.id === userId);
    const currentRole: PlatformUserRole =
      row && isPlatformAdminStored(row.role) ? "platform_admin" : "user";
    if (currentRole === next) return;
    const verb =
      next === "platform_admin"
        ? "이 사용자를 플랫폼 관리자로 승격할까요?"
        : "플랫폼 관리자에서 일반 사용자로 내릴까요? 마지막 관리자는 변경할 수 없습니다.";
    if (!confirm(verb)) return;
    startTransition(async () => {
      try {
        await updateUserPlatformRole(userId, next);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "처리 중 오류가 발생했습니다.");
      }
    });
  };

  const handleSubscriptionSave = (userId: string, code: string) => {
    startTransition(async () => {
      try {
        await updateUserSubscriptionStatusAdmin(userId, code);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "구독 코드 저장에 실패했습니다.");
      }
    });
  };

  const openEmailModal = (u: AdminUserListRow) => {
    setEmailDraft(u.email ?? "");
    setModal({ kind: "email", user: u });
  };

  const openPasswordModal = (u: AdminUserListRow) => {
    setPasswordDraft("");
    setPasswordConfirm("");
    setModal({ kind: "password", user: u });
  };

  const submitEmail = () => {
    if (!modal || modal.kind !== "email") return;
    startTransition(async () => {
      try {
        await updateUserEmailAdmin(modal.user.id, emailDraft);
        setModal(null);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "이메일 변경에 실패했습니다.");
      }
    });
  };

  const submitPassword = () => {
    if (!modal || modal.kind !== "password") return;
    if (passwordDraft !== passwordConfirm) {
      alert("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    startTransition(async () => {
      try {
        await adminSetUserPassword(modal.user.id, passwordDraft);
        setModal(null);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "비밀번호 초기화에 실패했습니다.");
      }
    });
  };

  const handleDelete = (u: AdminUserListRow) => {
    const ok = confirm(
      `계정을 영구 삭제합니다: ${u.email}\n연결된 세션·펫 등 연관 데이터가 삭제될 수 있습니다. 계속할까요?`
    );
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteUserAdmin(u.id);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "계정 삭제에 실패했습니다.");
      }
    });
  };

  return (
    <>
      <AdminCard variant="section" className="overflow-hidden">
        <form action="/admin/users" method="get" className="rounded-[22px] border border-slate-100 bg-gradient-to-b from-slate-50/80 to-white p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-slate-600">
            <Search className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">검색 및 필터</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4">
            <label className="space-y-1.5 sm:col-span-5">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">이메일·이름</span>
              <input
                name="q"
                defaultValue={initialQ}
                placeholder="검색어"
                className={cn(
                  adminUi.input,
                  "min-h-[48px] w-full rounded-2xl text-base font-semibold shadow-inner focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 sm:min-h-[44px] sm:text-xs sm:font-bold"
                )}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-4">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">플랫폼 역할</span>
              <select
                name="role"
                defaultValue={initialRole}
                className={cn(
                  adminUi.input,
                  "min-h-[48px] w-full rounded-2xl text-base font-semibold shadow-inner focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 sm:min-h-[44px] sm:text-xs sm:font-bold"
                )}
              >
                <option value="all">전체</option>
                <option value="user">일반 사용자만</option>
                <option value="platform_admin">플랫폼 관리자만</option>
              </select>
            </label>
            <div className="flex items-end sm:col-span-3">
              <button
                type="submit"
                className="min-h-12 w-full touch-manipulation rounded-2xl bg-slate-900 px-4 text-[14px] font-black text-white hover:bg-teal-600 sm:min-h-[44px] sm:text-xs"
              >
                적용
              </button>
            </div>
          </div>
        </form>
      </AdminCard>

      <AdminCard variant="subtle" className="border-slate-100 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-slate-800">
            <UsersRound className="h-5 w-5 text-teal-600" aria-hidden />
            <span className="text-[15px] font-black sm:text-sm">목록</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-black text-slate-600">
              {total.toLocaleString()}명
            </span>
          </div>
          <p className="text-[13px] font-semibold tabular-nums text-slate-500 sm:text-xs">
            {total === 0 ? "0" : `${rangeStart}–${rangeEnd}`} · {page}/{totalPages}페이지
          </p>
        </div>

        <div className="space-y-3 p-4 sm:hidden">
          {initialRows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-[15px] font-semibold text-slate-500">
              조건에 맞는 사용자가 없습니다.
            </p>
          ) : (
            initialRows.map((u) => (
              <div
                key={u.id}
                className="rounded-[22px] border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.03]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-black text-slate-900">{u.email}</p>
                    <p className="mt-0.5 text-[13px] font-semibold text-slate-500">{u.name || "이름 없음"}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black",
                      isPlatformAdminStored(u.role)
                        ? "border-violet-200 bg-violet-50 text-violet-800"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    )}
                  >
                    {roleLabel(u.role)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-semibold text-slate-500">
                  <span>펫 {Number(u.pet_count)}</span>
                  <label className="block text-right">
                    <span className="sr-only">개인 플랜 코드</span>
                    <select
                      className={cn(
                        adminUi.input,
                        "min-h-10 w-full rounded-xl text-[12px] font-bold sm:text-[11px]"
                      )}
                      defaultValue={(u.subscriptionStatus ?? "free").trim() || "free"}
                      disabled={pending}
                      onChange={(e) => handleSubscriptionSave(u.id, e.target.value)}
                    >
                      {(planOptsByUser.get(u.id) ?? []).map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="mt-4 block space-y-1.5">
                  <span className="text-[11px] font-black uppercase text-slate-400">플랫폼 역할 변경</span>
                  <div className="flex gap-2">
                    <select
                      className={cn(
                        adminUi.input,
                        "min-h-12 flex-1 rounded-xl text-[14px] font-bold sm:min-h-10 sm:text-xs"
                      )}
                      defaultValue={isPlatformAdminStored(u.role) ? "platform_admin" : "user"}
                      disabled={pending}
                      onChange={(e) => handleRoleSave(u.id, e.target.value as PlatformUserRole)}
                    >
                      <option value="user">일반 사용자</option>
                      <option value="platform_admin">플랫폼 관리자</option>
                    </select>
                  </div>
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="touch-manipulation"
                    disabled={pending}
                    onClick={() => openEmailModal(u)}
                  >
                    <Mail className="mr-1 h-3.5 w-3.5" aria-hidden />
                    이메일
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="touch-manipulation"
                    disabled={pending}
                    onClick={() => openPasswordModal(u)}
                  >
                    <KeyRound className="mr-1 h-3.5 w-3.5" aria-hidden />
                    비밀번호
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="touch-manipulation border-red-200 text-red-700 hover:bg-red-50"
                    disabled={pending}
                    onClick={() => handleDelete(u)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                    삭제
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto custom-scrollbar md:block">
          <table className="w-full text-left">
            <thead>
              <tr className={adminUi.tableHeadRow}>
                <th className={cn(adminUi.tableHeadCell, "min-w-[200px]")}>이메일</th>
                <th className={adminUi.tableHeadCell}>이름</th>
                <th className={adminUi.tableHeadCell}>플랫폼 역할</th>
                <th className={cn(adminUi.tableHeadCell, "min-w-[140px]")}>개인 플랜</th>
                <th className={adminUi.tableHeadCell}>펫 수</th>
                <th className={adminUi.tableHeadCell}>가입일</th>
                <th className={cn(adminUi.tableHeadCell, "min-w-[160px]")}>역할 변경</th>
                <th className={cn(adminUi.tableHeadCell, "min-w-[200px]")}>관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm font-bold text-slate-500">
                    조건에 맞는 사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                initialRows.map((u) => (
                  <tr key={u.id} className={adminUi.tableRowHover}>
                    <td className={cn(adminUi.tableBodyCellStrong, "max-w-[240px] truncate font-mono text-[11px]")}>
                      {u.email}
                    </td>
                    <td className={adminUi.tableBodyCell}>{u.name || "—"}</td>
                    <td className={adminUi.tableBodyCell}>
                      <span className="inline-flex items-center gap-1">
                        {isPlatformAdminStored(u.role) ? (
                          <Shield className="h-3.5 w-3.5 text-violet-500" aria-hidden />
                        ) : (
                          <UserRound className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                        )}
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className={adminUi.tableBodyCell}>
                      <select
                        className={cn(adminUi.input, "min-h-9 w-full max-w-[220px] text-[11px] font-bold")}
                        defaultValue={(u.subscriptionStatus ?? "free").trim() || "free"}
                        disabled={pending}
                        onChange={(e) => handleSubscriptionSave(u.id, e.target.value)}
                      >
                        {(planOptsByUser.get(u.id) ?? []).map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={cn(adminUi.tableBodyCell, "tabular-nums")}>{Number(u.pet_count)}</td>
                    <td className={cn(adminUi.tableBodyCell, "text-slate-400")}>
                      {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        className={cn(adminUi.input, "min-h-9 w-full max-w-[180px] text-[11px] font-bold")}
                        defaultValue={isPlatformAdminStored(u.role) ? "platform_admin" : "user"}
                        disabled={pending}
                        onChange={(e) => handleRoleSave(u.id, e.target.value as PlatformUserRole)}
                      >
                        <option value="user">일반 사용자</option>
                        <option value="platform_admin">플랫폼 관리자</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-[10px] font-black"
                          disabled={pending}
                          onClick={() => openEmailModal(u)}
                        >
                          <Mail className="mr-1 h-3 w-3" aria-hidden />
                          이메일
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-[10px] font-black"
                          disabled={pending}
                          onClick={() => openPasswordModal(u)}
                        >
                          <KeyRound className="mr-1 h-3 w-3" aria-hidden />
                          비밀번호
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-red-200 px-2 text-[10px] font-black text-red-700 hover:bg-red-50"
                          disabled={pending}
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" aria-hidden />
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-4 py-4 sm:flex-row sm:px-6">
            <Link
              href={buildHref(initialQ, initialRole, Math.max(1, page - 1))}
              className={cn(
                "inline-flex min-h-12 items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-black touch-manipulation hover:bg-slate-50",
                page <= 1 && "pointer-events-none opacity-40"
              )}
              aria-disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              이전
            </Link>
            <span className="text-[13px] font-black tabular-nums text-slate-700">
              {page} / {totalPages}
            </span>
            <Link
              href={buildHref(initialQ, initialRole, Math.min(totalPages, page + 1))}
              className={cn(
                "inline-flex min-h-12 items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-black touch-manipulation hover:bg-slate-50",
                page >= totalPages && "pointer-events-none opacity-40"
              )}
              aria-disabled={page >= totalPages}
            >
              다음
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </AdminCard>

      <p className="flex flex-wrap items-start gap-2 text-[12px] font-semibold leading-relaxed text-slate-500">
        <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        플랫폼 관리자는 `/admin` 전역 메뉴에 접근할 수 있습니다. 개인 플랜 코드는 활성 개인 구독이 있을 때보다 우선하지 않을
        수 있습니다. 조직(B2B) 요금은{" "}
        <Link href="/admin/tenants" className="font-black text-teal-700 underline-offset-2 hover:underline">
          테넌트 관리
        </Link>
        에서 다룹니다.
      </p>

      <Dialog open={modal?.kind === "email"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>이메일 변경</DialogTitle>
            <DialogDescription>
              로그인 ID로 쓰이는 이메일입니다. 다른 사용자와 중복되면 저장할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          {modal?.kind === "email" && (
            <div className="space-y-3">
              <Label htmlFor="admin-email-input">새 이메일</Label>
              <Input
                id="admin-email-input"
                type="email"
                autoComplete="off"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                className="min-h-11"
              />
            </div>
          )}
          <DialogFooter className="mt-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setModal(null)} disabled={pending}>
              취소
            </Button>
            <Button type="button" onClick={submitEmail} disabled={pending}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal?.kind === "password"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>비밀번호 초기화</DialogTitle>
            <DialogDescription>
              credential 계정 비밀번호를 덮어씁니다. OAuth만 쓰던 사용자에게는 로그인용 비밀번호 계정을 추가합니다. 기존
              로그인 세션은 모두 종료됩니다.
            </DialogDescription>
          </DialogHeader>
          {modal?.kind === "password" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pw1">새 비밀번호 (8–128자)</Label>
                <Input
                  id="pw1"
                  type="password"
                  autoComplete="new-password"
                  value={passwordDraft}
                  onChange={(e) => setPasswordDraft(e.target.value)}
                  className="min-h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw2">확인</Label>
                <Input
                  id="pw2"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="min-h-11"
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setModal(null)} disabled={pending}>
              취소
            </Button>
            <Button type="button" onClick={submitPassword} disabled={pending}>
              적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
