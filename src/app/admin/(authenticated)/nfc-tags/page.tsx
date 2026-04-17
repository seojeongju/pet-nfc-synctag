import Link from "next/link";
import { ListPlus, Smartphone, Database, History, ArrowRight } from "lucide-react";
import { getTagOpsStats } from "@/app/actions/admin";
import { TagOpsKpiCards } from "@/components/admin/tags/TagOpsKpiCards";
import { adminUi } from "@/styles/admin/ui";

export const runtime = "edge";

const quickLinks = [
  {
    href: "/admin/nfc-tags/register",
    title: "UID 등록",
    desc: "대량으로 태그 UID를 시스템 인벤토리에 미리 넣습니다. 모드(펫 등) 할당을 함께 지정할 수 있습니다.",
    icon: ListPlus,
    color: "text-teal-600 bg-teal-50 border-teal-100",
  },
  {
    href: "/admin/nfc-tags/write-url",
    title: "URL 기록 (Web NFC)",
    desc: "Android Chrome에서 NDEF URL을 실물 태그에 기록합니다. 스캔 시 공개 프로필로 연결됩니다.",
    icon: Smartphone,
    color: "text-indigo-600 bg-indigo-50 border-indigo-100",
  },
  {
    href: "/admin/nfc-tags/inventory",
    title: "인벤토리",
    desc: "등록된 태그 목록, 제품명·할당 모드·BLE MAC 등을 조회·수정합니다.",
    icon: Database,
    color: "text-amber-600 bg-amber-50 border-amber-100",
  },
  {
    href: "/admin/nfc-tags/history",
    title: "연결·감사 이력",
    desc: "태그 연결 로그와 관리자 감사 로그(NFC URL 기록 등)를 봅니다.",
    icon: History,
    color: "text-slate-600 bg-slate-50 border-slate-200",
  },
];

export default async function AdminNfcTagsOverviewPage() {
  const opsStats = await getTagOpsStats();

  return (
    <div className="relative overflow-hidden pb-20">
      <div className="pointer-events-none absolute right-1/4 top-0 h-[400px] w-[400px] rounded-full bg-teal-500/10 blur-[100px]" />
      <div className={adminUi.pageContainer}>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">NFC 태그 관리</h1>
          <p className="max-w-2xl text-sm font-bold text-slate-500">
            인벤토리에 UID를 등록한 뒤, 필요 시 실물 태그에 URL을 기록하고 재고·이력을 확인합니다.
          </p>
        </div>

        <TagOpsKpiCards opsStats={opsStats} />

        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map(({ href, title, desc, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className="group flex flex-col rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-teal-200 hover:shadow-md"
            >
              <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${color}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                {title}
                <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500" />
              </h2>
              <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
