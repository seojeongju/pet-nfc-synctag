"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  Layers,
  Link2,
  List,
  MapPin,
  MessageSquareText,
  Nfc,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import type { SubjectKind } from "@/lib/subject-kind";
import type { TenantRole } from "@/types/tenant-subscription";
import { linkuCompanionSpotSubLabel } from "@/lib/wayfinder/copy";
import { canMutateWayfinderSpot, type WayfinderSpotRow } from "@/lib/wayfinder-spots-db";
import {
  createWayfinderSpotForm,
  deleteWayfinderSpotForm,
  toggleWayfinderSpotPublishedForm,
} from "@/app/actions/wayfinder-spots";
import { WayfinderSpotUrlCopy } from "@/components/wayfinder/WayfinderSpotUrlCopy";
import { WfFormField } from "@/components/wayfinder/WfFormField";
import { WfAlertBanner, WfIconBadge } from "@/components/wayfinder/wayfinder-dashboard-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";

type Props = {
  subjectKind: SubjectKind;
  tenantId: string | null;
  tenantQs: string;
  spots: WayfinderSpotRow[];
  spotsLoadError: string | null;
  sessionUserId: string;
  tenantRole: TenantRole | null;
  defaultExpanded: boolean;
  publicSpotPageBase: string;
};

function spotRegisterHref(subjectKind: SubjectKind, tenantQs: string) {
  const base = `/dashboard/${subjectKind}/wayfinder`;
  return tenantQs ? `${base}${tenantQs}&register=1` : `${base}?register=1`;
}

function SpotStatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
        published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
      )}
    >
      {published ? <Eye className="h-3 w-3" aria-hidden /> : <EyeOff className="h-3 w-3" aria-hidden />}
      {published ? "발행됨" : "비공개"}
    </span>
  );
}

