"use client";

import { useId, useMemo, useState, useTransition, type ComponentType, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  Trash2,
  Save,
  Upload,
  FileText,
  ImageIcon,
  Target,
  PenLine,
  Paperclip,
  CalendarClock,
  ListOrdered,
  ChevronDown,
  Info,
  Sparkles,
} from "lucide-react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import type { ModeAnnouncementRow, ModeAnnouncementStatus } from "@/types/mode-announcement";
import {
  deleteModeAnnouncement,
  listModeAnnouncementsForAdmin,
  saveModeAnnouncement,
  uploadModeAnnouncementFile,
  type SaveModeAnnouncementInput,
} from "@/app/actions/mode-announcements";

const statuses: ModeAnnouncementStatus[] = ["draft", "published", "archived"];

function statusLabel(s: ModeAnnouncementStatus) {
  if (s === "draft") return "초안";
  if (s === "published") return "발행";
  return "보관";
}

/** 모바일에서 터치·가독성용 입력 스타일 (16px 이상으로 iOS 자동 확대 완화) */
const fieldClass = cn(
  adminUi.input,
  "min-h-[44px] w-full rounded-2xl px-4 text-base sm:text-sm font-semibold text-slate-800 shadow-inner shadow-slate-900/[0.02]",
  "focus:border-teal-400 focus:ring-2 focus:ring-teal-500/25"
);

const textareaClass = cn(
  "w-full min-h-[140px] rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-base sm:text-sm font-semibold text-slate-800 outline-none",
  "shadow-inner shadow-slate-900/[0.02] focus:border-teal-400 focus:ring-2 focus:ring-teal-500/25"
);

