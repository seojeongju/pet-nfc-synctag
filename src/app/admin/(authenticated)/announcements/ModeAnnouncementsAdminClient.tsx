"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Megaphone, Trash2, Save, Upload, FileText, ImageIcon } from "lucide-react";
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

export default function ModeAnnouncementsAdminClient({ initialRows }: { initialRows: ModeAnnouncementRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const emptyForm: SaveModeAnnouncementInput = useMemo(
    () => ({
      subject_kind: "pet",
      target_batch_id: null,
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
    <div className={cn(adminUi.pageContainer, "space-y-8 pb-16")}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-2 text-teal-600 font-black text-[10px] uppercase tracking-[0.2em]">
          <Megaphone className="w-4 h-4" />
          운영 공지
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">모드·배치별 공지</h1>
        <p className="text-slate-500 text-sm font-bold max-w-xl">
          모드(펫·메모리·키즈·캐리)와 선택적 배치(batch_id)를 지정해 보호자 대시보드에 안내를 표시합니다. 링크·이미지·PDF를
          함께 넣을 수 있습니다.
        </p>
      </motion.div>

      {message && (
        <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-900">
          {message}
        </div>
      )}

      <AdminCard variant="section">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-sm font-black text-slate-800">{editingId ? "공지 수정" : "새 공지 작성"}</h2>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-black text-[10px]"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                새로 작성
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase">모드</span>
              <select
                className={cn(adminUi.input, "w-full h-11")}
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
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase">배치 ID (선택)</span>
              <input
                className={cn(adminUi.input, "w-full h-11")}
                placeholder="비우면 해당 모드 전체"
                value={form.target_batch_id ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target_batch_id: e.target.value.trim() || null }))
                }
              />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-[10px] font-black text-slate-400 uppercase">제목</span>
            <input
              className={cn(adminUi.searchInput, "h-12")}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[10px] font-black text-slate-400 uppercase">본문</span>
            <textarea
              className="w-full min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20"
              placeholder="보호자에게 전달할 내용"
              value={form.body ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value || null }))}
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-[10px] font-black text-slate-400 uppercase">외부 링크 (선택)</span>
            <input
              className={cn(adminUi.input, "w-full h-11")}
              placeholder="https://..."
              value={form.link_url ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value.trim() || null }))}
            />
          </label>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
              <Upload className="w-3.5 h-3.5" />
              첨부 (이미지 또는 PDF, 최대 15MB)
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => onUpload(e.target.files)} />
            {form.attachment_r2_key && (
              <p className="text-xs font-mono font-bold text-slate-600 break-all">
                {form.attachment_kind === "image" ? (
                  <span className="inline-flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> 이미지 연결됨
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> PDF 연결됨
                  </span>
                )}
                <button
                  type="button"
                  className="ml-2 text-rose-600 font-black"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      attachment_r2_key: null,
                      attachment_mime: null,
                      attachment_kind: null,
                    }))
                  }
                >
                  제거
                </button>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase">상태</span>
              <select
                className={cn(adminUi.input, "w-full h-11")}
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
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase">우선순위 (큰 숫자가 먼저)</span>
              <input
                type="number"
                className={cn(adminUi.input, "w-full h-11")}
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase">발행 시각 (선택)</span>
              <input
                type="datetime-local"
                className={cn(adminUi.input, "w-full h-11")}
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

          <label className="space-y-1.5 block max-w-md">
            <span className="text-[10px] font-black text-slate-400 uppercase">만료 시각 (선택)</span>
            <input
              type="datetime-local"
              className={cn(adminUi.input, "w-full h-11")}
              value={form.expires_at?.replace(" ", "T").slice(0, 16) ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  expires_at: e.target.value ? e.target.value.replace("T", " ") + ":00" : null,
                }))
              }
            />
          </label>

          <Button
            type="button"
            disabled={isPending || !form.title.trim()}
            onClick={submit}
            className="w-full sm:w-auto rounded-2xl h-12 px-8 font-black bg-slate-900 hover:bg-teal-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {isPending ? "저장 중…" : "저장"}
          </Button>
        </CardContent>
      </AdminCard>

      <AdminCard variant="subtle">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">등록된 공지</h3>
          <div className="space-y-3">
            {rows.length === 0 && <p className="text-sm font-bold text-slate-400">아직 공지가 없습니다.</p>}
            {rows.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-black text-teal-600 uppercase tracking-tight">
                    {subjectKindMeta[r.subject_kind].label}
                    {r.target_batch_id ? ` · 배치 ${r.target_batch_id}` : " · 모드 전체"}
                  </p>
                  <p className="font-black text-slate-900 truncate">{r.title}</p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {statusLabel(r.status)} · 우선 {r.priority}
                    {r.published_at ? ` · 발행 ${r.published_at}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button type="button" variant="outline" size="sm" className="font-black text-[10px]" onClick={() => onEdit(r)}>
                    수정
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-black text-[10px] text-rose-600 border-rose-100"
                    onClick={() => onDelete(r.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </AdminCard>
    </div>
  );
}
