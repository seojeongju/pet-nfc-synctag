import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Navigation2, Trash2 } from "lucide-react";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { requireTenantMember, getMembership } from "@/lib/tenant-membership";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import { canUseModeFeature } from "@/lib/mode-visibility";
import { getTenantStatus } from "@/lib/tenant-status";
import { linkuCompanionMenuTitle, linkuCompanionServiceDescription } from "@/lib/wayfinder/copy";
import { isWayfinderEnabled } from "@/lib/wayfinder/feature";
import {
  canMutateWayfinderSpot,
  getWayfinderSpotForDashboard,
} from "@/lib/wayfinder-spots-db";
import { updateWayfinderSpotForm, deleteWayfinderSpotForm } from "@/app/actions/wayfinder-spots";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";
import { WayfinderSpotUrlCopy } from "@/components/wayfinder/WayfinderSpotUrlCopy";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function WayfinderSpotEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; spotId: string }>;
  searchParams: Promise<{ tenant?: string; err?: string }>;
}) {
  const { kind: kindParam, spotId } = await params;
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
          ? "이미 사용 중인 주소(slug)입니다."
          : err === "forbidden"
            ? "권한이 없습니다."
            : err === "tenant_suspended"
              ? "중지된 조직에서는 변경할 수 없습니다."
              : err === "db"
                ? "저장에 실패했습니다."
                : null;

  try {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect("/login");

    if (tenantId) {
      try {
        await requireTenantMember(context.env.DB, session.user.id, tenantId);
      } catch {
        notFound();
      }
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

    if (!wayfinderBeta || writeLocked) {
      redirect(`/dashboard/${subjectKind}/wayfinder${tenantQs}`);
    }

    const spot = await getWayfinderSpotForDashboard(
      context.env.DB,
      spotId,
      session.user.id,
      subjectKind,
      tenantId ?? undefined
    );
    if (!spot) {
      notFound();
    }

    const tenantRole = tenantId ? await getMembership(context.env.DB, session.user.id, tenantId) : null;
    const canEdit = canMutateWayfinderSpot(session.user.id, spot, tenantId, tenantRole);

    const listHref = `/dashboard/${subjectKind}/wayfinder${tenantQs}`;
    const latStr = spot.latitude != null && Number.isFinite(spot.latitude) ? String(spot.latitude) : "";
    const lonStr = spot.longitude != null && Number.isFinite(spot.longitude) ? String(spot.longitude) : "";

    return (
      <div className="relative min-h-0 w-full min-w-0 overflow-x-hidden bg-[#F8FAFC] pb-8 font-outfit">
        <div className="pointer-events-none absolute left-0 top-0 h-[240px] w-full bg-gradient-to-b from-indigo-500/10 to-transparent" />
        <div className="relative mx-auto w-full min-w-0 max-w-lg space-y-6 px-4 pt-6 sm:px-5 sm:pt-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={listHref}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/80 hover:text-indigo-800"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              스팟 목록
            </Link>
          </div>

          <header className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black tracking-wider text-indigo-700">
              <Navigation2 className="h-3.5 w-3.5" aria-hidden />
              {linkuCompanionMenuTitle} · 스팟 수정
            </div>
            <h1 className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">스팟 편집</h1>
            <p className="text-sm font-semibold text-slate-600">{meta.label} 모드 · {linkuCompanionServiceDescription}</p>
            {tenantId && spot.owner_id !== session.user.id ? (
              <p className="rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2 text-xs font-bold text-violet-900">
                이 스팟은 다른 멤버가 등록했습니다. 조직 <strong>owner/admin</strong>만 수정·삭제·발행을 바꿀 수 있습니다.
              </p>
            ) : null}
          </header>

          {errMsg ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {errMsg}
            </div>
          ) : null}

          {!canEdit ? (
            <Card className="rounded-[24px] border-slate-100 shadow-sm">
              <CardContent className="space-y-3 p-5 text-sm font-semibold text-slate-700">
                <p>이 스팟을 수정할 권한이 없습니다.</p>
                <Link href={listHref} className="font-black text-indigo-600 underline-offset-2 hover:underline">
                  목록으로 돌아가기
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              {spot.is_published ? (
                <p className="text-center">
                  <Link
                    href={`/wayfinder/s/${encodeURIComponent(spot.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-black text-indigo-600 hover:underline"
                  >
                    방문자 공개 페이지
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </Link>
                </p>
              ) : null}

              <Card className="rounded-[28px] border-slate-100 shadow-lg">
                <CardContent className="space-y-4 p-6">
                  <form action={updateWayfinderSpotForm} className="grid gap-4">
                    <input type="hidden" name="id" value={spot.id} />
                    <input type="hidden" name="kind" value={subjectKind} />
                    {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
                    <div className="space-y-2">
                      <Label htmlFor="ed-title">스팟 이름</Label>
                      <Input
                        id="ed-title"
                        name="title"
                        required
                        maxLength={200}
                        defaultValue={spot.title}
                        className="h-12 rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ed-slug">공개 주소 (slug)</Label>
                      <Input
                        id="ed-slug"
                        name="slug"
                        required
                        maxLength={64}
                        defaultValue={spot.slug}
                        className="h-12 rounded-2xl font-mono text-xs"
                      />
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                        <p className="min-w-0 flex-1 break-all text-[10px] font-semibold leading-snug text-slate-600">
                          <span className="font-sans font-bold text-slate-500">태그 URL:</span>{" "}
                          <span className="font-mono text-indigo-800">
                            {absoluteUrl(`/wayfinder/s/${spot.slug}`)}
                          </span>
                          <span className="mt-1 block font-sans text-slate-400">
                            (slug 저장 후 이 주소로 NFC를 갱신하세요)
                          </span>
                        </p>
                        <WayfinderSpotUrlCopy url={absoluteUrl(`/wayfinder/s/${spot.slug}`)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ed-summary">한 줄 요약</Label>
                      <Input
                        id="ed-summary"
                        name="summary"
                        maxLength={2000}
                        defaultValue={spot.summary ?? ""}
                        className="h-12 rounded-2xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ed-guide">상세 안내·TTS용 문구</Label>
                      <textarea
                        id="ed-guide"
                        name="guide_text"
                        maxLength={8000}
                        rows={5}
                        defaultValue={spot.guide_text ?? ""}
                        className={cn(
                          "w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium",
                          "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                        )}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ed-floor">층·구역</Label>
                        <Input
                          id="ed-floor"
                          name="floor_label"
                          maxLength={80}
                          defaultValue={spot.floor_label ?? ""}
                          className="h-12 rounded-2xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ed-lat">위도</Label>
                        <Input
                          id="ed-lat"
                          name="latitude"
                          inputMode="decimal"
                          defaultValue={latStr}
                          className="h-12 rounded-2xl font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="ed-lon">경도</Label>
                        <Input
                          id="ed-lon"
                          name="longitude"
                          inputMode="decimal"
                          defaultValue={lonStr}
                          className="h-12 rounded-2xl font-mono text-xs"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <input
                        type="checkbox"
                        name="is_published"
                        value="1"
                        defaultChecked={!!spot.is_published}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                      발행(공개 페이지·API·음성 안내)
                    </label>
                    <Button
                      type="submit"
                      className="h-12 w-full rounded-2xl bg-indigo-600 font-black hover:bg-indigo-700"
                    >
                      변경 저장
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <form action={deleteWayfinderSpotForm} className="flex justify-end">
                <input type="hidden" name="id" value={spot.id} />
                <input type="hidden" name="kind" value={subjectKind} />
                {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
                <Button
                  type="submit"
                  variant="outline"
                  className="gap-2 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  이 스팟 삭제
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  } catch (e: unknown) {
    rethrowNextControlFlowErrors(e);
    console.error("wayfinder spot edit page error:", e);
    redirect(`/dashboard/${parseSubjectKind(kindParam)}/wayfinder${tenantQs}`);
  }
}
