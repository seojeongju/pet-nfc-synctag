"use client";

import { useEffect, useState, useTransition } from "react";
import { updateTagProductProfile } from "@/app/actions/admin";
import { SUBJECT_KINDS, subjectKindMeta } from "@/lib/subject-kind";
import { Button } from "@/components/ui/button";
import { AdminTableRow } from "@/components/admin/ui/AdminTable";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import type { AdminTag } from "@/types/admin-tags";

function getStatusLabel(status: string) {
  if (status === "active") return "활성";
  if (status === "unsold") return "미판매";
  if (status === "inactive") return "비활성";
  return status;
}

export function TagProductRow({
  tag,
  onAfterSave,
  mobile = false,
}: {
  tag: AdminTag;
  onAfterSave: () => void;
  mobile?: boolean;
}) {
  const [productName, setProductName] = useState(tag.product_name ?? "");
  const [mode, setMode] = useState(tag.assigned_subject_kind ?? "");
  const [ble, setBle] = useState(tag.ble_mac ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setProductName(tag.product_name ?? "");
    setMode(tag.assigned_subject_kind ?? "");
    setBle(tag.ble_mac ?? "");
  }, [tag.product_name, tag.assigned_subject_kind, tag.ble_mac, tag.id]);

  const save = () => {
    startTransition(async () => {
      try {
        await updateTagProductProfile(tag.id, {
          product_name: productName.trim() || null,
          assigned_subject_kind: mode.trim() || null,
          ble_mac: ble.trim() || null,
        });
        onAfterSave();
      } catch {
        /* toast optional */
      }
    });
  };

  if (mobile) {
    return (
      <div className={cn(adminUi.subtleCard, "rounded-2xl p-4 space-y-3 border border-slate-100")}>
        <div className="space-y-1">
          <p className="font-mono text-[11px] font-bold text-slate-700 break-all">{tag.id}</p>
          {tag.batch_id && <p className="text-[10px] text-slate-500 font-black">배치: {tag.batch_id}</p>}
        </div>

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
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold bg-white"
          >
            <option value="">미지정 (허브 선택)</option>
            {SUBJECT_KINDS.map((k) => (
              <option key={k} value={k}>
                {subjectKindMeta[k].label}
              </option>
            ))}
          </select>
          <input
            value={ble}
            onChange={(e) => setBle(e.target.value)}
            className="w-full font-mono rounded-lg border border-slate-200 px-3 py-2 text-[11px]"
            placeholder="AA:BB:…"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border",
              tag.status === "active"
                ? adminUi.successBadge
                : tag.status === "unsold"
                  ? adminUi.warningBadge
                  : adminUi.neutralBadge
            )}
          >
            {getStatusLabel(tag.status)}
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-9 text-[11px] font-black px-3"
            disabled={pending}
            onClick={save}
          >
            저장
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminTableRow className="group transition-all duration-300 align-top">
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-700 shrink-0 group-hover:bg-teal-500 transition-colors" />
          <span className="font-mono text-[10px] font-bold text-slate-700 break-all">{tag.id}</span>
        </div>
        {tag.batch_id && (
          <p className="text-[9px] text-slate-600 font-black mt-1 uppercase tracking-tighter">배치: {tag.batch_id}</p>
        )}
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
          <option value="">미지정 (허브 선택)</option>
          {SUBJECT_KINDS.map((k) => (
            <option key={k} value={k}>
              {subjectKindMeta[k].label}
            </option>
          ))}
        </select>
      </td>
      <td className="py-4 px-2">
        <input
          value={ble}
          onChange={(e) => setBle(e.target.value)}
          className="w-full min-w-[100px] font-mono rounded-lg border border-slate-200 px-2 py-1.5 text-[9px]"
          placeholder="AA:BB:…"
        />
      </td>
      <td className="py-4 px-2">
        <span
          className={cn(
            "inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
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
          <div className="space-y-0.5 max-w-[120px]">
            <p className={cn(adminUi.tableBodyCellStrong, "p-0 text-[11px] truncate")}>{tag.pet_name}</p>
            <p className="text-[9px] text-slate-500 font-bold truncate">{tag.owner_email}</p>
          </div>
        ) : (
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">미할당</span>
        )}
      </td>
      <td className={cn(adminUi.tableBodyCell, "py-4 px-2 text-[10px] font-black uppercase tabular-nums whitespace-nowrap")}>
        {new Date(tag.created_at).toLocaleDateString()}
      </td>
      <td className="py-4 px-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 text-[9px] font-black uppercase px-2"
          disabled={pending}
          onClick={save}
        >
          저장
        </Button>
      </td>
    </AdminTableRow>
  );
}
