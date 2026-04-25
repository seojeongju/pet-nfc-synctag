"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PawPrint,
  MessageSquare,
  ArrowLeft,
  Info,
  UserRound,
  Baby,
  Briefcase,
  Gem,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { SUBJECT_KINDS, type SubjectKind, parseSubjectKind } from "@/lib/subject-kind";

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

/**
 * OAuth 완료 후 이동할 경로. `callbackUrl`이 없어도 `kind`만 있으면 해당 모드 대시보드로 직행(허브 경유 방지).
 */
function resolveLoginCallbackUrl(searchParams: Pick<URLSearchParams, "get">): string {
  const explicit = searchParams.get("callbackUrl");
  if (explicit && explicit.trim()) {
    return safeCallbackUrl(explicit);
  }
  const kindParam = searchParams.get("kind");
  if (kindParam && (SUBJECT_KINDS as readonly string[]).includes(kindParam)) {
    return `/dashboard/${encodeURIComponent(kindParam)}`;
  }
  return DEFAULT_CALLBACK;
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
  const callbackURL = useMemo(() => resolveLoginCallbackUrl(searchParams), [searchParams]);
  const signupRedirectUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set("onboarding", "welcome");
    const kindParam = searchParams.get("kind");
    if (kindParam && (SUBJECT_KINDS as readonly string[]).includes(kindParam)) {
      p.set("kind", kindParam);
    }
    return `/hub?${p.toString()}`;
  }, [searchParams]);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");
  
  const kindParam = searchParams.get("kind");
  const kind = parseSubjectKind(kindParam);
  const ctx = MODE_CONTEXT[kind];
  const IconComponent = ctx.icon;

  /**
   * 통합 소셜 로그인 핸들러.
   *
   * [구글]
   *   accounts.google.com → /api/auth/callback/google(302) → /auth/complete → 최종 목적지
   *   중간 /auth/complete 페이지를 거쳐 viewport 메타를 재설정한 뒤 이동합니다.
   *   이유: 외부 도메인(Google)에서 연속 302로 복귀 시 일부 모바일 브라우저가
   *         viewport 컨텍스트를 외부 도메인 값으로 승계하는 버그가 존재하기 때문입니다.
   *
   * [카카오]
   *   카카오톡 딥링크로 처리되어 브라우저 viewport 히스토리 오염이 없으므로
   *   callbackURL을 직접 최종 목적지로 설정합니다.
   */
  const handleLogin = async (provider: "google" | "kakao") => {
    // 구글만 /auth/complete 브리지를 경유 (카카오는 기존 방식 유지)
    const resolvedCallbackURL =
      provider === "google"
        ? `/auth/complete?next=${encodeURIComponent(callbackURL)}`
        : callbackURL;

    await signIn.social({
      provider,
      callbackURL: resolvedCallbackURL,
    });
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (signupLoading) return;

    setSignupError("");
    setSignupSuccess("");

    if (!signupName.trim()) {
      setSignupError("이름을 입력해 주세요.");
      return;
    }
    if (!signupEmail.trim()) {
      setSignupError("이메일을 입력해 주세요.");
      return;
    }
    if (signupPassword.length < 8) {
      setSignupError("비밀번호는 8자 이상으로 입력해 주세요.");
      return;
    }

    setSignupLoading(true);
    try {
      const result = await signUp.email({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        callbackURL: signupRedirectUrl,
      });
      const signupResultError = result?.error;
      if (signupResultError) {
        const raw = signupResultError.message || "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.";
        const lower = raw.toLowerCase();
        if (lower.includes("already") || lower.includes("exists")) {
          setSignupError("이미 가입된 이메일입니다. 간편 로그인 또는 기존 계정으로 로그인해 주세요.");
        } else {
          setSignupError(raw);
        }
        return;
      }

      setSignupSuccess("회원가입이 완료되었습니다. 잠시 후 이동합니다.");
      window.location.assign(signupRedirectUrl);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.";
      setSignupError(message);
    } finally {
      setSignupLoading(false);
    }
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
            <CardTitle className="text-xl font-bold text-slate-800">
              {authTab === "login" ? "간편 로그인" : "이메일 회원가입"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {authTab === "login"
                ? "번거로운 비밀번호 없이 소셜 계정으로 시작하세요."
                : "처음이신가요? 이메일 계정으로 빠르게 시작하세요."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-2 space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-1.5 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("login");
                  setSignupError("");
                  setSignupSuccess("");
                }}
                className={`h-10 rounded-xl text-xs font-black transition-colors ${
                  authTab === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                간편 로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signup");
                  setSignupError("");
                  setSignupSuccess("");
                }}
                className={`h-10 rounded-xl text-xs font-black transition-colors ${
                  authTab === "signup"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                회원가입
              </button>
            </div>

            {authTab === "login" ? (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full h-16 rounded-[24px] border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-lg flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-sm"
                  onClick={() => handleLogin("google")}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
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

                <p className="text-[11px] font-bold text-slate-500 text-center">
                  처음이신가요? 상단의 회원가입 탭에서 이메일 계정을 만들 수 있어요.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-2.5">
                <Input
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="이름"
                  className="h-11 rounded-xl border-slate-200 bg-white font-semibold"
                  autoComplete="name"
                  disabled={signupLoading}
                  required
                />
                <Input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="이메일"
                  className="h-11 rounded-xl border-slate-200 bg-white font-semibold"
                  autoComplete="email"
                  disabled={signupLoading}
                  required
                />
                <Input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="비밀번호 (8자 이상)"
                  className="h-11 rounded-xl border-slate-200 bg-white font-semibold"
                  autoComplete="new-password"
                  disabled={signupLoading}
                  required
                  minLength={8}
                />

                {signupError ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-600">
                    {signupError}
                  </p>
                ) : null}
                {signupSuccess ? (
                  <p className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-[11px] font-bold text-teal-700">
                    {signupSuccess}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full h-11 rounded-xl bg-teal-600 text-white font-black hover:bg-teal-500"
                >
                  {signupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "이메일로 회원가입"}
                </Button>
              </form>
            )}

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
