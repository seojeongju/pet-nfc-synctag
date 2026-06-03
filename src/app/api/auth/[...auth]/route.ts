import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { NextResponse } from "next/server";

export const runtime = "edge";
const toError = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)));

export async function GET(req: Request) {
    try {
        const context = getCfRequestContext();
        const auth = getAuth(context.env);
        return await auth.handler(req);
    } catch (e: unknown) {
        const err = toError(e);
        console.error("Auth GET error:", {
            message: err.message,
            name: err.name,
            stack: err.stack,
            cause: (err as Error & { cause?: unknown }).cause
        });
        return NextResponse.json({ 
            error: "Auth GET Handler Failed", 
            message: err.message || String(e),
            details: err.toString(),
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined 
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const context = getCfRequestContext();
        const auth = getAuth(context.env);
        return await auth.handler(req);
    } catch (e: unknown) {
        const err = toError(e);
        console.error("Auth POST error:", {
            message: err.message,
            name: err.name,
            stack: err.stack,
            cause: (err as Error & { cause?: unknown }).cause
        });
        return NextResponse.json({ 
            error: "Auth POST Handler Failed", 
            message: err.message || String(e),
            details: err.toString(),
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined 
        }, { status: 500 });
    }
}
