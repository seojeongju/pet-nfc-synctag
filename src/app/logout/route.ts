import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

async function performLogout(req: NextRequest) {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const origin = new URL("/", req.url);

    const signOutResponse = await auth.api.signOut({
        headers: req.headers,
        asResponse: true,
    });

    const response = NextResponse.redirect(origin);

    // better-auth가 반환한 Set-Cookie를 redirect 응답으로 전달해 세션을 확실히 제거한다.
    const setCookie = signOutResponse.headers.get("set-cookie");
    if (setCookie) {
        response.headers.append("set-cookie", setCookie);
    }
    return response;
}

export async function GET(req: NextRequest) {
    return performLogout(req);
}

export async function POST(req: NextRequest) {
    return performLogout(req);
}
