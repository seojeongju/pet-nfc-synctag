import type { LucideIcon } from "lucide-react";
import { PawPrint, UserRound, Baby, Briefcase, Gem } from "lucide-react";
import type { SubjectKind } from "@/lib/subject-kind";

export type ModeLandingVisual = {
  heroImageSrc: string | null;
  heroAlt: string;
  badge: string;
  statLabel: string;
  statValue: string;
  Icon: LucideIcon;
  gradient: string;
  blobA: string;
  blobB: string;
  buttonClass: string;
  sheetAccent: string;
  finderBoxBorder: string;
  finderBoxBg: string;
  finderTitleClass: string;
  finderBodyClass: string;
  titleGradientFrom: string;
  titleGradientTo: string;
};

export const modeLandingVisual: Record<SubjectKind, ModeLandingVisual> = {
  pet: {
    heroImageSrc: "/korean_pet_hero_1774861698476.png",
    heroAlt: "반려동물과 보호자",
    badge: "링크유 - 펫",
    statLabel: "등록된 반려동물",
    statValue: "1,240+",
    Icon: PawPrint,
    gradient: "from-teal-400 via-teal-500 to-cyan-600",
    blobA: "bg-teal-500/10",
    blobB: "bg-indigo-500/10",
    buttonClass: "bg-teal-500 text-white shadow-teal-500/25 hover:bg-teal-600",
    sheetAccent: "text-teal-600",
    finderBoxBorder: "border-teal-100",
    finderBoxBg: "bg-teal-50/70",
    finderTitleClass: "text-teal-900",
    finderBodyClass: "text-teal-800/85",
    titleGradientFrom: "from-teal-500",
    titleGradientTo: "to-indigo-600",
  },
  elder: {
    heroImageSrc: null,
    heroAlt: "",
    badge: "링크유 - 메모리",
    statLabel: "가족 연결 케어",
    statValue: "890+",
    Icon: UserRound,
    gradient: "from-violet-500 via-indigo-500 to-blue-600",
    blobA: "bg-violet-500/10",
    blobB: "bg-blue-500/10",
    buttonClass: "bg-violet-600 text-white shadow-violet-500/25 hover:bg-violet-700",
    sheetAccent: "text-violet-600",
    finderBoxBorder: "border-violet-100",
    finderBoxBg: "bg-violet-50/80",
    finderTitleClass: "text-violet-950",
    finderBodyClass: "text-violet-900/85",
    titleGradientFrom: "from-violet-600",
    titleGradientTo: "to-blue-600",
  },
  child: {
    heroImageSrc: null,
    heroAlt: "",
    badge: "링크유 - 키즈",
    statLabel: "안심 가정 연결",
    statValue: "620+",
    Icon: Baby,
    gradient: "from-amber-400 via-orange-400 to-rose-500",
    blobA: "bg-amber-500/10",
    blobB: "bg-rose-500/10",
    buttonClass: "bg-amber-500 text-white shadow-amber-500/25 hover:bg-amber-600",
    sheetAccent: "text-amber-600",
    finderBoxBorder: "border-amber-100",
    finderBoxBg: "bg-amber-50/80",
    finderTitleClass: "text-amber-950",
    finderBodyClass: "text-amber-900/85",
    titleGradientFrom: "from-amber-500",
    titleGradientTo: "to-rose-600",
  },
  luggage: {
    heroImageSrc: null,
    heroAlt: "",
    badge: "링크유 - 캐리",
    statLabel: "여행·분실 복구",
    statValue: "430+",
    Icon: Briefcase,
    gradient: "from-slate-600 via-slate-700 to-teal-800",
    blobA: "bg-slate-500/10",
    blobB: "bg-teal-500/10",
    buttonClass: "bg-slate-800 text-white shadow-slate-900/20 hover:bg-slate-900",
    sheetAccent: "text-slate-700",
    finderBoxBorder: "border-slate-200",
    finderBoxBg: "bg-slate-100/90",
    finderTitleClass: "text-slate-900",
    finderBodyClass: "text-slate-700",
    titleGradientFrom: "from-slate-700",
    titleGradientTo: "to-teal-700",
  },
  gold: {
    heroImageSrc: null,
    heroAlt: "",
    badge: "링크유 - 골드",
    statLabel: "가치·안심 연결",
    statValue: "310+",
    Icon: Gem,
    gradient: "from-amber-500 via-yellow-600 to-amber-800",
    blobA: "bg-amber-400/15",
    blobB: "bg-rose-500/10",
    buttonClass: "bg-gradient-to-r from-amber-600 to-amber-800 text-white shadow-amber-900/25 hover:from-amber-700 hover:to-amber-900",
    sheetAccent: "text-amber-700",
    finderBoxBorder: "border-amber-100",
    finderBoxBg: "bg-amber-50/90",
    finderTitleClass: "text-amber-950",
    finderBodyClass: "text-amber-900/85",
    titleGradientFrom: "from-amber-600",
    titleGradientTo: "to-rose-700",
  },
};

