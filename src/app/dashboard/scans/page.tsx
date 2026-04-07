import { getAuth } from "@/lib/auth";
import { getScanLogs } from "@/app/actions/scan";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, MapPin, Clock, Smartphone, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default async function ScansPage() {
    const context = getRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const logs = await getScanLogs(session.user.id);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-outfit pb-20">
            <div className="px-2 space-y-1">
                <h1 className="text-2xl font-black text-slate-900">스캔 히스토리</h1>
                <p className="text-sm text-slate-500">반려동물 인식표의 실시간 알림 이력입니다.</p>
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
        </div>
    );
}
