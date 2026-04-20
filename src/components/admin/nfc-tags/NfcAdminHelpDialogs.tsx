"use client";

import Link from "next/link";
import { AdminHelpDialog } from "@/components/admin/layout/AdminHelpDialog";

export function NfcWebNfcEnvironmentHelp() {
  return (
    <AdminHelpDialog title="Web NFC 환경" triggerLabel="환경">
      <p>
        <strong>Android Chrome:</strong> URL 기록에는 HTTPS와 사용자 제스처(버튼 탭 등)가 필요합니다.
      </p>
      <p>
        <strong>iOS Safari:</strong> Web NFC를 지원하지 않습니다. Android Chrome 등 지원 브라우저에서 진행하세요.
      </p>
      <p className="text-[12px] text-slate-500">자세한 규칙은 docs/NFC_BLE_WEB_WRITING.md를 참고하세요.</p>
    </AdminHelpDialog>
  );
}

export function NfcHubOverviewHelp() {
  return (
    <AdminHelpDialog title="Pet-ID NFC 허브 안내" triggerLabel="안내">
      <p>인벤토리 등록부터 감사까지 이 메뉴에서 순서대로 이동할 수 있습니다.</p>
      <p>표준 순서를 따르면 미등록 UID 기록·중복 작업 같은 오류가 줄어듭니다.</p>
    </AdminHelpDialog>
  );
}

const WORKFLOW_DETAIL: { step: string; title: string; body: string }[] = [
  {
    step: "1",
    title: "UID 등록",
    body: "제조·입고 태그 UID를 인벤토리에 넣습니다. 모드 할당을 함께 지정할 수 있습니다.",
  },
  {
    step: "2",
    title: "URL 기록",
    body: "등록된 UID에만 NDEF URL을 실물 태그에 기록합니다. Android Chrome과 HTTPS가 필요합니다.",
  },
  {
    step: "3",
    title: "인벤토리 점검",
    body: "재고·활성·연결 상태, 제품 메타·BLE MAC 등을 확인합니다.",
  },
  {
    step: "4",
    title: "연결·감사",
    body: "보호자 연결 로그와 관리자 NFC 기록 감사를 조회합니다.",
  },
];

export function NfcWorkflowStepsHelp() {
  return (
    <AdminHelpDialog title="운영 체크리스트" triggerLabel="상세" iconOnly>
      <p className="text-slate-500">미등록 UID에는 URL 기록이 불가합니다. 기록 후 인벤토리·이력으로 확인하세요.</p>
      <ol className="list-none space-y-3 p-0">
        {WORKFLOW_DETAIL.map((s) => (
          <li key={s.step} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-[11px] font-black text-teal-700">단계 {s.step}</p>
            <p className="mt-0.5 font-black text-slate-900">{s.title}</p>
            <p className="mt-1 text-[12px] text-slate-600">{s.body}</p>
          </li>
        ))}
      </ol>
    </AdminHelpDialog>
  );
}

const QUICK_LINK_DETAIL: { title: string; body: string }[] = [
  { title: "UID 등록", body: "대량 줄 입력, 모드 할당·배치 ID." },
  { title: "URL 기록 (Web NFC)", body: "NDEF URL 기록 및 감사 로그." },
  { title: "인벤토리", body: "UID 검색·필터, 제품·모드·MAC 관리." },
  { title: "연결·감사 이력", body: "연결 로그·관리자 감사 필터." },
];

export function NfcQuickLinksHelp() {
  return (
    <AdminHelpDialog title="빠른 이동 카드" triggerLabel="설명">
      <ul className="space-y-2">
        {QUICK_LINK_DETAIL.map((row) => (
          <li key={row.title} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <p className="font-black text-slate-900">{row.title}</p>
            <p className="mt-0.5 text-[12px] text-slate-600">{row.body}</p>
          </li>
        ))}
      </ul>
    </AdminHelpDialog>
  );
}

export function NfcSecurityCompatHelp() {
  return (
    <AdminHelpDialog title="보안·호환성" triggerLabel="자세히">
      <p>URL 기록은 DB에 등록된 UID에만 허용됩니다. Web NFC 규칙과 동일합니다.</p>
      <p className="text-[12px] text-slate-500">문서: docs/NFC_BLE_WEB_WRITING.md</p>
      <p className="pt-1">
        <Link href="/admin/monitoring" prefetch={false} className="font-black text-teal-700 underline-offset-2 hover:underline">
          NFC/BLE 모니터링
        </Link>
      </p>
    </AdminHelpDialog>
  );
}
