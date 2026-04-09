import type { TenantAuditLogRow } from "@/app/actions/admin-tenants";

function roleLabel(role: "owner" | "admin" | "member") {
  if (role === "owner") return "소유자";
  if (role === "admin") return "관리자";
  return "멤버";
}

export function auditActionLabelKo(action: string): string {
  switch (action) {
    case "tenant_create_by_admin":
      return "조직 생성";
    case "tenant_rename_by_admin":
      return "조직명 변경";
    case "tenant_member_upsert_by_admin":
      return "멤버 추가·갱신";
    case "tenant_member_role_change_by_admin":
      return "멤버 역할 변경";
    case "tenant_member_remove_by_admin":
      return "멤버 제거";
    case "tenant_status_change_by_admin":
      return "조직 상태 변경";
    case "tenant_invite_create_by_admin":
      return "초대 발급";
    default:
      return action;
  }
}

export function auditPayloadSummaryKo(action: string, raw: string | null): string {
  if (!raw) return "";
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    switch (action) {
      case "tenant_create_by_admin": {
        const parts = [p.name, p.slug, p.ownerEmail].filter((x) => typeof x === "string" && x);
        return parts.join(" · ");
      }
      case "tenant_rename_by_admin":
        return typeof p.name === "string" ? `→ ${p.name}` : "";
      case "tenant_member_upsert_by_admin": {
        const email = typeof p.email === "string" ? p.email : "";
        const r = typeof p.role === "string" ? roleLabel(p.role as "owner" | "admin" | "member") : "";
        return [email, r].filter(Boolean).join(" · ");
      }
      case "tenant_member_role_change_by_admin":
        return typeof p.role === "string" ? roleLabel(p.role as "owner" | "admin" | "member") : "";
      case "tenant_member_remove_by_admin":
        return typeof p.userId === "string" ? `user: ${p.userId.slice(0, 8)}…` : "";
      case "tenant_status_change_by_admin":
        return p.status === "suspended" ? "중지됨" : "활성";
      case "tenant_invite_create_by_admin": {
        const email = typeof p.email === "string" ? p.email : "";
        const r = typeof p.role === "string" ? roleLabel(p.role as "owner" | "admin" | "member") : "";
        return [email, r].filter(Boolean).join(" · ");
      }
      default:
        return "";
    }
  } catch {
    return "";
  }
}

export function formatTenantAuditRow(row: TenantAuditLogRow) {
  const summary = auditPayloadSummaryKo(row.action, row.payload);
  const label = auditActionLabelKo(row.action);
  const when = new Date(row.created_at).toLocaleString("ko-KR");
  const who = row.actor_email ?? "—";
  return { label, summary, when, who };
}

function csvEscapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function buildTenantAuditCsv(rows: TenantAuditLogRow[]): string {
  const header = ["id", "action", "action_label_ko", "summary_ko", "actor_email", "payload", "created_at"];
  const lines = [header.join(",")];
  for (const row of rows) {
    const summary = auditPayloadSummaryKo(row.action, row.payload);
    const label = auditActionLabelKo(row.action);
    const line = [
      String(row.id),
      csvEscapeCell(row.action),
      csvEscapeCell(label),
      csvEscapeCell(summary),
      csvEscapeCell(row.actor_email ?? ""),
      csvEscapeCell(row.payload ?? ""),
      csvEscapeCell(row.created_at),
    ].join(",");
    lines.push(line);
  }
  return "\ufeff" + lines.join("\r\n");
}