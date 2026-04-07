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
        console.error("Auth GET error:", {
            message: e.message,
            name: e.name,
            stack: e.stack,
            cause: e.cause
        });
        return NextResponse.json({ 
            error: "Auth GET Handler Failed", 
            message: e.message || String(e),
            details: e.toString(),
            stack: process.env.NODE_ENV === "development" ? e.stack : undefined 
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const context = getRequestContext();
        const auth = getAuth(context.env);
        return await auth.handler(req);
    } catch (e: any) {
        console.error("Auth POST error:", {
            message: e.message,
            name: e.name,
            stack: e.stack,
            cause: e.cause
        });
        return NextResponse.json({ 
            error: "Auth POST Handler Failed", 
            message: e.message || String(e),
            details: e.toString(),
            stack: process.env.NODE_ENV === "development" ? e.stack : undefined 
        }, { status: 500 });
    }
}
