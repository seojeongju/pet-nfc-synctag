import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { SUBJECT_KINDS } from "@/lib/subject-kind";
import { parseSelectedMode, SELECTED_MODE_COOKIE_NAME } from "@/lib/selected-mode";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

function postLogoutLocation(req: NextRequest): URL {
    const base = new URL(req.url);
    const kind = req.nextUrl.searchParams.get("kind")?.trim() ?? "";
    if (kind && (SUBJECT_KINDS as readonly string[]).includes(kind)) {
        return new URL(`/${encodeURIComponent(kind)}`, base);
    }
    const selectedMode = parseSelectedMode(req.cookies.get(SELECTED_MODE_COOKIE_NAME)?.value);
    if (selectedMode) {
        return new URL(`/${encodeURIComponent(selectedMode)}`, base);
    }
    return new URL("/", base);
}

async function performLogout(req: NextRequest) {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const afterLogout = postLogoutLocation(req);

    const signOutResponse = await auth.api.signOut({
        headers: req.headers,
        asResponse: true,
    });

    const response = NextResponse.redirect(afterLogout);

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
