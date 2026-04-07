import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: Request) {
    try {
        const context = getRequestContext();
        const auth = getAuth(context.env);
        return await auth.handler(req);
    } catch (e: any) {
        console.error("Auth GET error:", e);
        return NextResponse.json({ 
            error: "Auth GET Handler Failed", 
            message: e.message || String(e),
            stack: e.stack 
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const context = getRequestContext();
        const auth = getAuth(context.env);
        return await auth.handler(req);
    } catch (e: any) {
        console.error("Auth POST error:", e);
        return NextResponse.json({ 
            error: "Auth POST Handler Failed", 
            message: e.message || String(e),
            stack: e.stack 
        }, { status: 500 });
    }
}
