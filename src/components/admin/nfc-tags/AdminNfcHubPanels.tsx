import Link from "next/link";
import {
  ListPlus,
  Smartphone,
  Database,
  History,
  ArrowRight,
  BookOpenCheck,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { CardContent } from "@/components/ui/card";

const workflowSteps = [
  {
    step: "1",
    title: "UID 등록",
    body: "제조·입고 태그 UID를 인벤토리에 넣습니다. 모드(펫 등) 할당을 함께 지정할 수 있습니다.",
    href: "/admin/nfc-tags/register",
    cta: "등록 화면",
    icon: ListPlus,
    accent: "from-teal-500/15 to-teal-500/5 border-teal-200/80",
    iconClass: "text-teal-600 bg-teal-500/15",
  },
  {
    step: "2",
    title: "URL 기록",
    body: "등록된 UID에만 NDEF URL(`앱주소/t/UID`)을 실물 태그에 기록합니다. Android Chrome·HTTPS가 필요합니다.",
    href: "/admin/nfc-tags/write-url",
    cta: "기록 시작",
    icon: Smartphone,
    accent: "from-indigo-500/15 to-indigo-500/5 border-indigo-200/70",
    iconClass: "text-indigo-600 bg-indigo-500/15",
  },
  {
    step: "3",
    title: "인벤토리 점검",
    body: "재고·활성·연결 상태, 제품 메타·BLE MAC 등을 확인하고 수정합니다.",
    href: "/admin/nfc-tags/inventory",
    cta: "목록 보기",
    icon: Database,
    accent: "from-amber-500/15 to-amber-500/5 border-amber-200/70",
    iconClass: "text-amber-600 bg-amber-500/15",
  },
  {
    step: "4",
    title: "연결·감사",
    body: "보호자 연결 로그와 관리자 NFC 기록 감사를 조회합니다.",
    href: "/admin/nfc-tags/history",
    cta: "이력 열기",
    icon: History,
    accent: "from-slate-500/10 to-slate-500/5 border-slate-200/90",
    iconClass: "text-slate-600 bg-slate-500/10",
  },
];

const quickLinks = [
  {
    href: "/admin/nfc-tags/register",
    title: "UID 등록",
    desc: "대량 줄 단위 입력, 모드 할당·배치 ID.",
    icon: ListPlus,
    chip: "입고",
    color: "border-teal-100 bg-teal-50/80 hover:border-teal-200",
    iconWrap: "text-teal-600 bg-white border-teal-100",
  },
  {
    href: "/admin/nfc-tags/write-url",
    title: "URL 기록 (Web NFC)",
    desc: "NDEF URL 기록 및 감사 로그 남기기.",
    icon: Smartphone,
    chip: "현장",
    color: "border-indigo-100 bg-indigo-50/80 hover:border-indigo-200",
    iconWrap: "text-indigo-600 bg-white border-indigo-100",
  },
  {
    href: "/admin/nfc-tags/inventory",
    title: "인벤토리",
    desc: "UID 검색·필터, 제품·모드·MAC 관리.",
    icon: Database,
    chip: "마스터",
    color: "border-amber-100 bg-amber-50/80 hover:border-amber-200",
    iconWrap: "text-amber-600 bg-white border-amber-100",
  },
  {
    href: "/admin/nfc-tags/history",
    title: "연결·감사 이력",
    desc: "연결 로그·관리자 감사 필터.",
    icon: History,
    chip: "추적",
    color: "border-slate-200 bg-slate-50/90 hover:border-slate-300",
    iconWrap: "text-slate-600 bg-white border-slate-100",
  },
];

export function AdminNfcWorkflowColumn() {
  return (
    <AdminCard variant="section" className="overflow-hidden rounded-[28px] border border-slate-100/80 bg-white shadow-xl">
      <CardContent className="p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
            <BookOpenCheck className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">권장 순서</p>
            <h3 className="text-lg font-black text-slate-900">운영 체크리스트</h3>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              미등록 UID에는 URL을 기록할 수 없습니다. 기록 후에는 인벤토리·이력으로 결과를 확인하세요.
            </p>
          </div>
        </div>
        <ol className="space-y-3">
          {workflowSteps.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.step}>
                <div
                  className={cn(
                    "rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition-shadow hover:shadow-md",
                    s.accent
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white shadow-sm",
                        "bg-slate-900"
                      )}
                    >
                      {s.step}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon className={cn("h-5 w-5 rounded-lg border p-0.5", s.iconClass)} aria-hidden />
                        <p className="text-sm font-black text-slate-900">{s.title}</p>
                      </div>
                      <p className="text-[11px] font-bold leading-relaxed text-slate-600">{s.body}</p>
                      <Link
                        href={s.href}
                        prefetch={false}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-teal-700 hover:text-teal-900"
                      >
                        {s.cta}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </AdminCard>
  );
}

export function AdminNfcQuickLinkGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {quickLinks.map(({ href, title, desc, icon: Icon, chip, color, iconWrap }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          className={cn(
            "group flex flex-col rounded-3xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg",
            color
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className={cn("inline-flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm", iconWrap)}>
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-slate-500 shadow-sm ring-1 ring-slate-100">
              {chip}
            </span>
          </div>
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
            {title}
            <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600" />
          </h2>
          <p className="mt-1 text-xs font-bold leading-relaxed text-slate-600">{desc}</p>
        </Link>
      ))}
    </div>
  );
}

export function AdminNfcHelpCallout() {
  return (
    <AdminCard variant="subtle" className="border-teal-100 bg-teal-50/40">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm ring-1 ring-teal-100">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">보안·호환성</p>
            <p className="text-sm font-black text-slate-900">Web NFC 범위와 동일한 규칙을 따릅니다</p>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              URL 기록은 DB에 등록된 UID에만 허용됩니다. 문서:{" "}
              <code className="rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 ring-1 ring-slate-100">
                docs/NFC_BLE_WEB_WRITING.md
              </code>
            </p>
          </div>
        </div>
        <Link
          href="/admin/monitoring"
          prefetch={false}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black text-white shadow-lg transition hover:bg-teal-600"
        >
          NFC/BLE 모니터링
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </CardContent>
    </AdminCard>
  );
}
