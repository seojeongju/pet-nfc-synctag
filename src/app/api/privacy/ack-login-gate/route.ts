import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "edge";

/** OAuth 직전: 로그인 화면에서 필수 3항목을 체크한 경우에만 호출 — /consent에서 D1 기록용 쿠키 */
const COOKIE = "lgu_ok";

export async function POST() {
  const c = await cookies();
  c.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return NextResponse.json({ ok: true } as const);
}
