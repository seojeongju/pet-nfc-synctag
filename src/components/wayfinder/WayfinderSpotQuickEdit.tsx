"use client";

import Link from "next/link";
import { Building2, ExternalLink, Eye, Phone, Save, Trash2 } from "lucide-react";
import { updateWayfinderSpotForm, deleteWayfinderSpotForm } from "@/app/actions/wayfinder-spots";
import type { WayfinderSpotRow } from "@/lib/wayfinder-spots-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { absoluteUrl } from "@/lib/seo";
import { WayfinderSpotUrlCopy } from "@/components/wayfinder/WayfinderSpotUrlCopy";
import { WfIconBadge } from "@/components/wayfinder/wayfinder-dashboard-ui";

type Props = {
  spot: WayfinderSpotRow;
  tenantId: string | null;
  listHref: string;
  canEdit: boolean;
};

export function WayfinderSpotQuickEdit({ spot, tenantId, listHref, canEdit }: Props) {
  const publicUrl = absoluteUrl(`/wayfinder/s/${spot.slug}`);

  if (!canEdit) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
        이 지점을 수정할 권한이 없습니다.
        <Link href={listHref} className="ml-1 font-black text-indigo-600 underline">
          목록
        </Link>
      </p>
    );
  }

  return (
    <section className="space-y-4 overflow-hidden rounded-[28px] border border-indigo-100 bg-white shadow-lg">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-indigo-50/50 px-4 py-4">
        <WfIconBadge icon={Building2} tone="indigo" size="lg" soft />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-black text-slate-900">지점 수정</h1>
          <p className="truncate text-xs font-semibold text-slate-500">{spot.title}</p>
        </div>
        {spot.is_published ? (
          <Link
            href={`/wayfinder/s/${encodeURIComponent(spot.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200 bg-white text-indigo-700 shadow-sm hover:bg-indigo-50"
            aria-label="미리보기"
            title="미리보기"
          >
            <ExternalLink className="h-5 w-5" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="flex items-center gap-2 px-4">
        <WayfinderSpotUrlCopy url={publicUrl} />
        <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-bold text-slate-500">{publicUrl}</span>
      </div>

      <form action={updateWayfinderSpotForm} className="space-y-4 px-4 pb-5">
        <input type="hidden" name="id" value={spot.id} />
        {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
        <input type="hidden" name="slug" value={spot.slug} />

        <div className="relative">
          <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" aria-hidden />
          <Input
            id="ed-title"
            name="title"
            required
            maxLength={200}
            defaultValue={spot.title}
            className="h-14 rounded-2xl border-indigo-100 pl-12 text-base font-semibold"
          />
          <Label htmlFor="ed-title" className="sr-only">
            지점 이름
          </Label>
        </div>

        <details className="rounded-2xl border border-slate-100 bg-slate-50/80">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-center text-[11px] font-bold text-slate-500 [&::-webkit-details-marker]:hidden">
            연락처·안내·고급 설정
          </summary>
          <div className="space-y-3 border-t border-slate-100 p-3">
            <Input
              name="contact_phone"
              type="tel"
              maxLength={40}
              defaultValue={spot.contact_phone ?? ""}
              placeholder="전화번호"
              className="h-11 rounded-xl"
            />
            <Input name="summary" maxLength={2000} defaultValue={spot.summary ?? ""} placeholder="한 줄 안내" className="h-11 rounded-xl" />
            <textarea
              name="guide_text"
              maxLength={8000}
              rows={3}
              defaultValue={spot.guide_text ?? ""}
              placeholder="상세 안내 (선택)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <Input name="floor_label" maxLength={80} defaultValue={spot.floor_label ?? ""} placeholder="층·구역" className="h-10 rounded-xl text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="latitude"
                inputMode="decimal"
                defaultValue={spot.latitude != null ? String(spot.latitude) : ""}
                placeholder="위도"
                className="h-10 rounded-xl font-mono text-xs"
              />
              <Input
                name="longitude"
                inputMode="decimal"
                defaultValue={spot.longitude != null ? String(spot.longitude) : ""}
                placeholder="경도"
                className="h-10 rounded-xl font-mono text-xs"
              />
            </div>
            <label className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 py-2">
              <input type="checkbox" name="is_published" value="1" defaultChecked={!!spot.is_published} className="h-4 w-4" />
              <Eye className="h-4 w-4 text-emerald-700" aria-hidden />
              <span className="text-xs font-black text-emerald-900">사용 중 (공개)</span>
            </label>
          </div>
        </details>

        <Button type="submit" className="h-14 w-full gap-2 rounded-2xl bg-indigo-600 text-base font-black hover:bg-indigo-700">
          <Save className="h-5 w-5" aria-hidden />
          저장
        </Button>
      </form>

      <form action={deleteWayfinderSpotForm} className="flex justify-center px-4 pb-5">
        <input type="hidden" name="id" value={spot.id} />
        {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
        <Button type="submit" variant="ghost" className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
          <Trash2 className="h-4 w-4" aria-hidden />
          지점 삭제
        </Button>
      </form>
    </section>
  );
}
