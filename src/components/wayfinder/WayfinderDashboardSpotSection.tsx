"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  MapPin,
  Nfc,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { linkuCompanionSpotSubLabel } from "@/lib/wayfinder/copy";
import { companionWayfinderRegisterPath, companionWayfinderSpotEditPath } from "@/lib/companion/dashboard-paths";
import { canMutateWayfinderSpot, type WayfinderSpotRow } from "@/lib/wayfinder-spots-db";
import { deleteWayfinderSpotForm } from "@/app/actions/wayfinder-spots";
import { WayfinderSpotQuickRegister } from "@/components/wayfinder/WayfinderSpotQuickRegister";
import { WayfinderSpotUrlCopy } from "@/components/wayfinder/WayfinderSpotUrlCopy";
import { WfAlertBanner, WfIconBadge } from "@/components/wayfinder/wayfinder-dashboard-ui";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";
import type { TenantRole } from "@/types/tenant-subscription";

type Props = {
  tenantId: string | null;
  tenantQs?: string;
  spots: WayfinderSpotRow[];
  spotsLoadError: string | null;
  sessionUserId: string;
  tenantRole: TenantRole | null;
  /** register=1 또는 저장 오류 시 — 간편 등록 화면 우선 */
  registerMode: boolean;
};

function SpotStatusIcon({ published }: { published: boolean }) {
  const Icon = published ? Eye : EyeOff;
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg",
        published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
      )}
      title={published ? "사용 중" : "비공개"}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">{published ? "사용 중" : "비공개"}</span>
    </span>
  );
}

function SpotList({
  spots,
  tenantId,
  sessionUserId,
  tenantRole,
}: {
  spots: WayfinderSpotRow[];
  tenantId: string | null;
  sessionUserId: string;
  tenantRole: TenantRole | null;
}) {
  if (spots.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-xs font-semibold text-slate-500">
        아직 만든 지점이 없어요
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {spots.map((s) => {
        const canEdit = canMutateWayfinderSpot(sessionUserId, s, tenantId, tenantRole);
        const editHref = companionWayfinderSpotEditPath(s.id, tenantId);
        const spotUrl = absoluteUrl(`/wayfinder/s/${s.slug}`);
        return (
          <li key={s.id}>
            <Card className="overflow-hidden rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="flex items-center gap-2 p-2.5">
                <WfIconBadge icon={MapPin} tone={s.is_published ? "emerald" : "slate"} size="sm" soft />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-black text-slate-900">{s.title}</p>
                    <SpotStatusIcon published={Boolean(s.is_published)} />
                    {tenantId && s.owner_id !== sessionUserId ? (
                      <span title="조직 지점" className="inline-flex">
                        <Users className="h-3.5 w-3.5 shrink-0 text-violet-500" aria-hidden />
                        <span className="sr-only">조직 지점</span>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <WayfinderSpotUrlCopy url={spotUrl} />
                  {s.is_published ? (
                    <Link
                      href={`/wayfinder/s/${encodeURIComponent(s.slug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      aria-label="미리보기"
                      title="미리보기"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : null}
                  {canEdit ? (
                    <>
                      <Link
                        href={editHref}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        aria-label="자세히 수정"
                        title="자세히 수정"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Link>
                      <form action={deleteWayfinderSpotForm} className="inline">
                        <input type="hidden" name="id" value={s.id} />
                        {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
                        <button
                          type="submit"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          aria-label="삭제"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

export function WayfinderDashboardSpotSection({
  tenantId,
  spots,
  spotsLoadError,
  sessionUserId,
  tenantRole,
  registerMode,
}: Props) {
  const registerHref = companionWayfinderRegisterPath(tenantId);

  if (spotsLoadError) {
    return (
      <WfAlertBanner variant="warning" icon={AlertTriangle} compact>
        목록을 불러오지 못했습니다.
      </WfAlertBanner>
    );
  }

  if (registerMode) {
    return (
      <div className="space-y-4">
        <WayfinderSpotQuickRegister tenantId={tenantId} focused />

        {spots.length > 0 ? (
          <details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-black text-slate-700 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <Nfc className="h-4 w-4 text-violet-500" aria-hidden />
                만든 지점 {spots.length}개
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
            </summary>
            <div className="border-t border-slate-100 px-3 pb-3 pt-2">
              <SpotList spots={spots} tenantId={tenantId} sessionUserId={sessionUserId} tenantRole={tenantRole} />
            </div>
          </details>
        ) : null}
      </div>
    );
  }

  return (
    <details className="group overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-lg">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <WfIconBadge icon={Nfc} tone="violet" size="md" soft />
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-sm font-black text-slate-900">{linkuCompanionSpotSubLabel}</span>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black text-violet-800">
              {spots.length}
            </span>
          </span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden />
      </summary>

      <div className="space-y-3 border-t border-slate-100 px-4 py-4 sm:px-5">
        <Link
          href={registerHref}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.99]"
        >
          <Plus className="h-5 w-5" aria-hidden />
          새 지점 만들기
        </Link>

        <SpotList spots={spots} tenantId={tenantId} sessionUserId={sessionUserId} tenantRole={tenantRole} />
      </div>
    </details>
  );
}