export type ModeLandingCopy = {
  kicker: string;
  titleLine1: string;
  titleGradient: string;
  subline: string;
  finderTitle: string;
  finderLines: string[];
};

export const modeLandingCopy: Record<SubjectKind, ModeLandingCopy> = {
  pet: {
    kicker: "링크유 - 펫 · Smart NFC",
    titleLine1: "반려동물을 위한",
    titleGradient: "완벽한 디지털 명함",
    subline:
      "NFC 스마트 인식표와 실시간 알림으로 우리 아이의 안전을 스마트하게 지키세요.",
    finderTitle: "인식표를 스캔하셨나요?",
    finderLines: [
      "발견자분은 로그인 없이 연락 안내 페이지로 이동합니다.",
      "제품에 적힌 주소(예: /t/태그번호)를 그대로 열어 주세요.",
      "이 화면은 링크유 - 펫 보호자 등록·관리용입니다.",
    ],
  },
  elder: {
    kicker: "링크유 - 메모리 · Smart NFC",
    titleLine1: "어르신을 위한",
    titleGradient: "기억 동행 디지털 안심표",
    subline:
      "NFC와 선택 연동으로 가족에게 연락처와 위치를 안전하게 전달하고, 일상 동행을 돕습니다.",
    finderTitle: "인식표·안심표를 보셨나요?",
    finderLines: [
      "발견·도움을 주시는 분은 로그인 없이 연락 안내 화면으로 이동합니다.",
      "제품의 URL(/t/번호)을 브라우저에 그대로 입력해 주세요.",
      "이 화면은 링크유 - 메모리 가족(보호자) 등록·관리용입니다.",
    ],
  },
  child: {
    kicker: "링크유 - 키즈 · Smart NFC",
    titleLine1: "우리 아이를 위한",
    titleGradient: "안심 연결 패스",
    subline:
      "등교·외출 시 NFC와 알림으로 보호자와 빠르게 연결하고, 안심 구역·이탈 알림을 활용할 수 있습니다.",
    finderTitle: "아이 인식표를 보셨나요?",
    finderLines: [
      "선생님·주변 분은 로그인 없이 연락 안내로 안내됩니다.",
      "제품에 적힌 /t/태그 주소를 그대로 열어 주세요.",
      "이 화면은 링크유 - 키즈 보호자(법정대리인) 등록·관리용입니다.",
    ],
  },
  luggage: {
    kicker: "링크유 - 캐리 · Smart NFC",
    titleLine1: "수하물·캐리어를 위한",
    titleGradient: "분실 방지 디지털 택",
    subline:
      "여행·공항에서 NFC 한 번으로 주인 연락처를 전달하고, 분실 시 복구 가능성을 높입니다.",
    finderTitle: "택·인식표를 발견하셨나요?",
    finderLines: [
      "발견자는 로그인 없이 연락 안내 페이지로 이동합니다.",
      "제품에 표기된 /t/태그 주소를 열어 주세요.",
      "이 화면은 링크유 - 캐리 소유자 등록·관리용입니다.",
    ],
  },
  gold: {
    kicker: "링크유 - 골드 · Smart NFC",
    titleLine1: "주얼리를 위한",
    titleGradient: "가치 인증과 안심 보호",
    subline:
      "고귀한 가치(인증서)로 품격을 증명하고, 안전한 보호(분실 방지)로 소유자와 빠르게 연결합니다. NFC 한 번에 두 가지 핵심을 함께 전달합니다.",
    finderTitle: "인증 태그·인식표를 보셨나요?",
    finderLines: [
      "발견자는 로그인 없이 연락·안내 페이지로 이동합니다.",
      "제품에 표기된 /t/태그 주소를 열어 주세요.",
      "이 화면은 링크유 - 골드 소유자 등록·관리용입니다.",
    ],
  },
};
