"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PawPrint, MessageSquare, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

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

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackURL = useMemo(
    () => safeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams]
  );

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
          <div className="w-20 h-20 bg-teal-500 rounded-[28px] shadow-2xl shadow-teal-200 flex items-center justify-center text-white mx-auto rotate-12">
            <PawPrint className="w-10 h-10 -rotate-12" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">반려동물과 다시 연결하기</h1>
            <p className="text-slate-400 text-sm font-medium">링크유(Link-U)에 오신 것을 환영합니다.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3 flex gap-3 text-left">
          <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold text-teal-900 leading-relaxed">
            인식표·태그를 방금 스캔하고 오신 분은{" "}
            <span className="underline decoration-teal-400">로그인 없이</span> 연락 안내를 보실 수 있어요. 아래는{" "}
            <span className="text-teal-950">보호자용</span> 로그인입니다.
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
          <p className="text-xs text-slate-400 font-semibold">링크유 Link-U © 2024. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}
