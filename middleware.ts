import { NextResponse, type NextRequest } from "next/server";
import { SELECTED_MODE_COOKIE_MAX_AGE_SECONDS, SELECTED_MODE_COOKIE_NAME } from "@/lib/selected-mode";

const MODE_BY_PATH: Record<string, "pet" | "elder" | "child" | "luggage" | "gold"> = {
  "/pet": "pet",
  "/elder": "elder",
  "/child": "child",
  "/luggage": "luggage",
  "/gold": "gold",
};

export function middleware(req: NextRequest) {
  const mode = MODE_BY_PATH[req.nextUrl.pathname];
  if (!mode) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  res.cookies.set(SELECTED_MODE_COOKIE_NAME, mode, {
    path: "/",
    maxAge: SELECTED_MODE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export const config = {
  matcher: ["/pet", "/elder", "/child", "/luggage", "/gold"],
};
