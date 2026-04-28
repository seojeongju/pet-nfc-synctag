"use server";

import { hashPassword } from "better-auth/crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB } from "@/lib/db";
import { isPasswordChangeRequired, setPasswordChangeRequired } from "@/lib/password-change";

const MIN_PASSWORD_LEN = 8;
const MAX_PASSWORD_LEN = 128;
const CREDENTIAL_PROVIDER = "credential" as const;

function assertPasswordPolicy(password: string) {
  if (password.length < MIN_PASSWORD_LEN) {
    throw new Error(`비밀번호는 ${MIN_PASSWORD_LEN}자 이상이어야 합니다.`);
  }
  if (password.length > MAX_PASSWORD_LEN) {
    throw new Error(`비밀번호는 ${MAX_PASSWORD_LEN}자를 넘을 수 없습니다.`);
  }
}

export async function completeForcedPasswordChange(formData: FormData) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login?kind=pet");
  }

  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  if (!password || !passwordConfirm) {
    throw new Error("새 비밀번호와 확인 비밀번호를 모두 입력해 주세요.");
  }
  if (password !== passwordConfirm) {
    throw new Error("비밀번호 확인이 일치하지 않습니다.");
  }
  assertPasswordPolicy(password);

  const db = getDB();
  const required = await isPasswordChangeRequired(db, userId);
  if (!required) {
    redirect("/hub");
  }

  const hashed = await hashPassword(password);
  const credential = await db
    .prepare("SELECT id FROM account WHERE userId = ? AND providerId = ? LIMIT 1")
    .bind(userId, CREDENTIAL_PROVIDER)
    .first<{ id: string }>();
  if (!credential?.id) {
    throw new Error("비밀번호 로그인 계정이 없어 변경할 수 없습니다. 관리자에게 문의하세요.");
  }

  await db
    .prepare(
      `UPDATE account
       SET password = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE userId = ? AND providerId = ?`
    )
    .bind(hashed, userId, CREDENTIAL_PROVIDER)
    .run();
  await setPasswordChangeRequired(db, userId, false);
  await db.prepare("DELETE FROM session WHERE userId = ?").bind(userId).run();

  redirect("/login?kind=pet&msg=" + encodeURIComponent("비밀번호가 변경되었습니다. 다시 로그인해 주세요."));
}
