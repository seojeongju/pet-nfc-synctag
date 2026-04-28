import { getAuth } from "@/lib/auth";
import { getScanLogsWithDb, getScanLogsCountWithDb } from "@/lib/scan-logs-db";
import {
    listBleLocationEventsForOwner,
    type BleLocationEventRow,
} from "@/lib/ble-location-events-db";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Bell, MapPin, Clock, PawPrint, Bluetooth, Cpu, Tag } from "lucide-react";
import { extractBleRawMeta } from "@/lib/ble-raw-payload";
import { cn } from "@/lib/utils";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { requireTenantMember } from "@/lib/tenant-membership";
import { enrichWithKakaoAddressLabels } from "@/lib/kakao-geocode";
import { formatDateTimeKoSeoul, formatIntegerKo } from "@/lib/format-datetime-ko-seoul";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type BleEventWithAddress = BleLocationEventRow & { addressLabel: string | null };

type ScanLog = {
    id: string;
    pet_id?: string | null;
    pet_photo?: string | null;
    pet_name: string;
    scanned_at: string;
    latitude?: number | null;
    longitude?: number | null;
    user_agent?: string | null;
    ip_address?: string | null;
    addressLabel?: string | null;
};

/** D1/SQLite가 좌표를 문자열로 줄 수 있어 .toFixed 직접 호출 방지 */
function formatScanCoords(lat: unknown, lng: unknown): string {
    const la = lat != null && lat !== "" ? Number(lat) : NaN;
    const ln = lng != null && lng !== "" ? Number(lng) : NaN;
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return "위치 정보 없음";
    return `${la.toFixed(4)}, ${ln.toFixed(4)}`;
}

function parseScanLatLng(
    lat: unknown,
    lng: unknown
): { la: number; ln: number } | null {
    const la = lat != null && lat !== "" ? Number(lat) : NaN;
    const ln = lng != null && lng !== "" ? Number(lng) : NaN;
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
    return { la, ln };
}

/** 스캔 카드: 도로명/지번(가능 시) + 보조로 좌표, 카카오맵 링크 */
function ScanLogLocationBlock(props: {
    latitude: unknown;
    longitude: unknown;
    addressLabel: string | null;
}) {
    const pos = parseScanLatLng(props.latitude, props.longitude);
    if (!pos) {
        return (
            <div className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 p-2 text-xs text-slate-500">
                <MapPin className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                위치 정보 없음
            </div>
        );
    }
    const { la, ln } = pos;
    const href = `https://map.kakao.com/link/map/발견위치,${la},${ln}`;
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-start gap-2 rounded-xl bg-slate-50 p-2 text-xs text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-800"
        >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />
            <div className="min-w-0 flex-1">
                {props.addressLabel ? (
                    <>
                        <span className="block truncate font-bold text-slate-800">{props.addressLabel}</span>
                        <span className="mt-0.5 block font-mono text-[10px] text-slate-400">
                            {la.toFixed(4)}, {ln.toFixed(4)}
                        </span>
                    </>
                ) : (
                    <span className="min-w-0 truncate underline underline-offset-2">
                        {formatScanCoords(props.latitude, props.longitude)}
                    </span>
                )}
            </div>
        </a>
    );
}

