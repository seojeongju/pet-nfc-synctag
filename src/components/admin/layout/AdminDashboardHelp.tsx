"use client";

import type { ReactNode } from "react";
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
      title: "URL 기록",
      body: (
        <>
          <p>인벤토리 UID만. Android Chrome(HTTPS) Web NFC 또는 앱.</p>
          <p>
            <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">/t/UID</code> · 동행 wayfinder URL.
          </p>
        </>
      ),
    };
  }

  if (p.startsWith("/admin/nfc-tags/register")) {
    return {
      title: "태그 등록",
      body: (
        <>
          <p>범용 / 동행 선택 → NFC 또는 UID 붙여넣기 → 등록.</p>
          <p>
            BLE: <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">UID,MAC</code> 한 줄.
          </p>
        </>
      ),
    };
  }

  if (p.startsWith("/admin/nfc-tags/inventory")) {
    return {
      title: "인벤토리",
      body: <p>필터 적용 후 행에서 제품·MAC·모드·동행 수정.</p>,
    };
  }

  if (p.startsWith("/admin/nfc-tags/history")) {
    return {
      title: "연결·감사",
      body: <p>위: 연결/해제. 아래: 쓰기·등록 감사.</p>,
    };
  }

  if (p === "/admin/nfc-tags") {
    return {
      title: "태그 허브",
      body: <p>등록 → 기록 → 인벤토리 → 감사. UID+MAC은 같은 행.</p>,
    };
  }

  if (p.startsWith("/admin/nfc-tags")) {
    return {
      title: "태그",
      body: <p>단계 메뉴로 이동합니다.</p>,
    };
  }

  if (p.startsWith("/admin/monitoring")) {
    return {
      title: "모니터링",
      body: <p>NFC·BLE·랜딩 등 운영 지표. 기간 필터로 범위 조정.</p>,
    };
  }

  if (p.startsWith("/admin/announcements")) {
    return {
      title: "모드 공지",
      body: <p>대시보드 모드별 공지. 대상·기간 확인.</p>,
    };
  }

  if (p.startsWith("/admin/users")) {
    return {
      title: "사용자",
      body: (
        <p>
          검색·필터 · <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">platform_admin</code> 부여.
          마지막 관리자는 해제 불가. 조직 역할은 테넌트 메뉴.
        </p>
      ),
    };
  }

  if (p.startsWith("/admin/tenants")) {
    return {
      title: "테넌트",
      body: <p>조직 생성·상태·멤버·초대. 변경은 감사 로그.</p>,
    };
  }

  if (p.startsWith("/admin/shop")) {
    return {
      title: "스토어",
      body: (
        <p>
          상품(슬러그·가격·모드) · 주문 상태. 사용자 스토어{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">/shop</code>.
        </p>
      ),
    };
  }

  if (p === "/admin") {
    return {
      title: "통합 대시보드",
      body: <p>서비스별 현황(사용자·태그·Link-U·주문·스튜디오). 각 카드를 누르면 해당 관리 화면으로 이동합니다.</p>,
    };
  }

  if (p === "/admin/linku") {
    return {
      title: "Link-U 안심 운영",
      body: <p>KPI·태그 지표. NFC 작업은 태그 메뉴.</p>,
    };
  }

  if (p.startsWith("/admin/platform/services")) {
    return {
      title: "서비스 관리",
      body: <p>플랫폼 서비스 목록·상태·제작 가능한 태그 모양.</p>,
    };
  }

  if (p.startsWith("/admin/platform/studio/templates")) {
    return {
      title: "스튜디오 템플릿",
      body: <p>서비스별 기본·추가 템플릿을 관리합니다. 추가 템플릿은 /studio에 바로 노출됩니다.</p>,
    };
  }

  if (p.startsWith("/admin/platform/studio")) {
    return {
      title: "태그 스튜디오",
      body: <p>고객 커스텀 태그 디자인. 상태 탭으로 필터링합니다. 템플릿은 「템플릿 관리」에서 추가합니다.</p>,
    };
  }

  return {
    title: "도움말",
    body: <p>왼쪽 메뉴에서 페이지를 선택하세요.</p>,
  };
}
