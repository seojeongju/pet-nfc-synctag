"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  PawPrint,
  MessageSquare,
  ArrowLeft,
  Info,
  UserRound,
  Baby,
  Briefcase,
  Gem,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { type SubjectKind, parseSubjectKind } from "@/lib/subject-kind";

const DEFAULT_CALLBACK = "/hub";

/** better-auth OAuth 라우트 베이스 (@/lib/auth 기본과 동일) */
const AUTH_HTTP_BASE = "/api/auth";

/**
 * 인가 URL 보강: 모바일·터치 환경에서 Google 계정 UI가 PC형(가운데 카드)으로 고정되는 현상 완화.
 * - `display=touch` — OAuth 스펙상 터치 단말용 UI 힌트 (Android의 `wap`은 구형이라 최신 선택 화면에서 피함)
 * - `btmpl=mobile` — 비공식 파라미터이나 무시되어도 무해하며 일부 세션에서 모바일 템플릿을 선택한다고 알려짐
 */
function augmentGoogleAuthorizationUrl(authUrl: string): string {
  try {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const u = new URL(authUrl);

    const isAndroid = /Android/i.test(ua);
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const coarse =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(pointer: coarse)").matches
        : false;
    const narrowViewport =
      typeof window !== "undefined" && typeof window.innerWidth === "number" && window.innerWidth < 1024;

    const preferMobileChrome = isAndroid || isIos || coarse || narrowViewport;
    if (!preferMobileChrome) {
      return authUrl;
    }

    u.searchParams.set("display", "touch");
    u.searchParams.set("btmpl", "mobile");
    return u.toString();
  } catch {
    return authUrl;
  }
}

/** fetch로 OAuth URL 수신 → 클라이언트 보강 후 이동 (signIn.social 래핑과 무관하게 url 확보) */
async function redirectToGoogleOAuth(callbackURL: string): Promise<void> {
  const res = await fetch(`${AUTH_HTTP_BASE}/sign-in/social`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      provider: "google",
      callbackURL,
      disableRedirect: true,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("[sign-in/google] HTTP", res.status, text.slice(0, 500));
    return;
  }

  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    console.error("[sign-in/google] JSON parse failed", text.slice(0, 300));
    return;
  }

  const url =
    typeof parsed === "object" &&
    parsed !== null &&
    "url" in parsed &&
    typeof (parsed as { url: unknown }).url === "string"
      ? (parsed as { url: string }).url
      : null;

  if (url && url.length > 0) {
    window.location.assign(augmentGoogleAuthorizationUrl(url));
    return;
  }

  console.error("[sign-in/google] 응답에 url 없음", parsed);
}

function safeCallbackUrl(raw: string | null): string {
  if (!raw || typeof raw !== "string") return DEFAULT_CALLBACK;
  try {
    const decoded = decodeURIComponent(raw.trim());
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return DEFAULT_CALLBACK;
    if (decoded.includes("://")) return DEFAULT_CALLBACK;
    return decoded.length > 2048 ? DEFAULT_CALLBACK : decoded;
  } catch {
    return DEFAULT_CALLBACK;
  }
}

type LoginContext = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  infoTitle: string;
  infoBody: string;
  colorClass: string;
  shadowClass: string;
  iconBgClass: string;
};

