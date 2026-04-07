import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const context = getRequestContext();
    const auth = getAuth(context.env);

    await auth.api.signOut({
        headers: await headers(),
    });

    return redirect("/");
}