function statusBadgeClass(s: ModeAnnouncementStatus) {
  if (s === "published") return "border-teal-200 bg-teal-50 text-teal-800";
  if (s === "draft") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-100/90 bg-gradient-to-b from-white to-slate-50/40 p-4 sm:p-5 shadow-sm">
      <div className="mb-4 flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black tracking-tight text-slate-900">{title}</h3>
          {description && <p className="mt-0.5 text-[13px] font-medium leading-snug text-slate-500 sm:text-xs">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function ModeAnnouncementsAdminClient({
  initialRows,
  isPlatformAdmin,
}: {
  initialRows: ModeAnnouncementRow[];
  isPlatformAdmin: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const emptyForm: SaveModeAnnouncementInput = useMemo(
    () => ({
      subject_kind: "pet",
      target_batch_id: null,
      target_tenant_id: null,
      title: "",
      body: null,
      link_url: null,
      attachment_r2_key: null,
      attachment_mime: null,
      attachment_kind: null,
      priority: 0,
      status: "draft",
      published_at: null,
      expires_at: null,
    }),
    []
  );

  const [form, setForm] = useState<SaveModeAnnouncementInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputId = useId();
  const editingRow = useMemo(() => rows.find((r) => r.id === editingId), [rows, editingId]);

  const refresh = () => {
    startTransition(async () => {
      const next = await listModeAnnouncementsForAdmin();
      setRows(next);
    });
  };

  const onUpload = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      try {
        const r = await uploadModeAnnouncementFile(fd);
        setForm((f) => ({
          ...f,
          attachment_r2_key: r.r2Key,
          attachment_mime: r.mime,
          attachment_kind: r.kind,
        }));
        setMessage("첨부 파일이 준비되었습니다. 저장하면 반영됩니다.");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "업로드 실패");
      }
    });
  };

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        await saveModeAnnouncement({
          ...form,
          id: editingId ?? undefined,
        });
        setMessage("저장되었습니다.");
        setForm(emptyForm);
        setEditingId(null);
        refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "저장 실패");
      }
    });
  };

  const onEdit = (r: ModeAnnouncementRow) => {
    setEditingId(r.id);
    const toLocalInput = (s: string | null) =>
      s ? s.replace(" ", "T").slice(0, 16) : null;
    setForm({
      subject_kind: r.subject_kind,
      target_batch_id: r.target_batch_id,
      target_tenant_id: r.target_tenant_id ?? null,
      title: r.title,
      body: r.body,
      link_url: r.link_url,
      attachment_r2_key: r.attachment_r2_key,
      attachment_mime: r.attachment_mime,
      attachment_kind: r.attachment_kind,
      priority: r.priority,
      status: r.status,
      published_at: toLocalInput(r.published_at),
      expires_at: toLocalInput(r.expires_at),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = (id: string) => {
    if (!confirm("이 공지를 삭제할까요? 첨부 파일도 삭제됩니다.")) return;
    startTransition(async () => {
      try {
        await deleteModeAnnouncement(id);
        if (editingId === id) {
          setEditingId(null);
          setForm(emptyForm);
        }
        refresh();
        setMessage("삭제되었습니다.");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "삭제 실패");
      }
    });
  };

  return (
    <div
      className={cn(
        adminUi.pageContainer,
        "space-y-6 sm:space-y-8",
        adminUi.pageBottomSafe,
        "pt-2 sm:pt-0"
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-teal-800">
            <Megaphone className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-[11px] font-black uppercase tracking-wider">운영 공지</span>
          </div>
          <span className="hidden text-[11px] font-semibold text-slate-400 sm:inline">모바일·태블릿 우선 화면</span>
        </div>
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-[1.35rem] font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
            모드·배치별 공지
          </h1>
          <p className="text-[15px] font-semibold leading-snug text-slate-600 sm:max-w-xl sm:text-sm sm:font-bold sm:text-slate-500">
            보호자 대시보드 상단 배너에 노출되는 안내입니다. 아래 폼은 터치하기 쉽게 구성했습니다.
          </p>
        </div>

        <details className="group rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm open:shadow-md">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left sm:py-3">
            <span className="flex min-w-0 items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
              <span className="text-[13px] font-black text-slate-800 sm:text-sm">노출 규칙 · 도움말</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="border-t border-slate-100 px-4 pb-4 pt-1 text-[14px] font-medium leading-relaxed text-slate-600 sm:text-xs sm:font-bold sm:leading-relaxed">
            모드(펫·메모리·키즈·러기지·골드)와 선택 배치(batch_id), 선택 조직 ID(B2B)로 대상을 좁힐 수 있습니다. 조직 ID가 있으면 해당{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-teal-800">?tenant=</code>에서만 보입니다.
            링크·이미지·PDF를 함께 넣을 수 있습니다. 세부 노출 규칙은 팀 운영 문서를 참고하세요.
          </div>
        </details>
      </motion.div>

      {message && (
        <div
          role="status"
          className="flex gap-3 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3.5 text-[15px] font-bold text-teal-950 shadow-sm sm:text-sm"
        >
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" aria-hidden />
          <span>{message}</span>
        </div>
      )}

      {editingId && editingRow && (
        <div className="flex gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/90 px-4 py-3 text-[13px] font-semibold text-indigo-950 sm:text-xs sm:font-bold">
          <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
          <p className="min-w-0 leading-snug">
            수정 중: <span className="font-black">{editingRow.title}</span>
          </p>
        </div>
      )}

      <AdminCard variant="section" className="overflow-hidden shadow-xl shadow-slate-200/40">
        <CardContent className="space-y-6 p-5 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-base">
                {editingId ? "공지 수정" : "새 공지 작성"}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-slate-500 sm:text-[11px] sm:font-bold">
                필수는 제목뿐입니다. 발행 전에는 초안으로 두고 미리보기 용도로 쓸 수 있습니다.
              </p>
            </div>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                className="h-12 shrink-0 rounded-2xl border-slate-200 px-5 text-[13px] font-black touch-manipulation sm:h-10 sm:text-[11px]"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                새로 작성
              </Button>
            )}
          </div>

          <FormSection
            icon={Target}
            title="대상 설정"
            description="어떤 모드·배치·조직에 보일지 정합니다."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
                  모드
                </span>
                <select
                  className={fieldClass}
                  value={form.subject_kind}
                  onChange={(e) => setForm((f) => ({ ...f, subject_kind: e.target.value as SubjectKind }))}
                >
                  {SUBJECT_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {subjectKindMeta[k].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
                  배치 ID (선택)
                </span>
                <input
                  className={fieldClass}
                  placeholder="비우면 해당 모드 전체"
                  value={form.target_batch_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, target_batch_id: e.target.value.trim() || null }))
                  }
                  autoComplete="off"
                />
              </label>
            </div>

            {isPlatformAdmin ? (
              <label className="space-y-2 block">
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
                  조직 ID (선택, B2B)
                </span>
                <input
                  className={cn(fieldClass, "font-mono text-[15px] sm:text-sm")}
                  placeholder="비우면 개인 대시보드·모든 조직에 공통"
                  value={form.target_tenant_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, target_tenant_id: e.target.value.trim() || null }))
                  }
                  autoComplete="off"
                />
                <p className="text-[13px] font-medium leading-relaxed text-slate-500 sm:text-[10px] sm:font-bold">
                  테넌트 목록의 조직 ID. 값이 있으면 해당{" "}
                  <span className="font-mono text-slate-600">?tenant=</span> 대시보드에서만 노출됩니다.
                </p>
              </label>
            ) : (
              <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-[12px] font-bold text-teal-800">
                조직관리자 계정은 본인 조직 대상 공지로 자동 적용됩니다.
              </div>
            )}
          </FormSection>

          <FormSection icon={PenLine} title="내용" description="보호자에게 보이는 제목과 본문입니다.">
            <label className="space-y-2 block">
              <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
                제목 <span className="text-rose-500">*</span>
              </span>
              <input
                className={fieldClass}
                placeholder="예: 설 연휴 고객센터 운영 안내"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                autoComplete="off"
              />
            </label>

            <label className="space-y-2 block">
              <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">본문</span>
              <textarea
                className={textareaClass}
                placeholder="보호자에게 전달할 내용을 입력하세요."
                value={form.body ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value || null }))}
              />
            </label>

            <label className="space-y-2 block">
              <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
                외부 링크 (선택)
              </span>
              <input
                className={fieldClass}
                placeholder="https://..."
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                value={form.link_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value.trim() || null }))}
              />
            </label>
          </FormSection>

          <FormSection
            icon={Paperclip}
            title="첨부 파일"
            description="배너에서 이미지 또는 PDF를 열 수 있습니다. 최대 15MB."
          >
            <input
              id={fileInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => {
                onUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label
                htmlFor={fileInputId}
                className={cn(
                  "inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-5 py-3.5 text-[15px] font-black text-teal-900 touch-manipulation transition-colors active:bg-teal-100 sm:min-h-0 sm:py-2.5 sm:text-sm",
                  isPending && "pointer-events-none opacity-60"
                )}
              >
                <Upload className="h-5 w-5 shrink-0" aria-hidden />
                파일 선택
              </label>
              {form.attachment_r2_key ? (
                <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex min-w-0 items-center gap-2 text-[13px] font-bold text-slate-800">
                    {form.attachment_kind === "image" ? (
                      <ImageIcon className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                    )}
                    <span>{form.attachment_kind === "image" ? "이미지 연결됨" : "PDF 연결됨"}</span>
                  </p>
                  <button
                    type="button"
                    className="h-11 min-w-[88px] rounded-xl border border-rose-100 bg-white text-[13px] font-black text-rose-600 touch-manipulation sm:h-9 sm:text-xs"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        attachment_r2_key: null,
                        attachment_mime: null,
                        attachment_kind: null,
                      }))
                    }
                  >
                    첨부 제거
                  </button>
                </div>
              ) : (
                <p className="text-[13px] font-medium text-slate-500 sm:text-[11px] sm:font-bold">
                  JPG·PNG·WebP 또는 PDF를 선택하세요.
                </p>
              )}
            </div>
          </FormSection>

          <FormSection
            icon={CalendarClock}
            title="발행 설정"
            description="상태·순위·유효 기간으로 노출을 제어합니다."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">상태</span>
                <select
                  className={fieldClass}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ModeAnnouncementStatus }))}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
                  우선순위
                </span>
                <input
                  type="number"
                  className={fieldClass}
                  inputMode="numeric"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
                />
                <span className="block text-[12px] font-medium text-slate-400 sm:text-[10px] sm:font-bold">
                  숫자가 클수록 위에 표시
                </span>
              </label>
              <label className="space-y-2">
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
                  발행 시각 (선택)
                </span>
                <input
                  type="datetime-local"
                  className={fieldClass}
                  value={form.published_at?.replace(" ", "T").slice(0, 16) ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      published_at: e.target.value ? e.target.value.replace("T", " ") + ":00" : null,
                    }))
                  }
                />
              </label>
            </div>

            <label className="space-y-2 block max-w-full sm:max-w-md">
              <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 sm:text-[10px]">
                만료 시각 (선택)
              </span>
              <input
                type="datetime-local"
                className={fieldClass}
                value={form.expires_at?.replace(" ", "T").slice(0, 16) ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    expires_at: e.target.value ? e.target.value.replace("T", " ") + ":00" : null,
                  }))
                }
              />
            </label>
          </FormSection>

          <Button
            type="button"
            disabled={isPending || !form.title.trim()}
            onClick={submit}
            className="h-14 w-full touch-manipulation rounded-2xl border-0 bg-slate-900 text-[16px] font-black text-white shadow-lg shadow-slate-900/20 hover:bg-teal-600 sm:h-12 sm:w-auto sm:min-w-[200px] sm:px-10 sm:text-sm"
          >
            <Save className="mr-2 h-5 w-5 sm:h-4 sm:w-4" aria-hidden />
            {isPending ? "저장 중…" : editingId ? "변경 저장" : "공지 저장"}
          </Button>
        </CardContent>
      </AdminCard>

      <AdminCard variant="subtle" className="border-slate-100 shadow-md">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-slate-400" aria-hidden />
            <h3 className="text-sm font-black tracking-tight text-slate-800">등록된 공지</h3>
            <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-black text-slate-600">
              {rows.length}건
            </span>
          </div>
          <div className="space-y-3">
            {rows.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-[15px] font-semibold text-slate-500 sm:text-sm">
                아직 등록된 공지가 없습니다. 위 폼에서 첫 공지를 만들어 보세요.
              </p>
            )}
            {rows.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "rounded-[22px] border bg-white p-4 shadow-sm transition-shadow",
                  editingId === r.id ? "border-teal-300 ring-2 ring-teal-100" : "border-slate-100"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-black",
                          statusBadgeClass(r.status)
                        )}
                      >
                        {statusLabel(r.status)}
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-wide text-teal-700">
                        {subjectKindMeta[r.subject_kind].label}
                      </span>
                    </div>
                    <p className="text-[17px] font-black leading-snug text-slate-900 sm:text-base">{r.title}</p>
                    <p className="text-[12px] font-semibold leading-relaxed text-slate-500 sm:text-[11px] sm:font-bold">
                      {r.target_batch_id ? `배치 ${r.target_batch_id}` : "모드 전체"}
                      {r.target_tenant_id ? ` · 조직 ${r.target_tenant_id}` : ""}
                      {" · "}우선 {r.priority}
                      {r.published_at ? ` · 발행 ${r.published_at}` : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 touch-manipulation rounded-xl text-[13px] font-black sm:h-10 sm:text-[11px]"
                      onClick={() => onEdit(r)}
                    >
                      수정
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 touch-manipulation rounded-xl border-rose-100 text-[13px] font-black text-rose-600 sm:h-10 sm:text-[11px]"
                      onClick={() => onDelete(r.id)}
                      aria-label={`${r.title} 삭제`}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4 sm:mr-1 sm:h-3.5 sm:w-3.5" aria-hidden />
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </AdminCard>
    </div>
  );
}
