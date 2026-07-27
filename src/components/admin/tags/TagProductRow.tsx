"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { deleteInventoryTagAdmin, updateTagProductProfile } from "@/app/actions/admin";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { Button } from "@/components/ui/button";
import { AdminTableRow } from "@/components/admin/ui/AdminTable";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import type { AdminTag, AdminWayfinderSpotPickRow } from "@/types/admin-tags";
import { AdminInlineContextBlock } from "@/components/admin/ui/AdminInlineContextBlock";
import { formatOwnerPrimaryLine } from "@/lib/admin-uid-context";
import { ChevronDown, Trash2 } from "lucide-react";

function getStatusLabel(status: string) {
  if (status === "active") return "활성";
  if (status === "unsold") return "미판매";
  if (status === "inactive") return "비활성";
  return status;
}

function WayfinderInventorySpotSelect({
  value,
  onChange,
  wayfinderSpotOptions,
  orphan,
  previewSlug,
  compact,
}: {
  value: string;
  onChange: (next: string) => void;
  wayfinderSpotOptions: AdminWayfinderSpotPickRow[];
  orphan: { id: string; label: string } | null;
  previewSlug: string;
  compact?: boolean;
}) {
  const selectClass = compact
    ? "w-full max-w-[200px] rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-bold bg-white"
    : "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold";
  return (
    <div className={cn("space-y-1", compact ? "" : "mt-1")}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">동행 없음</option>
        {orphan ? (
          <option value={orphan.id}>
            {orphan.label} (외)
          </option>
        ) : null}
        {wayfinderSpotOptions.map((s) => (
          <option key={s.id} value={s.id}>
            {(s.title || s.slug).trim()}
            {Number(s.is_published) !== 1 ? " · 미발행" : ""}
          </option>
        ))}
      </select>
      {previewSlug ? (
        <Link
          href={`/wayfinder/s/${encodeURIComponent(previewSlug)}`}
          className="inline-block truncate text-[10px] font-black text-teal-700 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          미리보기
        </Link>
      ) : null}
    </div>
  );
}

