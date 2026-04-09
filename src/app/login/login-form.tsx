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
