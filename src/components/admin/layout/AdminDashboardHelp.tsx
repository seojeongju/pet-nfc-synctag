"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminHelpDialog } from "@/components/admin/layout/AdminHelpDialog";

function normalizePath(pathname: string) {
  const trimmed = pathname.replace(/\/$/, "") || "/admin";
  return trimmed;
}

export function AdminDashboardHelp() {
  const pathname = usePathname() || "";
  const { title, body } = helpContentForPath(normalizePath(pathname));
  return (
    <AdminHelpDialog title={title} triggerLabel="도움말">
      {body}
    </AdminHelpDialog>
  );
}

function helpContentForPath(p: string): { title: string; body: ReactNode } {
  if (p.startsWith("/admin/nfc-tags/write-url")) {
    return {
      title: "URL 기록 (Web NFC)",
      body: (
        <>
          <p>
            <strong>대상:</strong> 인벤토리에 이미 등록된 UID만 NDEF URL(<code className="rounded bg-slate-100 px-1 font-mono text-[11px]">앱주소/t/UID</code>)로 기록됩니다. 미등록 UID는 거절됩니다.
          </p>
          <p>
            <strong>환경:</strong> Android Chrome·HTTPS·화면 탭(제스처)이 필요합니다. iOS Safari는 Web NFC를 지원하지 않습니다.
          </p>
          <p>
            <strong>Web NFC 쓰기(NDEFReader.write):</strong> 이 메서드가 없으면 이 브라우저에서는 기록할 수 없습니다. Android Chrome(HTTPS)에서 열거나, 문서에 안내된 외부 NFC 기록 도구로 동일 URL 형식을 기록하세요.
          </p>
          <p>
            <strong>전용 앱(선택):</strong> 배포 시 환경 변수 <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">NEXT_PUBLIC_NFC_NATIVE_HANDOFF_ENABLED=true</code>를 켜면 &quot;전용 앱에서 쓰기 열기&quot; 버튼이 나타납니다. 기본 운영 경로는 Web NFC입니다.
          </p>
          <p>
            <strong>NDEFReader(UID 읽기):</strong> 없으면 NFC로 UID를 읽을 수 없고 수동 입력만 가능합니다.
          </p>
          <p>성공·실패는 감사 로그에 남습니다. 완료 후 인벤토리·연결·감사에서 상태를 확인하세요.</p>
          <p className="text-[12px] text-slate-500">규칙·예외: docs/NFC_BLE_WEB_WRITING.md</p>
          <p><Link href="/admin/monitoring" className="font-black text-teal-700 underline-offset-2 hover:underline">NFC/BLE 모니터링</Link></p>
        </>
      ),
    };
  }

  if (p.startsWith("/admin/nfc-tags/register")) {
    return {
      title: "태그 UID 등록",
      body: (
        <>
          <p>
            <strong>모드 탭:</strong> 펫·메모리·키즈·러기지·골드 중 할당 모드를 고른 뒤 UID를 입력합니다. 선택한 모드가 인벤토리에 미리 연결됩니다.
          </p>
          <p>
            <strong>입력 형식:</strong> 한 줄에 하나, 또는 쉼표로 구분합니다. <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">AA:BB:CC:DD:EE:FF</code> 등 허용 형식을 따르세요. DB에 이미 있는 UID는 건너뜁니다.
          </p>
          <p>
            <strong>NFC로 한 줄 추가:</strong> Android Chrome, HTTPS, 사용자 제스처(버튼 탭)가 필요합니다. 태그를 스캔하면 UID 한 줄이 붙습니다.
          </p>
          <p>
            <strong>연속 스캔:</strong> 여러 태그를 연속으로 읽어 목록에 추가합니다. 중지할 때까지 유지됩니다.
          </p>
          <p>
            <strong>NDEFReader 미지원:</strong> 이 브라우저에서는 NFC 읽기 버튼을 쓸 수 없습니다. 직접 입력하거나 Android Chrome에서 여세요.
          </p>
          <p>
            등록 후 <strong>URL 기록</strong> 화면에서 Web NFC로 실물 태그에 URL을 씁니다.
          </p>
        </>
      ),
    };
  }

  if (p.startsWith("/admin/nfc-tags/inventory")) {
    return {
      title: "태그 인벤토리",
      body: (
        <>
          <p>마스터 데이터에서 UID·제품·할당 모드·BLE MAC 등을 관리합니다.</p>
          <p>
            <strong>검색·필터:</strong> 주소창 쿼리로 동작합니다. 검색(UID·제품명·펫·이메일), 상태(미판매 등), 배치 ID를
            조합한 뒤 <strong>적용</strong>을 누르세요. 목록은 서버에서 페이지 단위로 불러옵니다.
          </p>
          <p>
            <strong>모바일:</strong> 카드 한 줄을 탭하면 편집 폼이 펼쳐집니다. 배치 통계의「이 배치만 보기」로 같은
            필터를 바로 걸 수 있습니다.
          </p>
        </>
      ),
    };
  }

  if (p.startsWith("/admin/nfc-tags/history")) {
    return {
      title: "연결과 감사 이력",
      body: (
        <>
          <p>보호자·대상 연결 로그와 관리자 NFC URL 기록 등 감사 로그를 조회합니다.</p>
          <p>필터·정렬·기간은 아래 패널에서 조정합니다.</p>
        </>
      ),
    };
  }

  if (p === "/admin/nfc-tags") {
    return {
      title: "Pet-ID NFC 허브",
      body: (
        <>
          <p>인벤토리 등록부터 감사까지 표준 순서로 이동합니다. 표준 순서를 따르면 미등록 UID 기록·중복 작업이 줄어듭니다.</p>
          <p><strong>운영 순서:</strong> UID 등록 → URL 기록 → 인벤토리 점검 → 연결·감사.</p>
          <p><strong>보안:</strong> URL 기록은 DB에 등록된 UID에만 허용됩니다. Web NFC 규칙과 동일합니다.</p>
        </>
      ),
    };
  }

  if (p.startsWith("/admin/nfc-tags")) {
    return {
      title: "Pet-ID NFC",
      body: (
        <p>왼쪽 단계 메뉴에서 허브·등록·기록·인벤토리·이력으로 이동합니다. 브라우저 제약은 URL 기록 페이지 도움말을 참고하세요.</p>
      ),
    };
  }

  if (p.startsWith("/admin/monitoring")) {
    return {
      title: "운영 모니터링",
      body: (
        <>
          <p>NFC 스캔·BLE 이벤트·지도 텔레메트리 등 운영 지표를 확인합니다. 기간 필터로 범위를 바꿀 수 있습니다.</p>
          <p>알림·임계값 관련 설정은 화면 안내를 따르세요.</p>
        </>
      ),
    };
  }

  if (p.startsWith("/admin/announcements")) {
    return {
      title: "모드 공지",
      body: (
        <p>대시보드에 표시되는 모드별 공지를 관리합니다. 노출 대상과 기간을 확인하세요.</p>
      ),
    };
  }

  if (p.startsWith("/admin/users")) {
    return {
      title: "사용자 관리",
      body: (
        <>
          <p>
            가입자 목록을 검색·필터하고 <strong>플랫폼 관리자</strong>(<code className="rounded bg-slate-100 px-1 font-mono text-[11px]">platform_admin</code>) 역할을 부여하거나 해제할 수 있습니다. 마지막 한 명의 관리자는 일반 사용자로 내릴 수 없습니다.
          </p>
          <p>조직(B2B) 안에서의 역할(owner/admin/member)은 조직·멤버 관리 메뉴에서 다룹니다.</p>
        </>
      ),
    };
  }

  if (p.startsWith("/admin/tenants")) {
    return {
      title: "테넌트 관리",
      body: (
        <>
          <p>조직(테넌트) 생성·이름 변경·상태·멤버·초대를 관리합니다. 감사 로그로 변경 이력을 확인할 수 있습니다.</p>
        </>
      ),
    };
  }

  if (p.startsWith("/admin/shop")) {
    return {
      title: "스토어 관리",
      body: (
        <>
          <p>
            <strong>상품:</strong> 슬러그(URL 경로)·가격·노출 모드(5종)·판매 활성을 설정합니다. 저장 후 사용자 스토어(
            <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">/shop</code>)에 반영됩니다.
          </p>
          <p>
            <strong>주문:</strong> 사용자 주문과 상태(결제 대기·완료·실패·취소)를 확인·변경합니다. PG 연동 전에는
            운영 정책에 맞게 수동으로 맞춥니다.
          </p>
        </>
      ),
    };
  }

  if (p === "/admin") {
    return {
      title: "운영 대시보드",
      body: (
        <>
          <p>플랫폼 요약 KPI, 태그 운영 지표, 실패 유형 상위 등을 한 화면에서 봅니다.</p>
          <p>NFC 세부 작업은 <strong>Pet-ID NFC</strong> 메뉴에서 표준 순서대로 진행하세요.</p>
        </>
      ),
    };
  }

  return {
    title: "관리자 도움말",
    body: (
      <>
        <p>플랫폼 관리자 기능입니다. 왼쪽 메뉴에서 페이지를 선택하세요.</p>
        <p>NFC 태그 운영은 Pet-ID NFC 메뉴의 허브와 단계별 화면을 이용합니다.</p>
      </>
    ),
  };
}
