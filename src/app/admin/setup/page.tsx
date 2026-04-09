import { redirect } from "next/navigation";

export const runtime = "edge";

/**
 * 과거 관리자 부트스트랩용 경로. 운영에서 평문 비밀번호 노출을 막기 위해 비활성화했습니다.
 * 최초 플랫폼 관리자는 D1에서 `user.role = 'platform_admin'` 부여 또는 회원가입 후 DB 수정으로 처리하세요.
 */
export default function AdminSetupPage() {
  redirect("/admin/login");
}
