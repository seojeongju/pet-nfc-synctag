import { getAuth } from "@/lib/auth";
import { getScanLogs } from "@/app/actions/scan";
import { getBleLocationEvents } from "@/app/actions/ble-events";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, MapPin, Clock, Smartphone, PawPrint, Bluetooth, Cpu, Tag, KeyRound } from "lucide-react";
import { extractBleRawMeta } from "@/lib/ble-raw-payload";
import { cn } from "@/lib/utils";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { requireTenantMember } from "@/lib/tenant-membership";

export const runtime = "edge";
type ScanLog = {
    id: string;
    pet_photo?: string | null;
    pet_name: string;
    scanned_at: string;
    latitude?: number | null;
    longitude?: number | null;
    user_agent?: string | null;
    ip_address?: string | null;
};

export default async function ScansPage({
    searchParams,
}: {
    searchParams: Promise<{ kind?: string; tenant?: string }>;
}) {
    const { kind: kindParam, tenant: tenantParam } = await searchParams;
    const subjectKind = parseSubjectKind(kindParam);
    const meta = subjectKindMeta[subjectKind];
    const tenantId =
        typeof tenantParam === "string" && tenantParam.trim() ? tenantParam.trim() : null;

    const context = getRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    if (tenantId) {
        await requireTenantMember(context.env.DB, session.user.id, tenantId);
    }

    const logs = (await getScanLogs(session.user.id, subjectKind, tenantId ?? undefined)) as ScanLog[];
    const bleEvents = await getBleLocationEvents(subjectKind, 30, tenantId ?? undefined);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-outfit pb-20">
            <div className="px-2 space-y-1">
                <h1 className="text-2xl font-black text-slate-900">스캔 히스토리</h1>
                <p className="text-sm text-slate-500">
                    {meta.label} 모드에 연결된 태그의 스캔 이력입니다.
                </p>
            </div>

            <div className="space-y-6 px-2">
                {logs.length > 0 ? (
                    logs.map((log: ScanLog, idx: number) => (
                        <div key={log.id} className="relative flex gap-6 group">
                            {/* Vertical Line */}
                            {idx !== logs.length - 1 && (
                                <div className="absolute left-[27px] top-14 bottom-0 w-0.5 bg-slate-100 group-hover:bg-teal-100 transition-colors" />
                            )}
                            
                            {/* Icon / Pet Photo */}
                            <div className="relative z-10 flex-shrink-0">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-4 border-white flex items-center justify-center transition-transform group-hover:scale-110",
                                    log.pet_photo ? "bg-white" : "bg-teal-50 text-teal-500"
                                )}>
                                    {log.pet_photo ? (
                                        <img src={log.pet_photo} alt={log.pet_name} className="w-full h-full object-cover" />
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
                                                {new Date(log.scanned_at).toLocaleString('ko-KR')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 text-slate-600">
                                            <MapPin className="w-4 h-4 text-rose-400" />
                                            <span className="truncate">
                                                {log.latitude && log.longitude 
                                                    ? `${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}` 
                                                    : "위치 정보 없음"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 text-slate-600">
                                            <Smartphone className="w-4 h-4 text-teal-400" />
                                            <span className="truncate">{log.user_agent ? "모바일 확인" : "정보 없음"}</span>
                                        </div>
                                    </div>
                                    
                                    {log.ip_address && (
                                        <div className="text-[10px] text-slate-300 px-1 italic">
                                            IP: {log.ip_address}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ))
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                            <Bell className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-800">최근 알림이 없습니다</h3>
                            <p className="text-sm text-slate-400">인식표가 안전하게 관리되고 있습니다.</p>
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
                    <p className="text-sm text-slate-500">
                        앱·동행 기기에서 전송한 근접·위치 단서입니다.{" "}
                        <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">POST /api/ble/events</code>
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        펌웨어·태그 ID 등은 <code className="text-[9px] bg-slate-100 px-1 rounded">raw_payload</code> JSON에서
                        읽어 표시합니다. (세션으로 기록된 값이며 별도 위·변조 검증은 하지 않습니다.)
                    </p>
                </div>

                {bleEvents.length > 0 ? (
                    <div className="space-y-4">
                        {bleEvents.map((ev) => {
                            const meta = extractBleRawMeta(ev.raw_payload);
                            const hasMeta =
                                meta.firmware_version != null ||
                                meta.tag_id != null ||
                                meta.device_nonce != null;
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
                                            {new Date(ev.created_at).toLocaleString("ko-KR")}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/80">
                                            <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                            <span className="truncate">
                                                {ev.latitude != null && ev.longitude != null
                                                    ? `${Number(ev.latitude).toFixed(4)}, ${Number(ev.longitude).toFixed(4)}`
                                                    : "좌표 없음"}
                                            </span>
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
                                                    {meta.tag_id}
                                                </span>
                                            ) : null}
                                            {meta.device_nonce != null ? (
                                                <span
                                                    className="inline-flex max-w-full items-center gap-1 rounded-lg bg-white/90 px-2 py-1 font-mono text-[10px] text-slate-600 ring-1 ring-slate-200"
                                                    title={meta.device_nonce}
                                                >
                                                    <KeyRound className="w-3 h-3 shrink-0 text-slate-400" />
                                                    <span className="truncate">nonce {meta.device_nonce.slice(0, 12)}{meta.device_nonce.length > 12 ? "…" : ""}</span>
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
                    <p className="text-sm text-slate-400 py-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                        아직 기록된 BLE 이벤트가 없습니다.
                    </p>
                )}
            </div>
        </div>
    );
}