const MODE_CONTEXT: Record<SubjectKind, LoginContext> = {
  pet: {
    title: "반려동물과 다시 연결하기",
    subtitle: "링크유(Link-U)에 오신 것을 환영합니다.",
    icon: PawPrint,
    infoTitle: "인식표·태그를 방금 스캔하고 오신 분은",
    infoBody: "로그인 없이 연락 안내를 보실 수 있어요. 아래는 보호자용 로그인입니다.",
    colorClass: "text-teal-600",
    shadowClass: "shadow-teal-200",
    iconBgClass: "bg-teal-500",
  },
  elder: {
    title: "가족과 다시 연결하기",
    subtitle: "링크유(Link-U)에 오신 것을 환영합니다.",
    icon: UserRound,
    infoTitle: "안심표·인식표를 방금 스캔하고 오신 분은",
    infoBody: "로그인 없이 안심 안내를 보실 수 있어요. 아래는 가족 보호자용 로그인입니다.",
    colorClass: "text-violet-600",
    shadowClass: "shadow-violet-200",
    iconBgClass: "bg-violet-600",
  },
  child: {
    title: "우리 아이와 다시 연결하기",
    subtitle: "링크유(Link-U)에 오신 것을 환영합니다.",
    icon: Baby,
    infoTitle: "안심 패스·인식표를 방금 스캔하고 오신 분은",
    infoBody: "로그인 없이 위치 및 보호자 정보를 보실 수 있어요. 아래는 법정대리인 로그인입니다.",
    colorClass: "text-amber-600",
    shadowClass: "shadow-amber-200",
    iconBgClass: "bg-amber-500",
  },
  luggage: {
    title: "소지품과 다시 연결하기",
    subtitle: "링크유(Link-U)에 오신 것을 환영합니다.",
    icon: Briefcase,
    infoTitle: "캐리어 택·인식표를 방금 스캔하고 오신 분은",
    infoBody: "로그인 없이 연락 안내 페이지를 보실 수 있어요. 아래는 소유자용 로그인입니다.",
    colorClass: "text-late-700",
    shadowClass: "shadow-slate-200",
    iconBgClass: "bg-slate-800",
  },
  gold: {
    title: "고귀한 가치와 연결하기",
    subtitle: "링크유(Link-U)에 오신 것을 환영합니다.",
    icon: Gem,
    infoTitle: "인증 태그를 방금 스캔하고 오신 분은",
    infoBody: "로그인 없이 가치 인증과 안내를 보실 수 있어요. 아래는 정품 소유자 전용 로그인입니다.",
    colorClass: "text-amber-700",
    shadowClass: "shadow-amber-200",
    iconBgClass: "bg-amber-600",
  },
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackURL = useMemo(
    () => safeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams]
  );
  
  const kindParam = searchParams.get("kind");
  const kind = parseSubjectKind(kindParam);
  const ctx = MODE_CONTEXT[kind];
  const IconComponent = ctx.icon;

  const handleLogin = async (provider: "google" | "kakao") => {
    if (provider === "google") {
      await redirectToGoogleOAuth(callbackURL);
      return;
    }
    await signIn.social({
      provider,
      callbackURL,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-50 via-white to-indigo-50">
      <Link href="/" className="absolute top-8 left-8">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-slate-800">
          <ArrowLeft className="w-6 h-6" />
        </div>
      </Link>

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4">
          <div className={`w-20 h-20 ${ctx.iconBgClass} rounded-[28px] shadow-2xl ${ctx.shadowClass} flex items-center justify-center text-white mx-auto rotate-12`}>
            <IconComponent className="w-10 h-10 -rotate-12" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{ctx.title}</h1>
            <p className="text-slate-400 text-sm font-medium">{ctx.subtitle}</p>
          </div>
        </div>

        <div className={`rounded-2xl border ${ctx.colorClass.replace('text-', 'border-').replace('600', '100').replace('700', '100')} ${ctx.colorClass.replace('text-', 'bg-').replace('600', '50').replace('700', '50')}/60 px-4 py-3 flex gap-3 text-left`}>
          <Info className={`w-5 h-5 ${ctx.colorClass} shrink-0 mt-0.5`} />
          <p className="text-[11px] font-bold text-slate-800 leading-relaxed">
            {ctx.infoTitle}{" "}
            <span className={`underline decoration-${ctx.colorClass.split('-')[1]}-400`}>로그인 없이</span> 연락 안내를 보실 수 있어요. 아래는{" "}
            <span className="font-black">보호자 전용</span> 로그인입니다.
          </p>
        </div>

        <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white/80 backdrop-blur-md">
          <CardHeader className="pt-10 pb-6 text-center">
            <CardTitle className="text-xl font-bold text-slate-800">간편 로그인</CardTitle>
            <CardDescription className="text-slate-400">
              번거로운 비밀번호 없이 소셜 계정으로 시작하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-2 space-y-4">
            <Button
              variant="outline"
              className="w-full h-16 rounded-[24px] border-slate-100 hover:bg-slate-50 text-slate-700 font-bold text-lg flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-sm"
              onClick={() => handleLogin("google")}
            >
              Google로 계속하기
            </Button>

            <Button
              variant="outline"
              className="w-full h-16 rounded-[24px] border-slate-100 bg-[#FEE500] hover:bg-[#FEE500]/90 text-slate-900 font-bold text-lg flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-sm border-none"
              onClick={() => handleLogin("kakao")}
            >
              <MessageSquare className="w-6 h-6 fill-current" />
              카카오로 계속하기
            </Button>

            <div className="pt-6 text-center">
              <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center">
          <div className="space-y-1 text-[11px] text-slate-400 font-semibold leading-relaxed">
            <p>© 2026 WOW3D PRO. (주)와우쓰리디. All rights reserved.</p>
            <p>대표 전화: 02-3144-3137 / 054-464-3144</p>
            <p>이메일 문의: wow3d16@naver.com</p>
            <p>사업자등록번호: 849-88-01659</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
