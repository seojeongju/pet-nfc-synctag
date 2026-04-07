import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, MessageSquare, ArrowLeft, Lock, Loader2 } from "lucide-react";
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
        // 로그인 성공 시 리다이렉트
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
    <div className="min-h-screen bg-slate-900 flex flex-col font-outfit items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

      <Link href="/" className="absolute top-8 left-8 z-20">
        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl hover:bg-white/20 transition-all text-white active:scale-90">
           <ArrowLeft className="w-6 h-6" />
        </div>
      </Link>

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-1000 relative z-10">
        <div className="text-center space-y-4">
           <div className="w-24 h-24 bg-slate-800 rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700 flex items-center justify-center text-teal-400 mx-auto transform hover:rotate-12 transition-transform duration-500">
              <ShieldCheck className="w-12 h-12" />
           </div>
           <div className="space-y-2">
             <div className="flex items-center justify-center gap-2 text-teal-500 font-black tracking-widest text-[10px] uppercase">
                <Lock className="w-3 h-3" />
                Authorized Seller Access
             </div>
             <h1 className="text-4xl font-black text-white tracking-tight">판매자 센터</h1>
             <p className="text-slate-400 text-sm font-bold">전용 계정 정보로 안전하게 로그인하세요.</p>
           </div>
        </div>

        <Card className="border-slate-800 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] rounded-[48px] overflow-hidden bg-slate-800/50 backdrop-blur-2xl border">
          <CardHeader className="pt-10 pb-4 text-center">
            <CardTitle className="text-xl font-bold text-white">전용 로그린</CardTitle>
            <CardDescription className="text-slate-500 text-xs font-bold">
              ID 및 비밀번호를 입력해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10 pt-4 space-y-6">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-tighter">Admin ID (Email)</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="admin@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-slate-900/50 border-slate-700 rounded-2xl text-white focus:ring-teal-500 text-sm font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-tighter">Password</Label>
                <Input 
                  id="password"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-slate-900/50 border-slate-700 rounded-2xl text-white focus:ring-teal-500 text-sm font-bold tracking-widest"
                  required
                />
              </div>

              {error && (
                <p className="text-[10px] text-rose-500 font-bold bg-rose-500/10 py-2 rounded-lg text-center animate-shake">
                  ❌ {error}
                </p>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-2xl text-md shadow-xl shadow-teal-500/20 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "관리 시작하기"}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-700/50"></span></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-slate-800/10 px-4 text-slate-600 backdrop-blur-xl">OR Login With</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-slate-700 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs transition-all active:scale-[0.98]"
                onClick={() => handleSocialLogin("google")}
              >
                Google
              </Button>

              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-none bg-[#FEE500] hover:bg-[#FEE500]/90 text-slate-900 font-bold text-xs transition-all active:scale-[0.98]"
                onClick={() => handleSocialLogin("kakao")}
              >
                Kakao
              </Button>
            </div>

            <div className="pt-6 text-center">
               <p className="text-[10px] text-slate-600 font-bold leading-relaxed max-w-[200px] mx-auto opacity-50">
                 Authorized Access Only. All activities are monitored.
               </p>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center pt-4">
           <p className="text-[10px] text-slate-600 font-black tracking-widest uppercase">
             Seller Management System © 2024
           </p>
        </footer>
      </div>
    </div>
  );
}
