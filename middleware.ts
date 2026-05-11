import { NextResponse, type NextRequest } from "next/server";
import { SELECTED_MODE_COOKIE_MAX_AGE_SECONDS, SELECTED_MODE_COOKIE_NAME } from "@/lib/selected-mode";

const WWW_PREFIX = "www.";
const MODE_BY_PATH: Record<string, "pet" | "elder" | "child" | "luggage" | "gold"> = {
  "/pet": "pet",
  "/elder": "elder",
  "/child": "child",
  "/luggage": "luggage",
  "/gold": "gold",
};

export function middleware(req: NextRequest) {
  const hostname = req.nextUrl.hostname.toLowerCase();
  if (hostname.startsWith(WWW_PREFIX)) {
    const apexUrl = req.nextUrl.clone();
    apexUrl.hostname = hostname.slice(WWW_PREFIX.length);
    return NextResponse.redirect(apexUrl, 308);
  }

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
  matcher: ["/:path*"],
};
