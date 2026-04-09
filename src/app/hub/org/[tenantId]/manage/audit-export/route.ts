import { getTenantOrgAuditLogs } from "@/app/actions/admin-tenants";
import { buildTenantAuditCsv } from "@/lib/tenant-audit-format";

export const runtime = "edge";

export async function GET(req: Request, context: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await context.params;
  const url = new URL(req.url);
  const action = url.searchParams.get("audit_action") ?? "";
  const actor = url.searchParams.get("audit_q") ?? "";
  const auditFrom = url.searchParams.get("audit_from") ?? "";
  const auditTo = url.searchParams.get("audit_to") ?? "";

  let rows;
  try {
    rows = await getTenantOrgAuditLogs(tenantId, {
      action: action || undefined,
      actorContains: actor || undefined,
      dateFrom: auditFrom || undefined,
      dateTo: auditTo || undefined,
      limit: 2000,
    });
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const csv = buildTenantAuditCsv(rows);
  const safe = tenantId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "tenant";
  const filename = `tenant-audit-${safe}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
