import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { adminUi } from "@/styles/admin/ui";

export const runtime = "edge";

export default async function AdminSetupPage() {
  const adminEmail = "wow3d16@naver.com";
  const adminPassword = "wow3d3144";

  // 이 페이지는 오직 로컬 개발 환경이나 특정 환경 변수가 있을 때만 작동하도록 보호할 수 있습니다.
  // 실제 운영 환경에서는 계정 생성 후 이 파일을 삭제해 주세요.
  
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 flex flex-col items-center justify-center p-10 font-outfit">
      <div className={`max-w-md w-full space-y-8 ${adminUi.sectionCard}`}>
        <h1 className="text-2xl font-black text-teal-500 uppercase tracking-tighter">관리자 초기 설정 도구</h1>
        <p className="text-slate-500 text-sm">
          이 도구는 최초 관리자 계정을 생성하기 위해 사용됩니다. 
          아래 버튼을 누르면 설정된 정보로 관리자 계정이 생성됩니다.
        </p>
        
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">대상 계정</p>
            <p className="text-sm font-black text-slate-900">ID: {adminEmail}</p>
            <p className="text-xs text-rose-500 font-bold">⚠️ 생성 후 이 페이지 파일을 반드시 삭제하세요!</p>
        </div>

        <form action={async () => {
          "use server";
          // 이 부분은 서버에서 실행됩니다.
          const context = getRequestContext();
          const auth = getAuth(context.env);
          
          try {
            const existing = await context.env.DB
              .prepare("SELECT id FROM user WHERE email = ?")
              .bind(adminEmail)
              .first<{ id: string }>();

            // 1. 계정이 없을 때만 생성
            if (!existing) {
              await auth.api.signUpEmail({
                body: {
                  email: adminEmail,
                  password: adminPassword,
                  name: "Admin",
                },
              });
            }

            // 2. 관리자 권한 부여 (role 업데이트)
            await context.env.DB.prepare(
                "UPDATE user SET role = 'admin' WHERE email = ?"
            ).bind(adminEmail).run();

            console.log("Admin bootstrap completed");
          } catch (e) {
            console.error("Setup failed:", e);
            throw e;
          }
        }}>
          <button type="submit" className="w-full h-14 bg-slate-900 hover:bg-teal-500 text-white font-black rounded-2xl transition-all active:scale-95 shadow-xl">
             관리자 계정 생성하기
          </button>
        </form>
      </div>
    </div>
  );
}