export function WayfinderDashboardSpotSection({
  subjectKind,
  tenantId,
  tenantQs,
  spots,
  spotsLoadError,
  sessionUserId,
  tenantRole,
  defaultExpanded,
  publicSpotPageBase,
}: Props) {
  const registerHref = spotRegisterHref(subjectKind, tenantQs);

  return (
    <details open={defaultExpanded} className="group overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-lg">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <WfIconBadge icon={Nfc} tone="violet" size="md" soft />
          <span className="min-w-0 text-left">
            <span className="block text-[10px] font-black uppercase tracking-widest text-violet-600">보조 기능</span>
            <span className="block text-sm font-black text-slate-900">
              {linkuCompanionSpotSubLabel} · NFC·QR
            </span>
          </span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden />
      </summary>

      <div className="space-y-4 border-t border-slate-100 px-4 py-4 sm:px-5">
        <WfAlertBanner variant="info" icon={Link2} title="스팟이란?">
          엘리베이터·안내 데스크 등 <strong>특정 지점</strong>에 붙는 NFC·QR용 안내 URL입니다. 개인 모드는 본인 스팟만,
          조직은 <strong>owner/admin</strong>이 전체를 관리합니다.
        </WfAlertBanner>

        {spotsLoadError ? (
          <WfAlertBanner variant="warning" icon={AlertTriangle} title="목록 불러오기 실패">
            {spotsLoadError}
          </WfAlertBanner>
        ) : (
          <>
            <details
              open={defaultExpanded}
              className="group/register overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/80 to-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2.5">
                  <WfIconBadge icon={Plus} tone="indigo" size="sm" />
                  <span className="text-sm font-black text-indigo-950">새 스팟 등록</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-indigo-500 transition group-open/register:rotate-180" aria-hidden />
              </summary>
              <Card className="rounded-none border-0 border-t border-indigo-100/80 bg-white/95 shadow-none">
                <CardContent className="space-y-4 p-5 pt-4">
                  <div className="flex gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                    <p className="text-xs font-semibold leading-relaxed text-indigo-950/90">
                      저장 후 주소:{" "}
                      <span className="font-mono font-bold">{publicSpotPageBase}/[slug]</span>
                      {" · "}발행 시 NFC·QR에 바로 기록 가능
                    </p>
                  </div>
                  <form action={createWayfinderSpotForm} className="grid gap-4">
                    <input type="hidden" name="kind" value={subjectKind} />
                    {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}

                    <WfFormField id="wf-title" label="스팟 이름" icon={Building2} tone="indigo">
                      <Input
                        id="wf-title"
                        name="title"
                        required
                        maxLength={200}
                        placeholder="예: 본관 1층 안내 데스크"
                        className="h-12 rounded-2xl border-slate-200 pl-4"
                      />
                    </WfFormField>

                    <WfFormField id="wf-slug" label="공개 주소 (선택)" icon={Hash} tone="violet" hint="비우면 자동 생성 (영문·숫자·하이픈)">
                      <Input
                        id="wf-slug"
                        name="slug"
                        maxLength={64}
                        placeholder="my-desk"
                        className="h-12 rounded-2xl border-slate-200 font-mono text-xs"
                      />
                    </WfFormField>

                    <WfFormField
                      id="wf-contact"
                      label="시설·데스크 연락처 (선택)"
                      icon={Phone}
                      tone="teal"
                      hint="방문자 화면에 전화·문자 버튼으로 표시됩니다."
                    >
                      <Input
                        id="wf-contact"
                        name="contact_phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={40}
                        placeholder="02-3144-3137"
                        className="h-12 rounded-2xl border-slate-200 font-mono text-sm"
                      />
                    </WfFormField>

                    <WfFormField id="wf-summary" label="한 줄 요약 (선택)" icon={MessageSquareText} tone="sky">
                      <Input
                        id="wf-summary"
                        name="summary"
                        maxLength={2000}
                        placeholder="엘리베이터 앞, 휠체어 우선 대기"
                        className="h-12 rounded-2xl border-slate-200"
                      />
                    </WfFormField>

                    <WfFormField
                      id="wf-guide"
                      label="상세 안내·TTS (선택)"
                      icon={FileText}
                      tone="slate"
                      hint="줄마다 1. … 2. … 형식이면 방문자 화면에 단계 카드로 표시됩니다."
                    >
                      <textarea
                        id="wf-guide"
                        name="guide_text"
                        maxLength={8000}
                        rows={4}
                        className={cn(
                          "w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium",
                          "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                        )}
                        placeholder="방문객에게 읽어 줄 상세 안내"
                      />
                    </WfFormField>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <WfFormField id="wf-floor" label="층·구역" icon={Layers} tone="amber">
                        <Input id="wf-floor" name="floor_label" maxLength={80} placeholder="2F 동편" className="h-12 rounded-2xl" />
                      </WfFormField>
                      <WfFormField id="wf-lat" label="위도" icon={MapPin} tone="emerald">
                        <Input id="wf-lat" name="latitude" inputMode="decimal" placeholder="37.xxx" className="h-12 rounded-2xl font-mono text-xs" />
                      </WfFormField>
                      <div className="sm:col-span-2">
                        <WfFormField id="wf-lon" label="경도" icon={MapPin} tone="emerald">
                          <Input id="wf-lon" name="longitude" inputMode="decimal" placeholder="127.xxx" className="h-12 rounded-2xl font-mono text-xs" />
                        </WfFormField>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                      <input type="checkbox" name="is_published" value="1" className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
                      <span className="flex items-center gap-2 text-sm font-black text-emerald-900">
                        <Eye className="h-4 w-4" aria-hidden />
                        발행 (공개 페이지·NFC·QR)
                      </span>
                    </label>

                    <Button type="submit" className="h-12 w-full gap-2 rounded-2xl bg-indigo-600 text-sm font-black hover:bg-indigo-700">
                      <Save className="h-4 w-4" aria-hidden />
                      스팟 저장
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </details>

            {!defaultExpanded ? (
              <Link
                href={registerHref}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/60 py-3.5 text-sm font-black text-indigo-700 transition hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4" aria-hidden />
                새 스팟 등록하기
              </Link>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <List className="h-4 w-4 text-slate-400" aria-hidden />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  등록된 스팟 · {spots.length}개
                </h3>
              </div>

              {spots.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                  <WfIconBadge icon={Nfc} tone="slate" size="lg" soft />
                  <p className="text-sm font-black text-slate-700">아직 등록된 스팟이 없어요</p>
                  <p className="max-w-xs text-sm leading-relaxed text-slate-500">NFC·QR로 연결할 안내 지점을 등록해 보세요.</p>
                  <Link
                    href={registerHref}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black text-white hover:bg-indigo-700"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    스팟 등록 폼 열기
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {spots.map((s) => {
                    const canEdit = canMutateWayfinderSpot(sessionUserId, s, tenantId, tenantRole);
                    const editHref = `/dashboard/${subjectKind}/wayfinder/${s.id}/edit${tenantQs}`;
                    const spotUrl = absoluteUrl(`/wayfinder/s/${s.slug}`);
                    return (
                      <li key={s.id}>
                        <Card className="overflow-hidden rounded-[24px] border-slate-100 shadow-sm">
                          <CardContent className="p-0">
                            <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                              <WfIconBadge icon={MapPin} tone={s.is_published ? "emerald" : "slate"} size="md" soft />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate font-black text-slate-900">{s.title}</p>
                                  <SpotStatusBadge published={Boolean(s.is_published)} />
                                </div>
                                <p className="font-mono text-[11px] font-bold text-indigo-600">/{s.slug}</p>
                              </div>
                            </div>

                            <div className="space-y-3 px-4 py-3">
                              <div className="flex flex-wrap items-start gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2">
                                <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                                <p className="min-w-0 flex-1 break-all font-mono text-[10px] font-semibold text-slate-600">{spotUrl}</p>
                                <WayfinderSpotUrlCopy url={spotUrl} />
                              </div>

                              {tenantId && s.owner_id !== sessionUserId ? (
                                <p className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600">
                                  <Users className="h-3 w-3" aria-hidden />
                                  조직 스팟 · 다른 멤버 등록
                                </p>
                              ) : null}
                              {s.summary ? (
                                <p className="flex items-start gap-2 text-xs font-semibold leading-relaxed text-slate-600">
                                  <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                                  {s.summary}
                                </p>
                              ) : null}
                              {s.is_published ? (
                                <Link
                                  href={`/wayfinder/s/${encodeURIComponent(s.slug)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-100"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                  방문자 안내 열기
                                </Link>
                              ) : null}

                              {canEdit ? (
                                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                                  <Link
                                    href={editHref}
                                    className="inline-flex h-9 flex-1 min-w-[5rem] items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 text-xs font-black text-indigo-700 hover:bg-indigo-50 sm:flex-none"
                                  >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                                    수정
                                  </Link>
                                  <form action={toggleWayfinderSpotPublishedForm} className="flex-1 sm:flex-none">
                                    <input type="hidden" name="id" value={s.id} />
                                    <input type="hidden" name="kind" value={subjectKind} />
                                    {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
                                    <Button
                                      type="submit"
                                      variant="outline"
                                      className="h-9 w-full gap-1.5 rounded-xl border-slate-200 text-xs font-black"
                                    >
                                      {s.is_published ? (
                                        <>
                                          <EyeOff className="h-3.5 w-3.5" aria-hidden />
                                          발행 해제
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="h-3.5 w-3.5" aria-hidden />
                                          발행하기
                                        </>
                                      )}
                                    </Button>
                                  </form>
                                  <form action={deleteWayfinderSpotForm} className="flex-1 sm:flex-none">
                                    <input type="hidden" name="id" value={s.id} />
                                    <input type="hidden" name="kind" value={subjectKind} />
                                    {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
                                    <Button
                                      type="submit"
                                      variant="outline"
                                      className="h-9 w-full gap-1.5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                      삭제
                                    </Button>
                                  </form>
                                </div>
                              ) : (
                                <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                  <EyeOff className="h-3 w-3" aria-hidden />
                                  조회만 가능합니다
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}

        <section className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/90 p-3">
          <WfIconBadge icon={Globe} tone="sky" size="sm" soft />
          <ul className="min-w-0 space-y-1.5 text-xs font-semibold text-slate-600">
            <li className="flex items-start gap-1.5">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-sky-500" aria-hidden />
              발행 시 NFC·QR 주소: <span className="font-mono font-bold">{publicSpotPageBase}/[slug]</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-sky-500" aria-hidden />
              미발행 스팟은 스캔해도 공개 안내가 나오지 않습니다.
            </li>
          </ul>
        </section>
      </div>
    </details>
  );
}
