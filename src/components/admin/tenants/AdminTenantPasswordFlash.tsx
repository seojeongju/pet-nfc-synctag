"use client";

import { useEffect } from "react";
import { clearAdminTenantPwFlashCookie } from "@/app/actions/admin-tenants";

export default function AdminTenantPasswordFlash({
  email,
  temporaryPassword,
}: {
  email: string;
  temporaryPassword: string;
}) {
  useEffect(() => {
    void clearAdminTenantPwFlashCookie();
  }, []);

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 break-all space-y-1">
      <p>조직관리자 비밀번호 재생성 완료: {email}</p>
      <p>
        임시 비밀번호: <span className="font-mono font-black">{temporaryPassword}</span>
      </p>
      <p className="text-[12px] font-semibold text-amber-700">
        보안상 이 비밀번호는 안전한 채널로만 전달하고, 전달 후 즉시 화면에서 이탈하세요.
      </p>
    </div>
  );
}
