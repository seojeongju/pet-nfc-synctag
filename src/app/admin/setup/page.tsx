import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { headers } from "next/headers";

export const runtime = "edge";

export default async function AdminSetupPage() {
  // 이 페이지는 오직 로컬 개발 환경이나 특정 환경 변수가 있을 때만 작동하도록 보호할 수 있습니다.
  // 실제 운영 환경에서는 계정 생성 후 이 파일을 삭제해 주세요.
  
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-10 font-outfit">
      <div className="max-w-md w-full space-y-8 bg-slate-900 p-10 rounded-[40px] border border-slate-800 shadow-2xl">
        <h1 className="text-2xl font-black text-teal-500 uppercase tracking-tighter">Admin Setup Tool</h1>
        <p className="text-slate-400 text-sm">
          이 도구는 최초 관리자 계정을 생성하기 위해 사용됩니다. 
          아래 버튼을 누르면 설정된 정보로 관리자 계정이 생성됩니다.
        </p>
        
        <div className="p-4 bg-slate-800 rounded-2xl space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Target Account</p>
            <p className="text-sm font-black text-white">ID: jayseo36@gmail.com</p>
            <p className="text-xs text-rose-400 font-bold">⚠️ 생성 후 이 페이지 파일을 반드시 삭제하세요!</p>
        </div>

        <form action={async () => {
          "use server";
          // 이 부분은 서버에서 실행됩니다.
          const context = getRequestContext();
          const auth = getAuth(context.env);
          
          try {
            // 1. 이미 존재하는지 확인 또는 바로 생성 시도
            const user = await auth.api.signUpEmail({
              body: {
                email: "jayseo36@gmail.com",
                password: "password123!", // 임시 비밀번호 (변경 권장)
                name: "Admin",
              },
            });

            // 2. 관리자 권한 부여 (role 업데이트)
            await context.env.DB.prepare(
                "UPDATE user SET role = 'admin' WHERE email = ?"
            ).bind("jayseo36@gmail.com").run();

            console.log("Admin created successfully");
          } catch (e) {
            console.error("Setup failed:", e);
          }
        }}>
          <button type="submit" className="w-full h-14 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-2xl transition-all active:scale-95">
             관리자 계정 생성하기
          </button>
        </form>
      </div>
    </div>
  );
}
