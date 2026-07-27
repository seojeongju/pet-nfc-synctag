/**
 * admin_action_logs.action 값 → 운영자용 한글 라벨
 * DB에만 있는 커스텀 값은 그대로 보조 표시
 */
const LABELS: Record<string, string> = {
  bulk_register: "대량 등록",
  nfc_web_write: "Web 기록",
  nfc_web_read: "Web 읽기",
  nfc_native_write: "앱 기록",
  nfc_native_write_rejected: "앱 기록 거부",
  nfc_native_handoff: "앱 연결",
  tag_link: "연결",
  tag_unlink: "해제",
  platform_user_role: "역할 변경",
  platform_user_email: "이메일 변경",
  platform_user_password_reset: "비밀번호 초기화",
  platform_user_subscription: "플랜 변경",
  platform_user_delete: "계정 삭제",
  tenant_create_by_admin: "조직 생성",
  tenant_member_upsert_by_admin: "멤버 등록",
  tenant_member_role_change_by_admin: "멤버 역할",
  tenant_member_remove_by_admin: "멤버 제거",
  tenant_status_change_by_admin: "조직 상태",
  tenant_rename_by_admin: "조직명",
  tenant_allowed_modes_by_admin: "허용 모드",
  tenant_invite_create_by_admin: "초대 생성",
};

export function getAdminActionDisplayLabel(action: string): string {
  const key = (action ?? "").trim();
  if (!key) return "—";
  return LABELS[key] ?? key;
}