/** BLE 카드용 위치 (도로명 우선) */
function BleEventLocationBlock(props: {
    latitude: unknown;
    longitude: unknown;
    addressLabel: string | null;
}) {
    const pos = parseScanLatLng(props.latitude, props.longitude);
    if (!pos) {
        return (
            <span className="truncate font-black text-slate-400">좌표 없음</span>
        );
    }
    const { la, ln } = pos;
    return (
        <a
            href={`https://map.kakao.com/link/map/감지위치,${la},${ln}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 flex-col gap-0.5 font-black"
        >
            {props.addressLabel ? (
                <>
                    <span className="truncate text-indigo-800 underline decoration-indigo-200 underline-offset-2">
                        {props.addressLabel}
                    </span>
                    <span className="truncate text-[10px] font-mono font-semibold text-slate-400">
                        {la.toFixed(4)}, {ln.toFixed(4)}
                    </span>
                </>
            ) : (
                <span className="truncate underline underline-offset-2">
                    {la.toFixed(4)}, {ln.toFixed(4)}
                </span>
            )}
        </a>
    );
}

function scansLoadFailed(dashboardLink: string, selfLink: string) {
    return (
        <div className="mx-auto max-w-lg space-y-6 px-2 py-16 text-center font-outfit">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-400">
                <Bell className="h-10 w-10" />
            </div>
            <div className="space-y-2">
                <h1 className="text-xl font-black text-slate-900">스캔 기록을 불러오지 못했어요</h1>
                <p className="text-sm leading-relaxed text-slate-600">
                    잠시 후 다시 시도해 주세요. 문제가 계속되면 D1 마이그레이션과 Worker 로그를 확인해 주세요.
                </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                    href={dashboardLink}
                    className={cn(
                        buttonVariants({}),
                        "rounded-full bg-teal-500 font-bold shadow-lg shadow-teal-100 hover:bg-teal-600"
                    )}
                >
                    대시보드로 돌아가기
                </a>
                <a
                    href={selfLink}
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

export default async function ScansPage({
    params,
    searchParams,
}: {
    params: Promise<{ kind: string }>;
    searchParams: Promise<{ tenant?: string; page?: string }>;
}) {
    const { kind: kindParam } = await params;
    const { tenant: tenantParam, page: pageParam } = await searchParams;
    const subjectKind = parseSubjectKind(kindParam);
    const meta = subjectKindMeta[subjectKind];
    const tenantId =
        typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;

    const page = Math.max(1, parseInt(pageParam ?? "1", 10));
    /** 모바일에서 스크롤·페이지 길이 완화(한 화면 2건) */
    const pageSize = 2;
    const offset = (page - 1) * pageSize;

    const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
    const dashboardLink = `/dashboard/${subjectKind}${tenantQs}`;
    const selfLink = `/dashboard/${subjectKind}/scans${tenantQs}`;

        const context = getCfRequestContext();
        const auth = getAuth(context.env);
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            redirect("/login");
        }

        if (tenantId) {
            try {
                await requireTenantMember(context.env.DB, session.user.id, tenantId);
            } catch {
                return (
                    <div className="mx-auto max-w-lg space-y-6 px-2 py-16 text-center font-outfit">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                            <Bell className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-black text-slate-900">이 조직에 접근할 수 없어요</h1>
                            <p className="text-sm leading-relaxed text-slate-600">
                                초대·멤버십을 확인하거나 다른 모드로 이동해 주세요.
                             </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <a
                                href={dashboardLink}
                                className={cn(
                                    buttonVariants({}),
                                    "rounded-full bg-teal-500 font-bold shadow-lg shadow-teal-100 hover:bg-teal-600"
                                )}
                            >
                                대시보드로
                            </a>
                        </div>
                    </div>
                );
            }
        }

        let logs: ScanLog[];
        let totalLogs: number;
        let bleEvents: BleEventWithAddress[] = [];
        try {
            const rawLogs = (await getScanLogsWithDb(
                context.env.DB,
                session.user.id,
                subjectKind,
                tenantId ?? undefined,
                pageSize,
                offset
            )) as ScanLog[];
            
            // 최신순 정렬 보장 (이미 쿼리에서 되어있지만 클라이언트 안전을 위해)
            logs = rawLogs.sort((a, b) => 
                new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
            );
            logs = await enrichWithKakaoAddressLabels(logs);

            totalLogs = await getScanLogsCountWithDb(
                context.env.DB,
                session.user.id,
                subjectKind,
                tenantId ?? undefined
            );

            let bleRows = await listBleLocationEventsForOwner(
                context.env.DB,
                session.user.id,
                subjectKind,
                30,
                tenantId ?? undefined
            ).catch((): BleLocationEventRow[] => []);

            bleRows = bleRows.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            bleEvents = await enrichWithKakaoAddressLabels(bleRows);
        } catch (error: unknown) {
            console.error("Scans page data fetch error:", error);
            return scansLoadFailed(dashboardLink, selfLink);
        }

        const totalPages = Math.ceil(totalLogs / pageSize);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-outfit pb-20">
            <div className="px-2 flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900">스캔 히스토리</h1>
                    <p className="text-sm text-slate-500">
                        {meta.label} 모드에 연결된 태그의 스캔 이력입니다.
                    </p>
                </div>
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl px-4 py-2 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Scans</p>
                    <p className="text-xl font-black text-teal-500 leading-none">{formatIntegerKo(totalLogs)}</p>
                </div>
            </div>

            <div className="px-2">
                <div className="rounded-3xl border border-teal-100 bg-teal-50 px-4 py-3">
                    <p className="text-xs font-black text-teal-800">빠른 대응 가이드</p>
                    <p className="mt-1 text-[11px] font-bold text-teal-700">
                        스캔이 발생하면 프로필/분실모드를 점검하고, 필요 시 보호자 연락 정보가 최신인지 확인해 주세요.
                    </p>
                </div>
            </div>

            <div className="space-y-6 px-2">
                {logs.length > 0 ? (
                    <>
                        <div className="space-y-6">
                            {logs.map((log: ScanLog, idx: number) => (
                                <div key={log.id} className="relative flex gap-6 group">
                                    {/* Vertical Line */}
                                    {idx !== logs.length - 1 && (
                                        <div className="absolute left-[27px] top-14 bottom-0 w-0.5 bg-slate-100 group-hover:bg-teal-100 transition-colors" />
                                    )}
                                    
                                    {/* Icon / Pet Photo */}
                                    <div className="relative z-10 flex-shrink-0">
                                        <div className={cn(
                                            "relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-4 border-white flex items-center justify-center transition-transform group-hover:scale-110",
                                            log.pet_photo ? "bg-white" : "bg-teal-50 text-teal-500"
                                        )}>
                                            {log.pet_photo ? (
                                                // eslint-disable-next-line @next/next/no-img-element -- Edge RSC에서 next/image 이슈 회피
                                                <img
                                                    src={log.pet_photo}
                                                    alt={log.pet_name}
                                                    className="absolute inset-0 h-full w-full object-cover"
                                                />
                                            ) : (
                                                <PawPrint className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center">
                                            <Bell className="w-3 h-3 text-white animate-pulse" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <Card className="flex-1 rounded-[28px] border-none shadow-xl shadow-slate-100/50 hover:bg-teal-50/30 transition-colors">
                                        <CardContent className="p-5 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-bold text-slate-800">
                                                        {log.pet_name} 아이를 누군가 발견했습니다!
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDateTimeKoSeoul(log.scanned_at)}
                                                    </div>
                                                </div>
                                                <a
                                                    href={`/dashboard/${subjectKind}/pets/${log.pet_id ?? ""}${tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : ""}`}
                                                    className={cn(
                                                        "rounded-full px-3 py-1 text-[10px] font-black",
                                                        log.pet_id ? "bg-teal-50 text-teal-700 hover:bg-teal-100" : "pointer-events-none bg-slate-100 text-slate-400"
                                                    )}
                                                    aria-disabled={!log.pet_id}
                                                >
                                                    프로필 보기
                                                </a>
                                            </div>

                                            <ScanLogLocationBlock
                                                latitude={log.latitude}
                                                longitude={log.longitude}
                                                addressLabel={log.addressLabel ?? null}
                                            />
                                            
                                            {log.ip_address && (
                                                <div className="text-[10px] text-slate-300 px-1 italic">
                                                    IP: {log.ip_address}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-6 px-1">
                                <a
                                    href={`${selfLink}${tenantId ? '&' : '?'}page=${page - 1}`}
                                    className={cn(
                                        "flex items-center justify-center rounded-2xl h-12 px-6 text-sm font-black transition-all active:scale-95",
                                        hasPrevPage ? "bg-white border border-slate-200 text-slate-700 shadow-sm" : "opacity-0 pointer-events-none"
                                    )}
                                >
                                    이전
                                </a>
                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    Page {page} / {totalPages}
                                </div>
                                <a
                                    href={`${selfLink}${tenantId ? '&' : '?'}page=${page + 1}`}
                                    className={cn(
                                        "flex items-center justify-center rounded-2xl h-12 px-6 text-sm font-black transition-all active:scale-95",
                                        hasNextPage ? "bg-teal-500 text-white shadow-lg shadow-teal-100" : "opacity-0 pointer-events-none"
                                    )}
                                >
                                    다음
                                </a>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] rounded-[40px] px-6 py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto group hover:shadow-[0_40px_80px_-12px_rgba(20,184,166,0.12)] transition-all duration-500">
                        {/* Decorative background blobs */}
                        <div className="absolute top-0 right-0 -m-16 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl group-hover:bg-teal-400/20 transition-all duration-700" />
                        <div className="absolute bottom-0 left-0 -m-16 w-32 h-32 bg-sky-400/10 rounded-full blur-2xl group-hover:bg-sky-400/20 transition-all duration-700" />

                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 rounded-[28px] rotate-3 group-hover:rotate-6 transition-transform duration-500 shadow-sm" />
                            <div className="absolute inset-0 bg-white rounded-[28px] -rotate-3 group-hover:-rotate-0 transition-transform duration-500 border border-slate-100/80 shadow-md flex items-center justify-center text-slate-300 group-hover:text-teal-500">
                                <Bell className="w-10 h-10 transition-transform duration-700 group-hover:scale-110" />
                            </div>
                        </div>

                        <div className="space-y-3 px-2 relative z-10 mb-8">
                            <h3 className="text-[22px] font-black text-slate-800 tracking-tight">{meta.emptyScansTitle}</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">{meta.emptyScansBody}</p>
                        </div>

                        <div className="flex flex-col w-full gap-3 relative z-10 sm:max-w-[85%]">
                            <a
                                href={`/dashboard/${subjectKind}/pets${tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : ""}`}
                                className="group/btn relative flex items-center justify-center h-14 w-full rounded-2xl bg-slate-900 font-black text-white hover:bg-teal-500 transition-colors shadow-lg overflow-hidden"
                            >
                                <span className="relative z-10">관리 대상·태그 연결</span>
                            </a>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-2 space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Bluetooth className="w-5 h-5 text-indigo-500" />
                        BLE 위치 이벤트
                    </h2>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        주변 기기나 동행 앱을 통해 감지된 {meta.label}의 근접 정보입니다.
                    </p>
                </div>

                {bleEvents.length > 0 ? (
                    <div className="space-y-4">
                        {bleEvents.map((ev) => {
                            const meta = extractBleRawMeta(ev.raw_payload);
                            const hasMeta =
                                meta.firmware_version != null ||
                                meta.tag_id != null;
                            return (
                            <Card
                                key={ev.id}
                                className="rounded-[28px] border border-indigo-100/80 bg-indigo-50/20 shadow-sm"
                            >
                                <CardContent className="p-5 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-slate-800">{ev.pet_name}</p>
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mt-0.5">
                                                {ev.event_type}
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                            {formatDateTimeKoSeoul(ev.created_at)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                        <div className="flex items-start gap-1.5 p-2 rounded-xl bg-white/80 transition-colors min-w-0">
                                            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1 hover:text-indigo-600">
                                                <BleEventLocationBlock
                                                    latitude={ev.latitude}
                                                    longitude={ev.longitude}
                                                    addressLabel={ev.addressLabel ?? null}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/80">
                                            <Bluetooth className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                            <span>
                                                {ev.rssi != null ? `RSSI ${ev.rssi} dBm` : "RSSI 없음"}
                                            </span>
                                        </div>
                                    </div>
                                    {hasMeta ? (
                                        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-600">
                                            {meta.firmware_version != null ? (
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 font-mono text-[10px] font-semibold text-slate-700 ring-1 ring-indigo-100">
                                                    <Cpu className="w-3 h-3 text-indigo-500 shrink-0" />
                                                    FW {meta.firmware_version}
                                                </span>
                                            ) : null}
                                            {meta.tag_id != null ? (
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 font-mono text-[10px] font-semibold text-slate-700 ring-1 ring-indigo-100">
                                                    <Tag className="w-3 h-3 text-indigo-500 shrink-0" />
                                                    UID {meta.tag_id}
                                                </span>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="relative group overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white/50 border-2 border-dashed border-indigo-100/60 rounded-[32px] p-8 text-center transition-all duration-500 hover:border-indigo-300 gap-4 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-[20px] bg-indigo-50/80 flex items-center justify-center text-indigo-300 group-hover:scale-110 group-hover:text-indigo-500 transition-all duration-500 shadow-sm">
                            <Bluetooth className="w-8 h-8" />
                        </div>
                        <div className="space-y-1.5 px-2">
                            <p className="font-black text-slate-700 text-base">아직 기록된 BLE 이벤트가 없습니다</p>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[240px] mx-auto">{meta.emptyBleHint}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
