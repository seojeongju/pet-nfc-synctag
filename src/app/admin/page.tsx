import { getAdminStats } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Users, Package, CheckCircle, ArrowUpRight, TrendingUp } from "lucide-react";

export const runtime = "edge";

export default async function AdminPage() {
    const stats = await getAdminStats();

    const statCards = [
        {
            title: "Total NFC Tags",
            value: stats.totalTags,
            icon: Tag,
            color: "text-slate-600",
            bgColor: "bg-slate-100",
            description: "전체 시스템 등록 태그"
        },
        {
            title: "Unsold Inventory",
            value: stats.unsoldTags,
            icon: Package,
            color: "text-amber-600",
            bgColor: "bg-amber-100",
            description: "판매 대기 중인 제품"
        },
        {
            title: "Active Users / Pets",
            value: stats.activeTags,
            icon: CheckCircle,
            color: "text-teal-600",
            bgColor: "bg-teal-100",
            description: "실제 보호자가 등록한 수"
        },
        {
            title: "Registered Users",
            value: stats.totalUsers,
            icon: Users,
            color: "text-sky-600",
            bgColor: "bg-sky-100",
            description: "시스템 가입자 수"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">대시보드</h1>
                    <p className="text-sm text-slate-500">시스템 전체 현황 및 판매 데이터 통계</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-500" />
                    <span className="text-xs font-bold text-slate-600">실시간 데이터 업데이트됨</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => (
                    <Card key={idx} className="border-none shadow-xl shadow-slate-100/50 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-transform">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-2xl ${card.bgColor} flex items-center justify-center ${card.color}`}>
                                    <card.icon className="w-6 h-6" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-400">{card.title}</p>
                                <p className="text-3xl font-black text-slate-900">{card.value.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
                                    {card.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 p-8 space-y-6">
                    <h3 className="text-lg font-black text-slate-800">관리자 알림</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 rounded-3xl bg-amber-50 border border-amber-100/50">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-amber-900">재고 확인 필요</h4>
                                <p className="text-xs text-amber-700/80 mt-1">남은 미판매 태그가 {stats.unsoldTags}개입니다. 추가 생산 등록이 필요할 수 있습니다.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 rounded-3xl bg-teal-50 border border-teal-100/50">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-teal-900">사용자 증가 추세</h4>
                                <p className="text-xs text-teal-700/80 mt-1">최근 24시간 동안 새로운 사용자가 안정적으로 증가하고 있습니다.</p>
                            </div>
                        </div>
                    </div>
                </Card>
                
                <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10 space-y-4">
                        <span className="text-[10px] font-black bg-teal-500 px-3 py-1 rounded-full uppercase tracking-widest text-white">System Guide</span>
                        <h3 className="text-2xl font-bold">판매용 NFC 태그를 <br /> 등록하시겠습니까?</h3>
                        <p className="text-white/60 text-sm max-w-[80%] leading-relaxed">
                            태그 인벤토리 메뉴에서 수백 개의 NFC UID를 한 번에 시스템에 등록하고 권한을 부여할 수 있습니다.
                        </p>
                        <br />
                        <a href="/admin/tags" className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-6 py-3 rounded-2xl hover:bg-teal-400 hover:text-white transition-all text-sm shadow-xl shadow-teal-500/20">
                            태그 등록하러 가기 <Package className="w-4 h-4" />
                        </a>
                    </div>
                    {/* Decorative items */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full translate-x-1/4 -translate-y-1/4 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full -translate-x-1/4 translate-y-1/4 blur-2xl"></div>
                </Card>
            </div>
        </div>
    );
}
