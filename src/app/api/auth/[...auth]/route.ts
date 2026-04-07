import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(req: Request) {
    const context = getRequestContext();
    const auth = getAuth(context.env);
    return auth.handler(req);
}

export async function POST(req: Request) {
    const context = getRequestContext();
    const auth = getAuth(context.env);
    return auth.handler(req);
}
