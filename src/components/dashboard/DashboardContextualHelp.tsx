"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AdminHelpDialog } from "@/components/admin/layout/AdminHelpDialog";
import { parseSubjectKind, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";

type Parsed =
  | { screen: "home"; kind: SubjectKind }
  | { screen: "pets_list"; kind: SubjectKind }
  | { screen: "pets_new"; kind: SubjectKind }
  | { screen: "pet_detail"; kind: SubjectKind }
  | { screen: "pet_edit"; kind: SubjectKind }
  | { screen: "pet_health"; kind: SubjectKind }
  | { screen: "scans"; kind: SubjectKind }
  | { screen: "geofences"; kind: SubjectKind }
  | { screen: "fallback"; kind: SubjectKind };

function parseDashboardRoute(pathname: string, fallbackKind: SubjectKind): Parsed {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "dashboard") return { screen: "fallback", kind: fallbackKind };

  const seg1 = parts[1];
  if (!seg1) return { screen: "fallback", kind: fallbackKind };

  if (seg1 !== "pets" && seg1 !== "scans" && seg1 !== "geofences") {
    const kind = parseSubjectKind(seg1);
    if (parts.length === 2) return { screen: "home", kind };

    const seg2 = parts[2];
    if (seg2 === "pets") {
      if (parts.length === 3) return { screen: "pets_list", kind };
      if (parts.length === 4 && parts[3] === "new") return { screen: "pets_new", kind };
      if (parts.length === 5 && parts[4] === "edit") return { screen: "pet_edit", kind };
      if (parts.length === 5 && parts[4] === "health") return { screen: "pet_health", kind };
      if (parts.length === 4) return { screen: "pet_detail", kind };
    }
    if (seg2 === "scans" && parts.length === 3) return { screen: "scans", kind };
    if (seg2 === "geofences" && parts.length === 3) return { screen: "geofences", kind };

    return { screen: "fallback", kind };
  }

  return { screen: "fallback", kind: fallbackKind };
}

export function DashboardContextualHelp() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const fallbackKind = parseSubjectKind(searchParams.get("kind"));
  const parsed = parseDashboardRoute(pathname, fallbackKind);
  const meta = subjectKindMeta[parsed.kind];

  const { title, body } = helpCopy(parsed, meta);
  return (
    <AdminHelpDialog
      title={title}
      triggerLabel="도움말"
      iconOnly
      triggerClassName="shadow-none"
    >
      {body}
    </AdminHelpDialog>
  );
}

function helpCopy(parsed: Parsed, meta: (typeof subjectKindMeta)[SubjectKind]): { title: string; body: ReactNode } {
  switch (parsed.screen) {
    case "home":
      return {
        title: "대시보드",
        body: (
          <>
            <p>
              현재 모드(<strong>{meta.label}</strong>)의 요약 화면입니다. 상단 &quot;모드 선택&quot;에서 다른 시나리오로 바꿀 수 있어요.
            </p>
            <p>가로 탭(또는 모바일 스크롤 메뉴)에서 관리 대상·스캔 기록·안심 구역으로 이동합니다.</p>
          </>
        ),
      };
    case "pets_list":
      return {
        title: "관리 대상",
        body: (
          <>
            <p>{meta.listHeading} 목록입니다. 프로필을 만든 뒤 NFC 태그를 연결하면 스캔 알림과 연락 흐름을 쓸 수 있어요.</p>
            <p className="text-slate-500">{meta.nfcHelper}</p>
          </>
        ),
      };
    case "pets_new":
      return {
        title: "새 프로필 등록",
        body: (
          <>
            <p className="font-black text-slate-800">{meta.registerTitle}</p>
            <p>{meta.registerSubtitle}</p>
            <p className="text-slate-500">{meta.emptyRegisterHint}</p>
          </>
        ),
      };
    case "pet_detail":
      return {
        title: "프로필",
        body: (
          <>
            <p>선택한 관리 대상의 상세 정보입니다. 태그 연결·연락처·공유 설정 등을 확인하세요.</p>
            <p className="text-slate-500">{meta.description}</p>
          </>
        ),
      };
    case "pet_edit":
      return {
        title: "프로필 수정",
        body: <p>이름·사진·연락처 등 정보를 수정합니다. 저장 후 태그나 안심 구역 설정에 반영됩니다.</p>,
      };
    case "pet_health":
      return {
        title: "건강 기록",
        body: (
          <p>검진·접종 등 기록을 남기고 타임라인으로 확인합니다. 모드에 따라 항목이 다를 수 있어요.</p>
        ),
      };
    case "scans":
      return {
        title: "스캔 기록",
        body: (
          <>
            <p>{meta.emptyScansBody}</p>
            <p className="text-slate-500">{meta.emptyBleHint}</p>
          </>
        ),
      };
    case "geofences":
      return {
        title: "안심 구역",
        body: (
          <>
            <p>집·학교·산책 코스 등 중심과 반경을 저장해 두면 위치 단서와 안심 알림에 활용됩니다.</p>
            <p className="text-slate-500">{meta.emptyGeofencesNoZones}</p>
          </>
        ),
      };
    case "fallback":
    default:
      return {
        title: "링크유 대시보드",
        body: (
          <>
            <p>가족·반려동물·소지품 등 모드별로 프로필과 NFC 태그를 관리합니다.</p>
            <p>
              상단 &quot;도움말&quot;은 화면마다 안내가 바뀝니다. 선택한 모드는{" "}
              <strong>{meta.label}</strong>입니다. &quot;모드 선택&quot;으로 바꿀 수 있어요.
            </p>
          </>
        ),
      };
  }
}
