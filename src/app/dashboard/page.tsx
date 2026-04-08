import { getPets } from "@/app/actions/pet";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRequestContext } from "@cloudflare/next-on-pages";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { parseSubjectKind } from "@/lib/subject-kind";

export const runtime = "edge";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  try {
    const { kind: kindParam } = await searchParams;
    const subjectKind = parseSubjectKind(kindParam);

    const context = getRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      redirect("/login");
    }

    const pets = await getPets(session.user.id, subjectKind);
    const roleRow = await context.env.DB
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(session.user.id)
        .first<{ role?: string | null }>();
    const isAdmin = roleRow?.role === "admin";

    return (
      <DashboardClient 
        session={session}
        pets={pets || []}
        isAdmin={isAdmin}
        subjectKind={subjectKind}
      />
    );
  } catch (error: unknown) {
    const redirectError = error as { digest?: string };
    if (redirectError.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    
    console.error("Dashboard error:", error);
    redirect("/login");
  }
}
