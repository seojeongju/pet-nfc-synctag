import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(req: Request) {
    const context = getRequestContext();
    const auth = getAuth(context.env.DB as unknown as D1Database);
    return auth.handler(req);
}

export async function POST(req: Request) {
    const context = getRequestContext();
    const auth = getAuth(context.env.DB as unknown as D1Database);
    return auth.handler(req);
}
