"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowLeft, Lock, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSocialLogin = async (provider: "google" | "kakao") => {
    await signIn.social({
      provider,
      callbackURL: "/admin",
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await signIn.email({
        email,
        password,
        callbackURL: "/admin",
      });

      if (signInError) {
        setError(signInError.message || "로그인에 실패했습니다. 정보를 확인해 주세요.");
      } else {
        router.push("/admin");
      }
    } catch (err: any) {
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
                Authorized Console Access
             </div>
             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">판매자 로그인</h1>
             <p className="text-slate-400 text-sm font-medium">Seller Management Center</p>
           </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[40px] overflow-hidden bg-white/80 backdrop-blur-md">
          <CardHeader className="pt-10 pb-6 text-center">
            <CardTitle className="text-xl font-bold text-slate-800">Secure Login</CardTitle>
            <CardDescription className="text-slate-400">Enter credentials to initiate session</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10 space-y-7">
            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black text-slate-500 px-2 uppercase tracking-widest">Admin Identifier</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="admin@petid-connect.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-slate-900 focus:ring-teal-500/20 text-sm font-bold shadow-inner transition-all hover:bg-slate-100 focus:bg-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black text-slate-500 px-2 uppercase tracking-widest">Access Token</Label>
                <Input 
                  id="password"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-slate-50 border-slate-100 rounded-2xl text-slate-900 focus:ring-teal-500/20 text-sm font-bold tracking-[0.3em] shadow-inner transition-all hover:bg-slate-100 focus:bg-white"
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
                className="w-full h-14 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-2xl text-sm shadow-xl hover:shadow-slate-500/20 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "콘솔 인증하기"}
              </Button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest"><span className="bg-white/80 px-4 text-slate-400 backdrop-blur-xl">Or Social Access</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-slate-100 bg-white hover:bg-slate-50 text-slate-700 font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-sm flex items-center justify-center"
                onClick={() => handleSocialLogin("google")}
              >
                Google
              </Button>

              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-none bg-[#FEE500] hover:bg-[#FEE500]/90 text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                onClick={() => handleSocialLogin("kakao")}
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                Kakao
              </Button>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center pt-4 mb-8">
           <p className="text-[10px] text-slate-400 font-black tracking-[0.4em] uppercase text-center w-full">
             Seller Management System © 2024
           </p>
        </footer>
      </div>
    </div>
  );
}
