export function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const o = error as { digest?: unknown; message?: unknown };
  if (typeof o.digest === "string" && o.digest.includes("NEXT_REDIRECT")) return true;
  if (o.message === "NEXT_REDIRECT") return true;
  return false;
}