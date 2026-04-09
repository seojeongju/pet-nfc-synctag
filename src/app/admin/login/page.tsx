"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowLeft, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { adminUi } from "@/styles/admin/ui";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/admin",
      });
      const signInError = result?.error;

      if (signInError) {
        const rawMessage = signInError.message || "로그인에 실패했습니다. 정보를 확인해 주세요.";
        const normalizedMessage =
          rawMessage.toLowerCase().includes("invalid email or password")
            ? "이메일 또는 비밀번호가 올바르지 않습니다."
            : rawMessage;
        setError(normalizedMessage);
      } else {
        // OAuth가 아닌 이메일 로그인은 명시적으로 이동시켜 무반응처럼 보이는 문제를 방지합니다.
        window.location.assign("/admin");
        return;
      }
    } catch (err: unknown) {
      console.error("Login Error:", err);
      setError("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-outfit items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-50 via-white to-indigo-50">
      <Link href="/" className="absolute top-8 left-8">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-slate-800">
           <ArrowLeft className="w-6 h-6" />
        </div>
      </Link>

      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4">
           <div className="w-20 h-20 bg-slate-800 rounded-[28px] shadow-2xl shadow-slate-200 flex items-center justify-center text-white mx-auto rotate-12">
              <ShieldCheck className="w-10 h-10 -rotate-12" />
           </div>
           <div className="space-y-2 mt-6">
             <div className="flex items-center justify-center gap-2 text-slate-500 font-extrabold tracking-[0.2em] text-[10px] uppercase">
                <Lock className="w-3.5 h-3.5" />
                관리자 콘솔 접근
             </div>
             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">관리자 로그인</h1>
             <p className="text-slate-400 text-sm font-medium">관리자 운영 센터</p>
           </div>
        </div>

        <Card className="border-slate-100 shadow-2xl rounded-[40px] overflow-hidden bg-white/80 backdrop-blur-md">
          <CardHeader className="pt-10 pb-6 text-center">
            <CardTitle className="text-xl font-bold text-slate-800">보안 로그인</CardTitle>
            <CardDescription className="text-slate-400">계정 정보를 입력해 세션을 시작하세요</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10 space-y-7">
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black text-slate-500 px-2 uppercase tracking-widest">관리자 아이디</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="admin@petid-connect.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${adminUi.input} h-14 rounded-2xl text-slate-900 focus:ring-teal-500/20 text-sm shadow-inner transition-all hover:bg-slate-100 focus:bg-white`}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black text-slate-500 px-2 uppercase tracking-widest">비밀번호</Label>
                <Input 
                  id="password"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${adminUi.input} h-14 rounded-2xl text-slate-900 focus:ring-teal-500/20 text-sm tracking-[0.3em] shadow-inner transition-all hover:bg-slate-100 focus:bg-white`}
                  required
                />
              </div>

              {error && (
                <div className="text-[10px] text-rose-500 font-bold bg-rose-50 py-3 rounded-xl text-center border border-rose-100">
                  ⚠️ {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className={cn("w-full h-14 rounded-2xl text-sm active:scale-[0.98]", adminUi.darkButton)}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "로그인"}
              </Button>
            </form>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
              <p className="text-[11px] font-bold text-slate-500">
                관리자 계정은 이메일/비밀번호 로그인만 지원합니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center pt-4 mb-8">
           <div className="space-y-1 text-[10px] text-slate-400 font-bold text-center w-full leading-relaxed">
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
