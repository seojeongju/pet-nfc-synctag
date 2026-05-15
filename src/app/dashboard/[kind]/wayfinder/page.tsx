import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { requireTenantMember } from "@/lib/tenant-membership";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import { canUseModeFeature } from "@/lib/mode-visibility";
import { getTenantStatus } from "@/lib/tenant-status";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Navigation2, Pencil, Trash2 } from "lucide-react";
import { linkuCompanionMenuTitle, linkuCompanionServiceDescription } from "@/lib/wayfinder/copy";
import { isWayfinderEnabled } from "@/lib/wayfinder/feature";
import { listWayfinderSpotsForDashboard, canMutateWayfinderSpot, type WayfinderSpotRow } from "@/lib/wayfinder-spots-db";
import { createWayfinderSpotForm, deleteWayfinderSpotForm, toggleWayfinderSpotPublishedForm } from "@/app/actions/wayfinder-spots";
import { getMembership } from "@/lib/tenant-membership";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function DashboardWayfinderPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ tenant?: string; err?: string }>;
}) {
  const { kind: kindParam } = await params;
  const { tenant: tenantParam, err } = await searchParams;

  const subjectKind = parseSubjectKind(kindParam);
  const tenantId = typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;
  const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
  const meta = subjectKindMeta[subjectKind];
  const wayfinderBeta = isWayfinderEnabled();

  const errMsg =
    err === "invalid"
      ? "입력값을 확인해 주세요."
      : err === "invalid_slug"
        ? "주소(slug)는 영문 소문자·숫자·하이픈만, 3~64자로 입력해 주세요."
        : err === "slug_taken"
          ? "이미 사용 중인 주소(slug)입니다. 다른 값을 입력해 주세요."
          : err === "forbidden"
            ? "권한이 없거나 해당 스팟을 찾을 수 없습니다."
            : err === "tenant_suspended"
              ? "중지된 조직에서는 변경할 수 없습니다."
              : err === "db"
                ? "저장에 실패했습니다. D1 마이그레이션(wayfinder_spots) 적용 여부를 확인해 주세요."
                : null;

  try {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/login");
    }

    try {
      if (tenantId) {
        await requireTenantMember(context.env.DB, session.user.id, tenantId);
      }

      const roleRow = await context.env.DB
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(session.user.id)
        .first<{ role?: string | null }>();
      const isAdmin = isPlatformAdminRole(roleRow?.role);
      const modeFeatureEnabled = await canUseModeFeature(
        context.env.DB,
        session.user.id,
        subjectKind,
        { isPlatformAdmin: isAdmin, tenantId }
      );
      const tenantStatus = tenantId ? await getTenantStatus(context.env.DB, tenantId) : null;
      const writeLocked = tenantStatus === "suspended" || !modeFeatureEnabled;

      let spots: WayfinderSpotRow[] = [];
      let spotsLoadError: string | null = null;
      let tenantRole: Awaited<ReturnType<typeof getMembership>> = null;
      if (tenantId) {
        tenantRole = await getMembership(context.env.DB, session.user.id, tenantId);
      }
      if (wayfinderBeta && !writeLocked) {
        try {
          spots = await listWayfinderSpotsForDashboard(
            context.env.DB,
            session.user.id,
            subjectKind,
            tenantId ?? undefined
          );
        } catch (e: unknown) {
          console.error("wayfinder spots list error:", e);
          spotsLoadError =
            "스팟 목록을 불러오지 못했습니다. 로컬·배포 환경에 마이그레이션 0033_wayfinder_spots.sql 적용 여부를 확인해 주세요.";
        }
      }

      const publicSpotApiBase = "/api/wayfinder/public/spot";
      const publicSpotPageBase = "/wayfinder/s";

      return (
        <div className="relative min-h-0 w-full min-w-0 overflow-x-hidden bg-[#F8FAFC] pb-8 font-outfit">
          <div className="pointer-events-none absolute left-0 top-0 h-[240px] w-full bg-gradient-to-b from-indigo-500/10 to-transparent" />
          <div className="relative mx-auto w-full min-w-0 max-w-lg space-y-6 px-4 pt-6 sm:px-5 sm:pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <Link
                href={`/dashboard/${subjectKind}${tenantQs}`}
                className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/80 hover:text-indigo-800"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                대시보드 홈
              </Link>
            </div>

            <header className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black tracking-wider text-indigo-700">
                <Navigation2 className="h-3.5 w-3.5" aria-hidden />
                {linkuCompanionMenuTitle}
              </div>
              <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-[26px]">
                {linkuCompanionServiceDescription}
              </h1>
              <p className="text-sm font-semibold leading-relaxed text-slate-600">
                {meta.label} 모드 진입입니다. 발행된 스팟은 방문자 페이지{" "}
                <span className="font-mono text-xs text-slate-500">{publicSpotPageBase}/[slug]</span> · JSON{" "}
                <span className="font-mono text-xs text-slate-500">{publicSpotApiBase}/[slug]</span> 로 제공됩니다.
              </p>
            </header>

            {!wayfinderBeta ? (
              <section
                className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm"
                aria-label={`${linkuCompanionMenuTitle} 준비 안내`}
              >
                <p className="text-sm font-black text-amber-900">기능 점진 오픈 중</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-950/90">
                  상세 개발·베타 화면은 배포 환경에서{" "}
                  <span className="font-mono text-xs">NEXT_PUBLIC_WAYFINDER_ENABLED=true</span>일 때 확장됩니다.
                  허브에서는 항상 6번째 타일로 안내합니다.
                </p>
              </section>
            ) : null}

            {writeLocked ? (
              <section
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                aria-label="이용 제한"
              >
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                  현재 모드 이용이 제한되었거나 조직이 정지된 상태입니다. 관리자에게 문의하세요.
                </p>
              </section>
            ) : null}

            {errMsg ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {errMsg}
              </div>
            ) : null}

            {wayfinderBeta && !writeLocked ? (
              <>
                <section
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  aria-label={`${linkuCompanionMenuTitle} 안내 스팟`}
                >
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                    개인 모드에서는 본인이 등록한 스팟만 보입니다. 조직 모드에서는 멤버는 본인 스팟만,{" "}
                    <strong>owner/admin</strong>은 같은 조직의 모든 스팟을 보고 수정·삭제·발행 전환할 수 있습니다.
                  </p>
                </section>

                {spotsLoadError ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
                    {spotsLoadError}
                  </div>
                ) : (
                  <>
                    <Card className="rounded-[28px] border-slate-100 shadow-lg">
                      <CardContent className="space-y-4 p-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">새 스팟 추가</h2>
                        <form action={createWayfinderSpotForm} className="grid gap-4">
                          <input type="hidden" name="kind" value={subjectKind} />
                          {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
                          <div className="space-y-2">
                            <Label htmlFor="wf-title">스팟 이름</Label>
                            <Input
                              id="wf-title"
                              name="title"
                              required
                              maxLength={200}
                              placeholder="예: 본관 1층 안내 데스크"
                              className="h-12 rounded-2xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wf-slug">공개 주소 (선택)</Label>
                            <Input
                              id="wf-slug"
                              name="slug"
                              maxLength={64}
                              placeholder="비우면 자동 생성 (영문·숫자·하이픈)"
                              className="h-12 rounded-2xl font-mono text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wf-summary">한 줄 요약 (선택)</Label>
                            <Input
                              id="wf-summary"
                              name="summary"
                              maxLength={2000}
                              placeholder="엘리베이터 앞, 휠체어 우선 대기 가능"
                              className="h-12 rounded-2xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="wf-guide">상세 안내·TTS용 문구 (선택)</Label>
                            <textarea
                              id="wf-guide"
                              name="guide_text"
                              maxLength={8000}
                              rows={4}
                              className={cn(
                                "w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium",
                                "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                              )}
                              placeholder="방문객에게 읽어 줄 상세 안내를 적어 주세요."
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="wf-floor">층·구역 (선택)</Label>
                              <Input
                                id="wf-floor"
                                name="floor_label"
                                maxLength={80}
                                placeholder="예: 2F 동편"
                                className="h-12 rounded-2xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="wf-lat">위도 (선택)</Label>
                              <Input
                                id="wf-lat"
                                name="latitude"
                                inputMode="decimal"
                                placeholder="37.xxx"
                                className="h-12 rounded-2xl font-mono text-xs"
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label htmlFor="wf-lon">경도 (선택)</Label>
                              <Input
                                id="wf-lon"
                                name="longitude"
                                inputMode="decimal"
                                placeholder="127.xxx"
                                className="h-12 rounded-2xl font-mono text-xs"
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <input
                              type="checkbox"
                              name="is_published"
                              value="1"
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                            />
                            발행(공개 페이지·API·음성 안내)
                          </label>
                          <Button type="submit" className="h-12 w-full rounded-2xl bg-indigo-600 font-black hover:bg-indigo-700">
                            스팟 저장
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <h2 className="px-1 text-sm font-black uppercase tracking-widest text-slate-400">등록된 스팟</h2>
                      {spots.length === 0 ? (
                        <div className="mx-auto max-w-lg space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                          <p className="text-sm font-black text-slate-700">아직 등록된 스팟이 없어요</p>
                          <p className="text-sm leading-relaxed text-slate-500">
                            NFC·QR로 연결할 안내 지점을 위 폼에서 추가해 보세요.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {spots.map((s) => {
                            const canEdit = canMutateWayfinderSpot(session.user.id, s, tenantId, tenantRole);
                            const editHref = `/dashboard/${subjectKind}/wayfinder/${s.id}/edit${tenantQs}`;
                            return (
                            <Card key={s.id} className="overflow-hidden rounded-[24px] border-slate-100 shadow-sm">
                              <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start">
                                <div className="min-w-0 space-y-1">
                                  <p className="truncate font-black text-slate-900">{s.title}</p>
                                  <p className="font-mono text-[11px] font-bold text-indigo-600">/{s.slug}</p>
                                  {tenantId && s.owner_id !== session.user.id ? (
                                    <p className="text-[10px] font-bold text-violet-600">조직 스팟 · 등록자 다른 멤버</p>
                                  ) : null}
                                  {s.summary ? (
                                    <p className="text-xs font-semibold leading-relaxed text-slate-600">{s.summary}</p>
                                  ) : null}
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {s.is_published ? "발행됨 · 공개 페이지·API" : "비공개"}
                                  </p>
                                  {s.is_published ? (
                                    <Link
                                      href={`/wayfinder/s/${encodeURIComponent(s.slug)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:underline"
                                    >
                                      방문자 안내 열기
                                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                    </Link>
                                  ) : null}
                                </div>
                                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                                  {canEdit ? (
                                    <>
                                      <Link
                                        href={editHref}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-white px-4 text-xs font-black text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                                      >
                                        <Pencil className="h-4 w-4" aria-hidden />
                                        수정
                                      </Link>
                                      <form action={toggleWayfinderSpotPublishedForm}>
                                        <input type="hidden" name="id" value={s.id} />
                                        <input type="hidden" name="kind" value={subjectKind} />
                                        {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
                                        <Button
                                          type="submit"
                                          variant="outline"
                                          className="h-10 w-full min-w-[8.5rem] rounded-2xl border-slate-200 font-black text-slate-700 hover:bg-slate-50"
                                        >
                                          {s.is_published ? "발행 해제" : "발행하기"}
                                        </Button>
                                      </form>
                                      <form action={deleteWayfinderSpotForm}>
                                        <input type="hidden" name="id" value={s.id} />
                                        <input type="hidden" name="kind" value={subjectKind} />
                                        {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
                                        <Button
                                          type="submit"
                                          variant="outline"
                                          className="gap-2 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          삭제
                                        </Button>
                                      </form>
                                    </>
                                  ) : (
                                    <p className="max-w-[10rem] text-right text-[10px] font-bold leading-snug text-slate-400">
                                      조회만 가능합니다.
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <section
                  className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm"
                  aria-label="개발 로드맵"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">로드맵</p>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm font-semibold text-slate-700">
                    <li className="text-indigo-800">시설·스팟 메타데이터 (D1) — 목록·저장·공개 API 1차</li>
                    <li className="text-indigo-800">
                      공개 스팟 페이지(/wayfinder/s/[slug]) + Web Speech API 음성 안내
                    </li>
                    <li className="text-indigo-800">대시보드에서 편집·발행 전환·조직 owner/admin 권한 반영</li>
                  </ol>
                </section>
              </>
            ) : null}
          </div>
        </div>
      );
    } catch (dataError: unknown) {
      rethrowNextControlFlowErrors(dataError);
      console.error("linku-companion dashboard page data error:", dataError);
      redirect(`/dashboard/${subjectKind}${tenantQs}`);
    }
  } catch (error: unknown) {
    rethrowNextControlFlowErrors(error);
    console.error("linku-companion dashboard page auth error:", error);
    redirect("/login");
  }
}
