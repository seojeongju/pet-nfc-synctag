"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowLeft, Lock, Loader2, Activity, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } as any }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-outfit items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 left-8 z-20"
      >
        <Link href="/">
          <div className="w-12 h-12 rounded-2xl glass-dark border-white/5 flex items-center justify-center shadow-2xl hover:bg-white/10 transition-all text-white active:scale-90">
             <ArrowLeft className="w-6 h-6" />
          </div>
        </Link>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm space-y-10 relative z-10"
      >
        <motion.div variants={itemVariants} className="text-center space-y-2">
           <motion.div 
            whileHover={{ rotate: 12 }}
            className="w-24 h-24 bg-slate-900 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 flex items-center justify-center text-teal-400 mx-auto transition-transform duration-500 mb-6"
           >
              <ShieldCheck className="w-12 h-12" />
           </motion.div>
           <div className="space-y-2">
             <div className="flex items-center justify-center gap-2 text-teal-500 font-black tracking-[0.2em] text-[9px] uppercase">
                <Lock className="w-3.5 h-3.5" />
                Authorized Console Access
             </div>
             <h1 className="text-4xl font-black text-white tracking-tight text-center">판매자 로그인</h1>
             <p className="text-slate-500 text-xs font-bold uppercase tracking-wider text-center">Seller Management Center</p>
           </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-white/5 shadow-2xl rounded-[40px] overflow-hidden bg-slate-900/50 backdrop-blur-2xl border relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
            
            <CardHeader className="pt-12 pb-6 text-center">
              <CardTitle className="text-2xl font-black text-white tracking-tight italic">Secure Login</CardTitle>
              <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest pt-1 text-center">
                Enter credentials to initiate session
              </CardDescription>
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
                    className="h-16 bg-slate-950/80 border-white/5 rounded-2xl text-white focus:ring-teal-500/20 text-sm font-bold shadow-inner transition-all focus:border-teal-500/40"
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
                    className="h-16 bg-slate-950/80 border-white/5 rounded-2xl text-white focus:ring-teal-500/20 text-sm font-bold tracking-[0.3em] shadow-inner transition-all focus:border-teal-500/40"
                    required
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] text-rose-400 font-bold bg-rose-500/10 py-3 rounded-xl text-center border border-rose-500/10"
                    >
                      ⚠️ {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-16 bg-white hover:bg-teal-500 text-slate-950 hover:text-white font-black rounded-2xl text-sm shadow-xl hover:shadow-teal-500/10 transition-all active:scale-95 group"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin text-teal-500" /> : "콘솔 인증하기"}
                </Button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
                <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest"><span className="bg-transparent px-4 text-slate-600 backdrop-blur-xl">Or Social Access</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-14 rounded-2xl border-white/5 bg-slate-950 hover:bg-white hover:text-slate-950 text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                  onClick={() => handleSocialLogin("google")}
                >
                  Google
                </Button>

                <Button 
                  variant="outline" 
                  className="h-14 rounded-2xl border-none bg-[#FEE500] hover:bg-[#FEE500]/90 text-slate-950 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                  onClick={() => handleSocialLogin("kakao")}
                >
                  Kakao
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.footer variants={itemVariants} className="text-center pt-4 space-y-4 text-center">
           <div className="flex items-center justify-center gap-6 opacity-20">
              <Activity className="w-4 h-4 text-slate-500" />
              <Globe className="w-4 h-4 text-slate-500" />
              <ShieldCheck className="w-4 h-4 text-slate-500" />
           </div>
           <p className="text-[10px] text-slate-700 font-black tracking-[0.4em] uppercase text-center w-full">
             Seller Management System © 2024
           </p>
        </motion.footer>
      </motion.div>
    </div>
  );
}
