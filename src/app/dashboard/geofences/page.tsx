import { getAuth } from "@/lib/auth";
import { getPetsWithDb } from "@/app/actions/pet";
import { createGeofenceForm, deleteGeofenceForm } from "@/app/actions/geofences";
import { listGeofencesForOwnerKind } from "@/lib/geofences-db";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { requireTenantMember } from "@/lib/tenant-membership";
import { getTenantStatus } from "@/lib/tenant-status";
import { isNextRedirectError } from "@/lib/next-redirect-guard";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function GeofencesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; err?: string; tenant?: string }>;
}) {
  const { kind: kindParam, err, tenant: tenantParam } = await searchParams;
  const subjectKind = parseSubjectKind(kindParam);
  const meta = subjectKindMeta[subjectKind];
  const tenantId =
    typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;
  const qs = new URLSearchParams({ kind: subjectKind });
  if (tenantId) qs.set("tenant", tenantId);
  const kindQs = `?${qs.toString()}`;

  try {
    const context = getRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      redirect("/login");
    }

    if (tenantId) {
      await requireTenantMember(context.env.DB, session.user.id, tenantId);
    }
    const tenantSuspended = tenantId
      ? (await getTenantStatus(context.env.DB, tenantId)) === "suspended"
      : false;

    const pets = (await getPetsWithDb(context.env.DB, session.user.id, subjectKind, tenantId ?? undefined)) as Array<{
      id: string;
      name: string;
    }>;
    const geofences = await listGeofencesForOwnerKind(
      context.env.DB,
      session.user.id,
      subjectKind,
      tenantId ?? undefined
    ).catch(() => []);

    const errMsg =
      err === "invalid"
        ? "입력값을 확인해 주세요."
        : err === "forbidden"
          ? "권한이 없습니다."
          : err === "tenant_suspended"
            ? "중지(suspended)된 조직에서는 변경 작업을 수행할 수 없습니다."
          : null;

    return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-outfit pb-24 px-2">
      <div className="flex items-center gap-3">
        <a href={`/dashboard${kindQs}`}>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </a>
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-teal-500" />
            안심 구역
          </h1>
          <p className="text-sm text-slate-500">
            {meta.label} 모드 · 중심과 반경(m)으로 가족이 안심할 수 있는 범위를 정해요.
            {tenantId ? (
              <span className="block text-[11px] font-bold text-teal-600 mt-1">
                조직 컨텍스트: tenant_id가 설정된 관리 대상만 표시됩니다.
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {errMsg && (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm font-bold text-rose-600">
          {errMsg}
        </div>
      )}
      {tenantSuspended ? (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-bold text-amber-700">
          조직이 중지 상태라 안심 구역 생성/삭제는 잠겨 있습니다. 조회만 가능합니다.
        </div>
      ) : null}

      <Card className="rounded-[28px] border-slate-100 shadow-lg">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">새 구역 추가</h2>
          {pets.length === 0 ? (
            <div className="space-y-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5">
              <p className="text-sm font-medium text-slate-600 leading-relaxed">{meta.emptyGeofencesNoPets}</p>
              <a
                href={tenantSuspended ? "#" : `/dashboard/pets/new${kindQs}`}
                className={cn(
                  buttonVariants({}),
                  "inline-flex h-11 rounded-full bg-teal-500 hover:bg-teal-600 font-black px-6",
                  tenantSuspended ? "pointer-events-none opacity-50" : ""
                )}
              >
                관리 대상 등록하기
              </a>
              <p className="text-xs text-slate-400">
                <a href="/hub" className="font-bold text-teal-600 hover:underline">
                  모드 허브
                </a>
                에서 용량·모드를 확인할 수 있어요.
              </p>
            </div>
          ) : (
            <form action={createGeofenceForm} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="kind" value={subjectKind} />
              {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
              <fieldset disabled={tenantSuspended} className="contents">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pet_id">관리 대상</Label>
                <select
                  id="pet_id"
                  name="pet_id"
                  required
                  className={cn(
                    "flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium"
                  )}
                  defaultValue={pets[0]?.id}
                >
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">구역 이름</Label>
                <Input id="name" name="name" required placeholder="예: 집, 학교" className="h-12 rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">위도</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="37.5665"
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">경도</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="126.9780"
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="radius_meters">반경 (m)</Label>
                <Input
                  id="radius_meters"
                  name="radius_meters"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="100 ~ 100000"
                  className="h-12 rounded-2xl"
                />
                <p className="text-[11px] text-slate-400">최소 10m, 최대 100km</p>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full h-12 rounded-2xl bg-teal-600 hover:bg-teal-700 font-bold">
                  저장
                </Button>
              </div>
              </fieldset>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">등록된 구역</h2>
        {geofences.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3 max-w-lg mx-auto">
            <p className="text-sm font-black text-slate-700">아직 등록된 안심 구역이 없어요</p>
            <p className="text-sm text-slate-500 leading-relaxed">{meta.emptyGeofencesNoZones}</p>
            <a
              href={`/dashboard/scans${kindQs}`}
              className="text-xs font-bold text-teal-600 hover:underline inline-block"
            >
              스캔·BLE 기록 보기 →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {geofences.map((g) => (
              <Card key={g.id} className="rounded-[24px] border-slate-100 shadow-sm overflow-hidden">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="font-black text-slate-900 truncate">{g.name}</p>
                    <p className="text-xs font-bold text-slate-500">{g.pet_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {Number(g.latitude).toFixed(5)}, {Number(g.longitude).toFixed(5)} · 반경 {g.radius_meters}m
                    </p>
                  </div>
                  <form action={deleteGeofenceForm} className="shrink-0">
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="kind" value={subjectKind} />
                    {tenantId ? <input type="hidden" name="tenant" value={tenantId} /> : null}
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={tenantSuspended}
                      className="rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-[11px] text-slate-500 leading-relaxed">
        <p className="font-bold text-slate-600 mb-1">API</p>
        <p>
          위치 점검: <code className="bg-white px-1 rounded">POST /api/geofence/check</code> — 본문{" "}
          <code className="bg-white px-1 rounded">{"{ pet_id, latitude, longitude, record_breach?: true }"}</code>
        </p>
      </div>
    </div>
    );
  } catch (error: unknown) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error("Geofences page data fetch error:", error);
    return (
      <div className="mx-auto max-w-lg space-y-6 px-2 py-16 text-center font-outfit">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-400">
          <MapPin className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black text-slate-900">안심 구역을 불러오지 못했어요</h1>
          <p className="text-sm leading-relaxed text-slate-600">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 D1 마이그레이션과 Worker 로그를 확인해 주세요.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={`/dashboard${kindQs}`}
            className={cn(
              buttonVariants({}),
              "rounded-full bg-teal-500 font-bold shadow-lg shadow-teal-100 hover:bg-teal-600"
            )}
          >
            대시보드로 돌아가기
          </a>
          <a
            href={`/dashboard/geofences${kindQs}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
            )}
          >
            다시 시도
          </a>
        </div>
      </div>
    );
  }
}