export function TagProductRow({
  tag,
  wayfinderSpotOptions,
  onAfterSave,
  mobile = false,
}: {
  tag: AdminTag;
  wayfinderSpotOptions: AdminWayfinderSpotPickRow[];
  onAfterSave: () => void;
  mobile?: boolean;
}) {
  const [productName, setProductName] = useState(tag.product_name ?? "");
  const [mode, setMode] = useState(tag.assigned_subject_kind ?? "");
  const [ble, setBle] = useState(tag.ble_mac ?? "");
  const [wayfinderSpotId, setWayfinderSpotId] = useState(() => (tag.wayfinder_spot_id ?? "").trim());
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setProductName(tag.product_name ?? "");
    setMode(tag.assigned_subject_kind ?? "");
    setBle(tag.ble_mac ?? "");
    setWayfinderSpotId((tag.wayfinder_spot_id ?? "").trim());
    setMobileOpen(false);
  }, [tag.product_name, tag.assigned_subject_kind, tag.ble_mac, tag.id, tag.wayfinder_spot_id]);

  const linkedWfId = (tag.wayfinder_spot_id ?? "").trim();
  const wfMissingFromList =
    Boolean(linkedWfId) && !wayfinderSpotOptions.some((o) => o.id === linkedWfId);

  const previewSlug =
    wayfinderSpotOptions.find((o) => o.id === wayfinderSpotId)?.slug?.trim() ||
    (wayfinderSpotId === linkedWfId ? (tag.wayfinder_spot_slug ?? "").trim() : "");

  const wfSummaryLabel =
    !wayfinderSpotId.trim()
      ? ""
      : wayfinderSpotOptions.find((o) => o.id === wayfinderSpotId)?.title?.trim() ||
        wayfinderSpotOptions.find((o) => o.id === wayfinderSpotId)?.slug?.trim() ||
        (wayfinderSpotId === linkedWfId
          ? (tag.wayfinder_spot_title ?? tag.wayfinder_spot_slug ?? "").trim()
          : "동행");

  const save = () => {
    startTransition(async () => {
      try {
        await updateTagProductProfile(tag.id, {
          product_name: productName.trim() || null,
          assigned_subject_kind: mode.trim() || null,
          ble_mac: ble.trim() || null,
          wayfinder_spot_id: wayfinderSpotId.trim() || null,
        });
        onAfterSave();
      } catch (e) {
        alert(e instanceof Error ? e.message : "저장에 실패했습니다.");
      }
    });
  };

  const linkedToPet = Boolean((tag.pet_id ?? "").trim() || (tag.pet_name ?? "").trim());

  const removeFromInventory = () => {
    if (linkedToPet) return;
    if (!confirm(`삭제할까요?\n${tag.id}`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteInventoryTagAdmin(tag.id);
        onAfterSave();
      } catch (e) {
        alert(e instanceof Error ? e.message : "삭제에 실패했습니다.");
      }
    });
  };

  if (mobile) {
    const modeLabel =
      mode && (SUBJECT_KINDS as readonly string[]).includes(mode)
        ? subjectKindMeta[mode as SubjectKind].label
        : "모드 미지정";
    return (
      <div className={cn(adminUi.subtleCard, "overflow-hidden rounded-2xl border border-slate-100")}>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex w-full items-start gap-2 p-3 text-left touch-manipulation hover:bg-slate-50/80"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <AdminInlineContextBlock
              primary={tag.id}
              sublines={[
                tag.pet_name || tag.owner_email
                  ? [
                      tag.pet_name ?? null,
                      formatOwnerPrimaryLine(null, tag.owner_email) || null,
                    ].filter(Boolean).join(" · ") || null
                  : "미연결",
              ]}
            />
            {tag.batch_id && (
              <p className="text-[9px] font-black text-slate-500">{tag.batch_id}</p>
            )}
            {!mobileOpen && (
              <p className="line-clamp-1 text-[10px] font-semibold text-slate-600">
                {productName.trim() || "—"} · {modeLabel} · {getStatusLabel(tag.status)}
                {wfSummaryLabel ? ` · ${wfSummaryLabel}` : ""}
              </p>
            )}
          </div>
          <ChevronDown
            className={cn("mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform", mobileOpen && "rotate-180")}
            aria-hidden
          />
        </button>

        {mobileOpen && (
          <div className="space-y-3 border-t border-slate-100 p-3">
            <WayfinderInventorySpotSelect
              value={wayfinderSpotId}
              onChange={setWayfinderSpotId}
              wayfinderSpotOptions={wayfinderSpotOptions}
              orphan={
                wfMissingFromList
                  ? {
                      id: linkedWfId,
                      label:
                        (tag.wayfinder_spot_title ?? tag.wayfinder_spot_slug ?? linkedWfId).trim() ||
                        linkedWfId,
                    }
                  : null
              }
              previewSlug={previewSlug}
            />
            <div className="grid grid-cols-1 gap-2">
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium"
                placeholder="제품명"
              />
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold"
              >
                <option value="">모드 미지정</option>
                {SUBJECT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {subjectKindMeta[k].label}
                  </option>
                ))}
              </select>
              <input
                value={ble}
                onChange={(e) => setBle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-[11px]"
                placeholder="BLE MAC"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={cn(
                  "inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-black",
                  tag.status === "active"
                    ? adminUi.successBadge
                    : tag.status === "unsold"
                      ? adminUi.warningBadge
                      : adminUi.neutralBadge
                )}
              >
                {getStatusLabel(tag.status)}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-9 px-3 text-[11px] font-black"
                  disabled={pending}
                  onClick={save}
                >
                  저장
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 border-rose-200 px-3 text-[11px] font-black text-rose-700 hover:bg-rose-50"
                  disabled={pending || linkedToPet}
                  title={linkedToPet ? "연결 해제 후 삭제" : "삭제"}
                  onClick={removeFromInventory}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <AdminTableRow className="group transition-all duration-300 align-top">
      <td className="py-4 px-4">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 mt-1 rounded-full bg-slate-700 shrink-0 group-hover:bg-teal-500 transition-colors" />
          <div className="min-w-0 flex-1">
            <AdminInlineContextBlock
              primary={tag.id}
              sublines={[
                tag.pet_name || tag.owner_email
                  ? [
                      tag.pet_name ?? null,
                      formatOwnerPrimaryLine(null, tag.owner_email) || null,
                    ]
                      .map((s) => (s ?? "").trim())
                      .filter(Boolean)
                      .join(" · ") || null
                  : "미연결",
              ]}
            />
            {tag.batch_id && (
              <p className="mt-1 text-[9px] font-black text-slate-500">{tag.batch_id}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 px-2">
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full min-w-[88px] rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-medium"
          placeholder="제품명"
        />
      </td>
      <td className="py-4 px-2">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full max-w-[160px] rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-bold bg-white"
        >
          <option value="">미지정</option>
          {SUBJECT_KINDS.map((k) => (
            <option key={k} value={k}>
              {subjectKindMeta[k].label}
            </option>
          ))}
        </select>
      </td>
      <td className="py-4 px-2 align-top">
        <WayfinderInventorySpotSelect
          value={wayfinderSpotId}
          onChange={setWayfinderSpotId}
          wayfinderSpotOptions={wayfinderSpotOptions}
          orphan={
            wfMissingFromList
              ? {
                  id: linkedWfId,
                  label:
                    (tag.wayfinder_spot_title ?? tag.wayfinder_spot_slug ?? linkedWfId).trim() || linkedWfId,
                }
              : null
          }
          previewSlug={previewSlug}
          compact
        />
      </td>
      <td className="py-4 px-2">
        <input
          value={ble}
          onChange={(e) => setBle(e.target.value)}
          className="w-full min-w-[100px] font-mono rounded-lg border border-slate-200 px-2 py-1.5 text-[9px]"
          placeholder="BLE MAC"
        />
      </td>
      <td className="py-4 px-2">
        <span
          className={cn(
            "inline-flex rounded-lg border px-2 py-1 text-[9px] font-black",
            tag.status === "active"
              ? adminUi.successBadge
              : tag.status === "unsold"
                ? adminUi.warningBadge
                : adminUi.neutralBadge
          )}
        >
          {getStatusLabel(tag.status)}
        </span>
      </td>
      <td className="py-4 px-2">
        {tag.pet_name ? (
          <div className="max-w-[120px] space-y-0.5">
            <p className={cn(adminUi.tableBodyCellStrong, "truncate p-0 text-[11px]")}>{tag.pet_name}</p>
            <p className="truncate text-[9px] font-bold text-slate-500">{tag.owner_email}</p>
          </div>
        ) : (
          <span className="text-[10px] font-black text-slate-400">—</span>
        )}
      </td>
      <td className={cn(adminUi.tableBodyCell, "whitespace-nowrap px-2 py-4 text-[10px] font-bold tabular-nums")}>
        {new Date(tag.created_at).toLocaleDateString()}
      </td>
      <td className="px-2 py-4">
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 px-2 text-[10px] font-black"
            disabled={pending}
            onClick={save}
          >
            저장
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-rose-200 px-2 text-rose-700 hover:bg-rose-50"
            disabled={pending || linkedToPet}
            title={linkedToPet ? "연결됨" : "삭제"}
            onClick={removeFromInventory}
          >
            <Trash2 className="mx-auto h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </td>
    </AdminTableRow>
  );
}
